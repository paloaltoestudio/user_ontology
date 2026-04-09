from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.security import get_current_admin
from models.user import User
from models.scoring_rule import ScoringRule
from schemas.scoring_rule import (
    ScoringRuleCreate,
    ScoringRuleResponse,
    ScoringRuleUpdate,
)
from services.scoring_logic import calculate_user_score

router = APIRouter(prefix="/scoring", tags=["scoring"])


@router.get("/rules", response_model=list[ScoringRuleResponse])
async def get_scoring_rules(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all active scoring rules (admin only)"""
    result = await db.execute(select(ScoringRule).where(ScoringRule.is_active == 1))
    rules = result.scalars().all()
    return rules


@router.post("/rules", response_model=ScoringRuleResponse)
async def create_scoring_rule(
    rule_data: ScoringRuleCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Create a new scoring rule (admin only)"""
    rule = ScoringRule(
        field_key=rule_data.field_key,
        operator=rule_data.operator,
        value=rule_data.value,
        points=rule_data.points,
        is_active=1,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}", response_model=ScoringRuleResponse)
async def update_scoring_rule(
    rule_id: int,
    rule_data: ScoringRuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Update a scoring rule (admin only)"""
    result = await db.execute(select(ScoringRule).where(ScoringRule.id == rule_id))
    rule = result.scalars().first()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scoring rule not found"
        )

    # Update fields
    update_data = rule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return rule


@router.post("/recalculate/{user_id}")
async def recalculate_user_score(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Recalculate user's lead score based on current rules (admin only)"""
    try:
        new_score = await calculate_user_score(user_id, db)
        return {"user_id": user_id, "new_score": new_score}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.post("/recalculate-all")
async def recalculate_all_scores(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Recalculate all users' lead scores (admin only)"""
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()

    updated_count = 0
    for user in users:
        try:
            await calculate_user_score(user.id, db)
            updated_count += 1
        except ValueError:
            continue

    return {"updated_count": updated_count, "total_users": len(users)}
