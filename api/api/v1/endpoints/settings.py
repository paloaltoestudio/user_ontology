from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging

from core.database import get_db
from core.security import get_current_admin
from models.user import User
from models.api_key import ApiKey
from schemas.api_key import (
    ApiKeyCreate,
    ApiKeyResponse,
    ApiKeyCreateResponse,
    ApiKeyUpdate,
)
from services.api_key_service import generate_api_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.post("/api-keys", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    request: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Create a new API key for external integrations (admin only).

    Scopes determine which features the API key can access:
    - `goals`: Can submit goal completion events
    - `webhooks`: Can trigger webhook endpoints
    - `integrations`: Can access integration APIs
    """
    api_key = ApiKey(
        key=generate_api_key(),
        name=request.name,
        description=request.description,
        scopes=request.scopes,
        created_by=admin_user.id,
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    logger.info(
        f"API key created: id={api_key.id}, name={request.name}, "
        f"scopes={request.scopes}, created_by={admin_user.id}"
    )
    return api_key


@router.get("/api-keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    scope: Optional[str] = Query(None, description="Filter by scope"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    List all API keys (admin only, does not return actual keys).

    Optional filters:
    - `scope`: Filter keys that have a specific scope (e.g., "goals")
    - `is_active`: Filter by active/inactive status
    """
    query = select(ApiKey)

    if is_active is not None:
        query = query.where(ApiKey.is_active == is_active)

    # Note: scope filtering is done in Python since it's a JSON array
    # This is acceptable for admin endpoints with limited data
    query = query.order_by(ApiKey.created_at.desc())
    result = await db.execute(query)
    api_keys = result.scalars().all()

    # Filter by scope if provided
    if scope:
        api_keys = [key for key in api_keys if scope in key.scopes]

    return api_keys


@router.get("/api-keys/{key_id}", response_model=ApiKeyResponse)
async def get_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get details of a specific API key (admin only, does not return actual key)"""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id)
    )
    api_key = result.scalars().first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    return api_key


@router.put("/api-keys/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: int,
    request: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Update an API key's name, description, or scopes (admin only)"""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id)
    )
    api_key = result.scalars().first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(api_key, field, value)

    await db.commit()
    await db.refresh(api_key)
    logger.info(f"API key updated: id={key_id}, updated_by={admin_user.id}")
    return api_key


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Deactivate an API key (soft delete - key remains in DB for audit purposes).

    Once deactivated, the key cannot be used to authenticate requests.
    """
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id)
    )
    api_key = result.scalars().first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    api_key.is_active = False
    await db.commit()
    logger.info(f"API key deactivated: id={key_id}, deactivated_by={admin_user.id}")
