from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from core.database import get_db
from core.security import get_current_admin, get_current_account
from models.catalog import StageDefinition, TagDefinition, PropertyDefinition, EventTypeDefinition
from schemas.catalog import (
    StageDefinitionCreate, StageDefinitionUpdate, StageDefinitionResponse,
    TagDefinitionCreate, TagDefinitionUpdate, TagDefinitionResponse,
    PropertyDefinitionCreate, PropertyDefinitionUpdate, PropertyDefinitionResponse,
    EventTypeDefinitionCreate, EventTypeDefinitionUpdate, EventTypeDefinitionResponse,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


# ---------------------------------------------------------------------------
# Stage definitions
# ---------------------------------------------------------------------------

@router.get("/stages", response_model=List[StageDefinitionResponse])
async def list_stages(
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StageDefinition)
        .where(StageDefinition.account_id == account.id)
        .order_by(StageDefinition.sort_order, StageDefinition.name)
    )
    return result.scalars().all()


@router.post("/stages", response_model=StageDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_stage(
    body: StageDefinitionCreate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(StageDefinition).where(
            StageDefinition.account_id == account.id,
            StageDefinition.name == body.name,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Stage already exists")
    stage = StageDefinition(account_id=account.id, **body.model_dump())
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return stage


@router.put("/stages/{stage_id}", response_model=StageDefinitionResponse)
async def update_stage(
    stage_id: int,
    body: StageDefinitionUpdate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StageDefinition).where(
            StageDefinition.id == stage_id,
            StageDefinition.account_id == account.id,
        )
    )
    stage = result.scalars().first()
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stage not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(stage, field, value)
    await db.commit()
    await db.refresh(stage)
    return stage


@router.delete("/stages/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: int,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StageDefinition).where(
            StageDefinition.id == stage_id,
            StageDefinition.account_id == account.id,
        )
    )
    stage = result.scalars().first()
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stage not found")
    await db.delete(stage)
    await db.commit()


# ---------------------------------------------------------------------------
# Tag definitions
# ---------------------------------------------------------------------------

@router.get("/tags", response_model=List[TagDefinitionResponse])
async def list_tags(
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TagDefinition)
        .where(TagDefinition.account_id == account.id)
        .order_by(TagDefinition.name)
    )
    return result.scalars().all()


@router.post("/tags", response_model=TagDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    body: TagDefinitionCreate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(TagDefinition).where(
            TagDefinition.account_id == account.id,
            TagDefinition.name == body.name,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag already exists")
    tag = TagDefinition(account_id=account.id, **body.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/tags/{tag_id}", response_model=TagDefinitionResponse)
async def update_tag(
    tag_id: int,
    body: TagDefinitionUpdate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TagDefinition).where(
            TagDefinition.id == tag_id,
            TagDefinition.account_id == account.id,
        )
    )
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TagDefinition).where(
            TagDefinition.id == tag_id,
            TagDefinition.account_id == account.id,
        )
    )
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await db.delete(tag)
    await db.commit()


# ---------------------------------------------------------------------------
# Property definitions
# ---------------------------------------------------------------------------

@router.get("/properties", response_model=List[PropertyDefinitionResponse])
async def list_properties(
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PropertyDefinition)
        .where(PropertyDefinition.account_id == account.id)
        .order_by(PropertyDefinition.key)
    )
    return result.scalars().all()


@router.post("/properties", response_model=PropertyDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyDefinitionCreate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PropertyDefinition).where(
            PropertyDefinition.account_id == account.id,
            PropertyDefinition.key == body.key,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Property key already exists")
    prop = PropertyDefinition(account_id=account.id, **body.model_dump())
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.put("/properties/{prop_id}", response_model=PropertyDefinitionResponse)
async def update_property(
    prop_id: int,
    body: PropertyDefinitionUpdate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PropertyDefinition).where(
            PropertyDefinition.id == prop_id,
            PropertyDefinition.account_id == account.id,
        )
    )
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.delete("/properties/{prop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    prop_id: int,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PropertyDefinition).where(
            PropertyDefinition.id == prop_id,
            PropertyDefinition.account_id == account.id,
        )
    )
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    await db.delete(prop)
    await db.commit()


# ---------------------------------------------------------------------------
# Event type definitions
# ---------------------------------------------------------------------------

@router.get("/event-types", response_model=List[EventTypeDefinitionResponse])
async def list_event_types(
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventTypeDefinition)
        .where(EventTypeDefinition.account_id == account.id)
        .order_by(EventTypeDefinition.name)
    )
    return result.scalars().all()


@router.post("/event-types", response_model=EventTypeDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_event_type(
    body: EventTypeDefinitionCreate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(EventTypeDefinition).where(
            EventTypeDefinition.account_id == account.id,
            EventTypeDefinition.name == body.name,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event type already exists")
    et = EventTypeDefinition(account_id=account.id, **body.model_dump())
    db.add(et)
    await db.commit()
    await db.refresh(et)
    return et


@router.put("/event-types/{et_id}", response_model=EventTypeDefinitionResponse)
async def update_event_type(
    et_id: int,
    body: EventTypeDefinitionUpdate,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventTypeDefinition).where(
            EventTypeDefinition.id == et_id,
            EventTypeDefinition.account_id == account.id,
        )
    )
    et = result.scalars().first()
    if not et:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(et, field, value)
    await db.commit()
    await db.refresh(et)
    return et


@router.delete("/event-types/{et_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_type(
    et_id: int,
    _admin=Depends(get_current_admin),
    account=Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventTypeDefinition).where(
            EventTypeDefinition.id == et_id,
            EventTypeDefinition.account_id == account.id,
        )
    )
    et = result.scalars().first()
    if not et:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    await db.delete(et)
    await db.commit()
