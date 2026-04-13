import httpx
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, Dict, Any, List

from models.action import Action, ActionLog
from models.form import Form
from models.lead import Lead
from core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def trigger_action(
    action_id: int,
    user_id: int,
    form_id: Optional[int] = None,
    payload: Optional[Dict[str, Any]] = None,
    db: Optional[AsyncSession] = None,
) -> ActionLog:
    """
    Trigger an action by sending webhook to external system.

    Args:
        action_id: ID of the action to trigger
        user_id: ID of the user/lead triggering the action
        form_id: Optional form ID if triggered from form submission
        payload: Data to send to the webhook
        db: Database session (creates new one if not provided)

    Returns:
        ActionLog entry with result
    """
    # Use provided session or create new one
    should_close_db = False
    if db is None:
        db = AsyncSessionLocal()
        should_close_db = True

    try:
        # Fetch action
        result = await db.execute(select(Action).where(Action.id == action_id))
        action = result.scalars().first()

        if not action:
            logger.warning(f"Action {action_id} not found")
            return None

        # Prepare log entry
        log_entry = ActionLog(
            action_id=action_id,
            user_id=user_id,
            form_id=form_id,
            payload=payload,
        )

        # Send webhook
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(action.webhook_url, json=payload)

                log_entry.success = response.status_code < 400
                log_entry.response_status = response.status_code
                log_entry.response_body = response.text[:2000]  # Limit response size

                if not log_entry.success:
                    log_entry.error_message = f"HTTP {response.status_code}"

        except httpx.TimeoutException as e:
            log_entry.success = False
            log_entry.error_message = f"Timeout: {str(e)}"
            logger.error(f"Action {action_id} webhook timeout: {str(e)}")

        except httpx.RequestError as e:
            log_entry.success = False
            log_entry.error_message = f"Request error: {str(e)}"
            logger.error(f"Action {action_id} webhook request error: {str(e)}")

        except Exception as e:
            log_entry.success = False
            log_entry.error_message = f"Unexpected error: {str(e)}"
            logger.error(f"Action {action_id} webhook error: {str(e)}")

        # Save log entry
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)

        return log_entry

    finally:
        if should_close_db:
            await db.close()


async def trigger_form_actions(
    form_id: int,
    user_id: int,
    form_data: Dict[str, Any],
    db: AsyncSession,
) -> List[ActionLog]:
    """
    Trigger all actions attached to a form when form is submitted.

    Args:
        form_id: ID of the form being submitted
        user_id: ID of the lead/user submitting the form
        form_data: Form data to send to webhooks
        db: Database session

    Returns:
        List of ActionLog entries
    """
    # Fetch form with its actions (eagerly loaded to prevent lazy-loading in background task context)
    result = await db.execute(
        select(Form).options(selectinload(Form.actions)).where(Form.id == form_id)
    )
    form = result.scalars().first()

    if not form or not form.actions:
        return []

    logs = []
    for action in form.actions:
        try:
            log = await trigger_action(
                action_id=action.id,
                user_id=user_id,
                form_id=form_id,
                payload=form_data,
                db=db,
            )
            if log:
                logs.append(log)
        except Exception as e:
            logger.error(f"Failed to trigger action {action.id} for form {form_id}: {str(e)}")

    return logs


async def trigger_user_actions(
    user_id: int,
    action_ids: Optional[List[int]] = None,
    payload: Optional[Dict[str, Any]] = None,
    db: Optional[AsyncSession] = None,
) -> List[ActionLog]:
    """
    Trigger actions assigned to a user.

    Args:
        user_id: ID of the user
        action_ids: Specific action IDs to trigger (if None, triggers all user actions)
        payload: Data to send to webhooks
        db: Database session (creates new one if not provided)

    Returns:
        List of ActionLog entries
    """
    should_close_db = False
    if db is None:
        db = AsyncSessionLocal()
        should_close_db = True

    try:
        # Fetch user with actions (eagerly loaded to prevent lazy-loading in background task context)
        result = await db.execute(
            select(Lead).options(selectinload(Lead.actions)).where(Lead.id == user_id)
        )
        user = result.scalars().first()

        if not user:
            logger.warning(f"User {user_id} not found")
            return []

        # Filter actions if specific IDs provided
        actions = user.actions
        if action_ids:
            actions = [a for a in actions if a.id in action_ids]

        if not actions:
            return []

        logs = []
        for action in actions:
            try:
                log = await trigger_action(
                    action_id=action.id,
                    user_id=user_id,
                    payload=payload,
                    db=db,
                )
                if log:
                    logs.append(log)
            except Exception as e:
                logger.error(f"Failed to trigger action {action.id} for user {user_id}: {str(e)}")

        return logs

    finally:
        if should_close_db:
            await db.close()
