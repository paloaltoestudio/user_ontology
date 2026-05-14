from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from dataclasses import dataclass
from datetime import datetime
import logging

from core.database import get_db
from core.security import get_current_admin, get_current_account
from core.config import settings
from models.user import User
from models.account import Account
from models.lead import Lead, LeadStageHistory
from models.lead_primitives import LeadEvent, LeadProperty, LeadTag
from models.catalog import StageDefinition, TagDefinition, PropertyDefinition, EventTypeDefinition
from schemas.lead_primitives import (
    LeadEventCreate, LeadEventResponse,
    LeadPropertyUpsert, LeadPropertyResponse,
    LeadTagCreate, LeadTagResponse,
    LeadStageUpdate, LeadStageHistoryResponse,
)
from services.api_key_service import validate_api_key_scope

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

@dataclass
class LeadsAuthCtx:
    source: str           # "admin:<email>" or api key name
    account_id: Optional[int]  # set for admin auth; None means "resolve from lead"


async def _resolve_auth(
    authorization: Optional[str],
    db: AsyncSession,
) -> LeadsAuthCtx:
    """Accept either JWT admin Bearer or API key Bearer with 'leads' scope."""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization required")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")

    token = parts[1]

    # API key path (sk_ prefix)
    if token.startswith("sk_"):
        is_valid, api_key = await validate_api_key_scope(token, "leads", db)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key or insufficient scope. Key must have 'leads' scope.",
            )
        return LeadsAuthCtx(source=api_key.name, account_id=None)

    # JWT path — decode and fetch user+account inline
    try:
        from jose import JWTError, jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    from models.user import User as UserModel
    from models.account import Account as AccountModel, Membership
    result = await db.execute(select(UserModel).where(UserModel.id == int(user_id)))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    if not user.last_active_account_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="no_account")

    account_result = await db.execute(
        select(AccountModel)
        .join(Membership, Membership.account_id == AccountModel.id)
        .where(
            AccountModel.id == user.last_active_account_id,
            Membership.user_id == user.id,
        )
    )
    account = account_result.scalars().first()
    if not account:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="no_account")

    return LeadsAuthCtx(source=f"admin:{user.email}", account_id=account.id)


async def _get_lead_for_auth(lead_id: int, auth: LeadsAuthCtx, db: AsyncSession) -> Lead:
    """Fetch lead and verify account ownership."""
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    # For API key auth, accept any lead (account scoping via lead.account_id)
    # For admin auth, enforce account ownership
    if auth.account_id is not None:
        if lead.account_id is not None and lead.account_id != auth.account_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return lead


# ---------------------------------------------------------------------------
# Catalog auto-create helpers
# ---------------------------------------------------------------------------

async def _ensure_stage_in_catalog(account_id: Optional[int], name: Optional[str], db: AsyncSession) -> None:
    if not account_id or not name:
        return
    existing = await db.execute(
        select(StageDefinition).where(
            StageDefinition.account_id == account_id,
            StageDefinition.name == name,
        )
    )
    if not existing.scalars().first():
        db.add(StageDefinition(account_id=account_id, name=name))


async def _ensure_tag_in_catalog(account_id: Optional[int], name: str, db: AsyncSession) -> None:
    if not account_id:
        return
    existing = await db.execute(
        select(TagDefinition).where(
            TagDefinition.account_id == account_id,
            TagDefinition.name == name,
        )
    )
    if not existing.scalars().first():
        db.add(TagDefinition(account_id=account_id, name=name))


async def _ensure_property_in_catalog(
    account_id: Optional[int], key: str, value_type: str, db: AsyncSession
) -> None:
    if not account_id:
        return
    existing = await db.execute(
        select(PropertyDefinition).where(
            PropertyDefinition.account_id == account_id,
            PropertyDefinition.key == key,
        )
    )
    if not existing.scalars().first():
        db.add(PropertyDefinition(account_id=account_id, key=key, value_type=value_type))


async def _ensure_event_type_in_catalog(account_id: Optional[int], name: str, db: AsyncSession) -> None:
    if not account_id:
        return
    existing = await db.execute(
        select(EventTypeDefinition).where(
            EventTypeDefinition.account_id == account_id,
            EventTypeDefinition.name == name,
        )
    )
    if not existing.scalars().first():
        db.add(EventTypeDefinition(account_id=account_id, name=name))


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

@router.post("/{lead_id}/events", response_model=LeadEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    lead_id: int,
    event_data: LeadEventCreate,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Append an immutable event to a lead. Accepts admin JWT or API key with 'leads' scope."""
    auth = await _resolve_auth(authorization, db)
    lead = await _get_lead_for_auth(lead_id, auth, db)

    event = LeadEvent(
        lead_id=lead.id,
        account_id=lead.account_id,
        event_type=event_data.event_type,
        payload=event_data.payload,
        source=auth.source,
    )
    db.add(event)
    await _ensure_event_type_in_catalog(lead.account_id, event_data.event_type, db)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{lead_id}/events", response_model=List[LeadEventResponse])
async def list_events(
    lead_id: int,
    event_type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    since: Optional[datetime] = Query(None, description="ISO datetime — return events after this"),
    until: Optional[datetime] = Query(None, description="ISO datetime — return events before this"),
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """List events for a lead. Filterable by event_type, source, and date range."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    filters = [LeadEvent.lead_id == lead_id]
    if event_type:
        filters.append(LeadEvent.event_type == event_type)
    if source:
        filters.append(LeadEvent.source == source)
    if since:
        filters.append(LeadEvent.created_at >= since)
    if until:
        filters.append(LeadEvent.created_at <= until)

    result = await db.execute(
        select(LeadEvent).where(and_(*filters)).order_by(LeadEvent.created_at.desc())
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Properties
# ---------------------------------------------------------------------------

@router.get("/{lead_id}/properties", response_model=List[LeadPropertyResponse])
async def list_properties(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """List all properties for a lead."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadProperty).where(LeadProperty.lead_id == lead_id).order_by(LeadProperty.key)
    )
    return result.scalars().all()


@router.put("/{lead_id}/properties/{key}", response_model=LeadPropertyResponse)
async def upsert_property(
    lead_id: int,
    key: str,
    body: LeadPropertyUpsert,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Upsert a property on a lead. Creates or updates the given key."""
    auth = await _resolve_auth(authorization, db)
    lead = await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadProperty).where(and_(LeadProperty.lead_id == lead_id, LeadProperty.key == key))
    )
    prop = result.scalars().first()

    if prop:
        prop.value = body.value
        prop.value_type = body.value_type
        prop.source = auth.source
        prop.updated_at = datetime.utcnow()
    else:
        prop = LeadProperty(
            lead_id=lead.id,
            account_id=lead.account_id,
            key=key,
            value=body.value,
            value_type=body.value_type,
            source=auth.source,
        )
        db.add(prop)

    await _ensure_property_in_catalog(lead.account_id, key, body.value_type, db)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.delete("/{lead_id}/properties/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    lead_id: int,
    key: str,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Remove a property from a lead."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadProperty).where(and_(LeadProperty.lead_id == lead_id, LeadProperty.key == key))
    )
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    await db.delete(prop)
    await db.commit()


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

@router.get("/{lead_id}/tags", response_model=List[LeadTagResponse])
async def list_tags(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """List all tags on a lead."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadTag).where(LeadTag.lead_id == lead_id).order_by(LeadTag.applied_at)
    )
    return result.scalars().all()


@router.post("/{lead_id}/tags", response_model=LeadTagResponse, status_code=status.HTTP_201_CREATED)
async def apply_tag(
    lead_id: int,
    body: LeadTagCreate,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Apply a tag to a lead. No-ops if the tag already exists (returns existing)."""
    auth = await _resolve_auth(authorization, db)
    lead = await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadTag).where(and_(LeadTag.lead_id == lead_id, LeadTag.name == body.name))
    )
    existing = result.scalars().first()
    if existing:
        return existing

    tag = LeadTag(
        lead_id=lead.id,
        account_id=lead.account_id,
        name=body.name,
        source=auth.source,
        applied_by=auth.source,
    )
    db.add(tag)
    await _ensure_tag_in_catalog(lead.account_id, body.name, db)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{lead_id}/tags/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag(
    lead_id: int,
    name: str,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Remove a tag from a lead."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadTag).where(and_(LeadTag.lead_id == lead_id, LeadTag.name == name))
    )
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    await db.delete(tag)
    await db.commit()


# ---------------------------------------------------------------------------
# Stage
# ---------------------------------------------------------------------------

@router.patch("/{lead_id}/stage", response_model=LeadStageHistoryResponse)
async def set_stage(
    lead_id: int,
    body: LeadStageUpdate,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Set the stage on a lead, logging the change to LeadStageHistory."""
    auth = await _resolve_auth(authorization, db)
    lead = await _get_lead_for_auth(lead_id, auth, db)

    history = LeadStageHistory(
        lead_id=lead.id,
        from_stage=lead.stage,
        to_stage=body.stage,
        changed_by=auth.source,
        note=body.note,
    )
    lead.stage = body.stage
    db.add(history)
    await _ensure_stage_in_catalog(lead.account_id, body.stage, db)
    await db.commit()
    await db.refresh(history)
    return history


@router.get("/{lead_id}/stage/history", response_model=List[LeadStageHistoryResponse])
async def get_stage_history(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Return the full stage change history for a lead."""
    auth = await _resolve_auth(authorization, db)
    await _get_lead_for_auth(lead_id, auth, db)

    result = await db.execute(
        select(LeadStageHistory)
        .where(LeadStageHistory.lead_id == lead_id)
        .order_by(LeadStageHistory.created_at)
    )
    return result.scalars().all()
