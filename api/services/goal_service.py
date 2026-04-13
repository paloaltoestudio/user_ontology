import logging
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.goal import Goal, GoalCompletion, IdempotencyKey
from models.lead import Lead
from schemas.goal import GoalEventRequest, GoalCompletionResponse
from services.api_key_service import validate_api_key_scope

logger = logging.getLogger(__name__)


async def find_user_by_mapping(
    external_user_id: Optional[str],
    email: Optional[str],
    internal_user_id: Optional[int],
    db: AsyncSession
) -> Optional[Lead]:
    """
    Find a user by various mappings:
    1. If internal_user_id provided, use that
    2. If external_user_id provided, look for lead
    3. If email provided, look for lead by email
    """

    # Try internal_user_id first
    if internal_user_id:
        result = await db.execute(
            select(Lead).where(Lead.id == internal_user_id)
        )
        user = result.scalars().first()
        if user:
            return user

    # Try external_user_id (this would be a new field we might add to Lead in future)
    # For now, we don't have external_user_id stored on Lead model
    # This is just a reference for the event

    # Try email as fallback
    if email:
        result = await db.execute(
            select(Lead).where(Lead.email == email)
        )
        user = result.scalars().first()
        if user:
            return user

    return None


async def process_goal_event(
    event: GoalEventRequest,
    db: AsyncSession
) -> Tuple[bool, Optional[GoalCompletionResponse], Optional[dict]]:
    """
    Process a goal completion event from external app.

    Returns: (success: bool, data: GoalCompletionResponse or None, error: dict or None)
    """

    # 1. Verify goal exists
    result = await db.execute(
        select(Goal).where(Goal.id == event.goal_id)
    )
    goal = result.scalars().first()

    if not goal:
        return False, None, {
            "code": "GOAL_NOT_FOUND",
            "message": f"Goal with ID {event.goal_id} not found"
        }

    # 2. Find user
    user = await find_user_by_mapping(
        external_user_id=event.external_user_id,
        email=event.email,
        internal_user_id=event.internal_user_id,
        db=db
    )

    if not user:
        return False, None, {
            "code": "USER_NOT_FOUND",
            "message": "User not found. Provide internal_user_id, external_user_id, or email."
        }

    # 3. Check if completion already exists (idempotency via goal_id + user_id + timestamp)
    # Use timestamp as rough deduplication key
    result = await db.execute(
        select(GoalCompletion).where(
            and_(
                GoalCompletion.goal_id == event.goal_id,
                GoalCompletion.user_id == user.id,
                GoalCompletion.first_completed_at == event.timestamp,
                GoalCompletion.external_user_id == event.external_user_id
            )
        )
    )
    existing_completion = result.scalars().first()

    if existing_completion:
        # Duplicate event - return success with existing completion
        logger.info(f"Duplicate goal event: goal_id={event.goal_id}, user_id={user.id}, timestamp={event.timestamp}")
        return True, GoalCompletionResponse.model_validate(existing_completion), None

    # 4. Create new goal completion
    completion = GoalCompletion(
        goal_id=event.goal_id,
        user_id=user.id,
        external_user_id=event.external_user_id,
        first_completed_at=event.timestamp,
        event_metadata=event.metadata,
        source_integration=event.goal_name or "external"  # Use goal_name as source if provided
    )

    db.add(completion)
    await db.commit()
    await db.refresh(completion)

    logger.info(
        f"Goal completion recorded: goal_id={event.goal_id}, user_id={user.id}, "
        f"external_user_id={event.external_user_id}, timestamp={event.timestamp}"
    )

    return True, GoalCompletionResponse.model_validate(completion), None


async def record_idempotency_key(
    idempotency_key: str,
    goal_completion_id: int,
    db: AsyncSession
) -> bool:
    """Record an idempotency key to prevent duplicate processing"""
    try:
        key_record = IdempotencyKey(
            idempotency_key=idempotency_key,
            goal_completion_id=goal_completion_id
        )
        db.add(key_record)
        await db.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to record idempotency key: {str(e)}")
        return False


async def check_idempotency_key(
    idempotency_key: str,
    db: AsyncSession
) -> Optional[int]:
    """
    Check if idempotency key was already processed.
    Returns the goal_completion_id if found, None otherwise
    """
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.idempotency_key == idempotency_key)
    )
    key_record = result.scalars().first()
    return key_record.goal_completion_id if key_record else None
