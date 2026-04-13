from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging

from core.database import get_db
from core.security import get_current_admin
from models.user import User
from models.goal import Goal, GoalCompletion
from models.lead import Lead
from schemas.goal import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    GoalCompletionResponse,
    GoalEventRequest,
    GoalEventResponse,
)
from services.goal_service import (
    process_goal_event,
    check_idempotency_key,
    record_idempotency_key,
)
from services.api_key_service import validate_api_key_scope

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/goals", tags=["goals"])


# ============================================================================
# Admin Endpoints - Goal CRUD
# ============================================================================

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Create a new goal (admin only)"""
    goal = Goal(
        name=goal_data.name,
        description=goal_data.description,
        is_active=goal_data.is_active,
        created_by=admin_user.id,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    logger.info(f"Goal created: id={goal.id}, name={goal.name}, created_by={admin_user.id}")
    return goal


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """List all goals (admin only)"""
    query = select(Goal)

    if is_active is not None:
        query = query.where(Goal.is_active == is_active)

    query = query.order_by(Goal.created_at.desc())
    result = await db.execute(query)
    goals = result.scalars().all()
    return goals


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get goal details (admin only)"""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Update a goal (admin only)"""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    # Update fields
    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    logger.info(f"Goal updated: id={goal.id}, updated_by={admin_user.id}")
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Deactivate a goal (soft delete) (admin only)"""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    goal.is_active = False
    await db.commit()
    logger.info(f"Goal deactivated: id={goal.id}, deactivated_by={admin_user.id}")


# ============================================================================
# Admin Endpoints - Goal Completions
# ============================================================================

@router.get("/{goal_id}/completions", response_model=List[GoalCompletionResponse])
async def get_goal_completions(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all completions for a goal (admin only)"""
    # Verify goal exists
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    # Get completions
    result = await db.execute(
        select(GoalCompletion)
        .where(GoalCompletion.goal_id == goal_id)
        .order_by(GoalCompletion.first_completed_at.desc())
    )
    completions = result.scalars().all()
    return completions


@router.get("/user/{user_id}/completions", response_model=List[GoalCompletionResponse])
async def get_user_goal_completions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all goal completions for a user (admin only)"""
    # Verify user exists
    result = await db.execute(
        select(Lead).where(Lead.id == user_id)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get completions
    result = await db.execute(
        select(GoalCompletion)
        .where(GoalCompletion.user_id == user_id)
        .order_by(GoalCompletion.first_completed_at.desc())
    )
    completions = result.scalars().all()
    return completions


# ============================================================================
# Public Endpoint - Goal Event Submission
# ============================================================================

@router.post("/events", response_model=GoalEventResponse, status_code=status.HTTP_200_OK)
async def submit_goal_event(
    event: GoalEventRequest,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
    idempotency_key: Optional[str] = Header(None),
):
    """
    Submit a goal completion event from external app.

    Requires API key in Authorization header: "Bearer <api_key>"
    API key must have 'goals' scope.
    Optional: Idempotency-Key header for deduplication.
    """

    # 1. Authenticate via API key and validate 'goals' scope
    if not authorization:
        logger.warning("Goal event submission without authorization header")
        return GoalEventResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authorization header required. Format: 'Bearer <api_key>'"
            }
        )

    # Extract API key from "Bearer <key>" format
    try:
        scheme, api_key_value = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
    except (ValueError, IndexError):
        logger.warning("Invalid authorization header format")
        return GoalEventResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Invalid authorization header. Format: 'Bearer <api_key>'"
            }
        )

    # Validate API key and check 'goals' scope
    is_valid, api_key = await validate_api_key_scope(api_key_value, "goals", db)
    if not is_valid:
        logger.warning(f"Invalid or unauthorized API key: {api_key_value[:10]}...")
        return GoalEventResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Invalid API key or insufficient scope. API key must have 'goals' scope."
            }
        )

    # 2. Handle idempotency
    if idempotency_key:
        existing_completion_id = await check_idempotency_key(idempotency_key, db)
        if existing_completion_id:
            # Already processed - return success with existing data
            result = await db.execute(
                select(GoalCompletion).where(GoalCompletion.id == existing_completion_id)
            )
            completion = result.scalars().first()
            if completion:
                logger.info(f"Duplicate idempotency key processed: {idempotency_key}")
                return GoalEventResponse(
                    success=True,
                    data=GoalCompletionResponse.model_validate(completion)
                )

    # 3. Process goal event
    success, completion_data, error = await process_goal_event(event, db)

    if not success:
        status_code = 404 if error["code"] == "GOAL_NOT_FOUND" else 400
        logger.warning(f"Goal event processing failed: {error['code']} - {error['message']}")
        return GoalEventResponse(success=False, error=error)

    # 4. Record idempotency key if provided
    if idempotency_key and completion_data:
        await record_idempotency_key(idempotency_key, completion_data.id, db)

    logger.info(f"Goal event processed successfully: goal_id={event.goal_id}, user_id={completion_data.user_id}")
    return GoalEventResponse(success=True, data=completion_data)
