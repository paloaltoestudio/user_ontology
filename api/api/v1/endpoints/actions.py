from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
import logging

from core.database import get_db
from core.security import get_current_admin
from models.user import User
from models.action import Action, ActionLog
from models.form import Form
from models.lead import Lead
from schemas.action import (
    ActionCreate,
    ActionResponse,
    ActionUpdate,
    ActionLogResponse,
    BulkAssignActionRequest,
)
from services.action_service import trigger_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("", response_model=ActionResponse, status_code=status.HTTP_201_CREATED)
async def create_action(
    action_data: ActionCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Create a new action (admin only)"""
    action = Action(
        name=action_data.name,
        description=action_data.description,
        webhook_url=action_data.webhook_url,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return action


@router.get("", response_model=List[ActionResponse])
async def list_actions(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """List all actions (admin only)"""
    result = await db.execute(
        select(Action).order_by(Action.created_at.desc())
    )
    actions = result.scalars().all()
    return actions


@router.get("/{action_id}", response_model=ActionResponse)
async def get_action(
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get a specific action (admin only)"""
    result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    return action


@router.put("/{action_id}", response_model=ActionResponse)
async def update_action(
    action_id: int,
    action_data: ActionUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Update an action (admin only)"""
    result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Update fields
    update_data = action_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(action, field, value)

    await db.commit()
    await db.refresh(action)
    return action


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_action(
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Delete an action (admin only)"""
    result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    await db.delete(action)
    await db.commit()


# Form-Action endpoints
@router.post("/forms/{form_id}/actions/{action_id}", status_code=status.HTTP_201_CREATED)
async def add_action_to_form(
    form_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Add an action to a form (admin only)"""
    # Verify form exists with eager-loaded actions
    form_result = await db.execute(
        select(Form).options(selectinload(Form.actions)).where(Form.id == form_id)
    )
    form = form_result.scalars().first()

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Check if already assigned
    if action in form.actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action already assigned to form",
        )

    # Add action to form
    form.actions.append(action)
    await db.commit()

    return {"message": f"Action {action_id} added to form {form_id}"}


@router.delete("/forms/{form_id}/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_action_from_form(
    form_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Remove an action from a form (admin only)"""
    # Verify form exists with eager-loaded actions
    form_result = await db.execute(
        select(Form).options(selectinload(Form.actions)).where(Form.id == form_id)
    )
    form = form_result.scalars().first()

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Remove action from form
    if action in form.actions:
        form.actions.remove(action)
        await db.commit()


@router.get("/forms/{form_id}/actions", response_model=List[ActionResponse])
async def get_form_actions(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all actions for a form (admin only)"""
    result = await db.execute(
        select(Form).options(selectinload(Form.actions)).where(Form.id == form_id)
    )
    form = result.scalars().first()

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    return form.actions


# User-Action endpoints
@router.post("/users/{user_id}/actions/{action_id}", status_code=status.HTTP_201_CREATED)
async def add_action_to_user(
    user_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Add an action to a user (admin only)"""
    # Verify user exists with eager-loaded actions
    user_result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(Lead.id == user_id)
    )
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Check if already assigned
    if action in user.actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action already assigned to user",
        )

    # Add action to user
    user.actions.append(action)
    await db.commit()

    # If auto_send is enabled, trigger action immediately
    if action.auto_send:
        try:
            payload = {
                "id": user.id,
                "form_id": user.form_id,
                "name": user.name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "company": user.company,
                "company_url": user.company_url,
                "status": user.status,
                "form_data": user.form_data,
                "notes": user.notes,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            }
            await trigger_action(
                action_id=action_id,
                user_id=user_id,
                payload=payload,
                db=db,
            )
        except Exception as e:
            logger.error(f"Failed to auto-send action {action_id} to user {user_id}: {str(e)}")

    return {"message": f"Action {action_id} added to user {user_id}", "auto_sent": action.auto_send}


@router.post("/users/actions/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_assign_action_to_users(
    request: BulkAssignActionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Bulk assign an action to multiple users (admin only)"""
    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == request.action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Fetch all users with eager-loaded actions
    user_result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(Lead.id.in_(request.user_ids))
    )
    users = user_result.scalars().unique().all()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found with provided IDs",
        )

    # Assign action to each user
    assigned_count = 0
    auto_sent_count = 0

    for user in users:
        if action not in user.actions:
            user.actions.append(action)
            assigned_count += 1

    await db.commit()

    # If auto_send is enabled, trigger action immediately for each user
    if action.auto_send:
        for user in users:
            if action in user.actions:
                try:
                    payload = {
                        "id": user.id,
                        "form_id": user.form_id,
                        "name": user.name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "phone": user.phone,
                        "company": user.company,
                        "company_url": user.company_url,
                        "status": user.status,
                        "form_data": user.form_data,
                        "notes": user.notes,
                        "created_at": user.created_at.isoformat(),
                        "updated_at": user.updated_at.isoformat(),
                    }
                    await trigger_action(
                        action_id=request.action_id,
                        user_id=user.id,
                        payload=payload,
                        db=db,
                    )
                    auto_sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to auto-send action {request.action_id} to user {user.id}: {str(e)}")

    return {
        "message": f"Action {request.action_id} assigned to {assigned_count} users",
        "assigned_count": assigned_count,
        "auto_sent_count": auto_sent_count,
        "auto_send_enabled": action.auto_send,
    }


@router.delete("/users/{user_id}/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_action_from_user(
    user_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Remove an action from a user (admin only)"""
    # Verify user exists with eager-loaded actions
    user_result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(Lead.id == user_id)
    )
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Remove action from user
    if action in user.actions:
        user.actions.remove(action)
        await db.commit()


@router.get("/users/{user_id}/actions", response_model=List[ActionResponse])
async def get_user_actions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all actions for a user (admin only)"""
    result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(Lead.id == user_id)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user.actions


# Action Logs endpoints
@router.get("/{action_id}/logs", response_model=List[ActionLogResponse])
async def get_action_logs(
    action_id: int,
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get logs for an action (admin only)"""
    # Verify action exists
    action_result = await db.execute(
        select(Action).where(Action.id == action_id)
    )
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    # Build query
    query = select(ActionLog).where(ActionLog.action_id == action_id)

    if user_id is not None:
        query = query.where(ActionLog.user_id == user_id)

    if success is not None:
        query = query.where(ActionLog.success == success)

    query = query.order_by(ActionLog.created_at.desc())

    result = await db.execute(query)
    logs = result.scalars().all()

    return logs


@router.get("/users/{user_id}/logs", response_model=List[ActionLogResponse])
async def get_user_action_logs(
    user_id: int,
    action_id: Optional[int] = Query(None, description="Filter by action ID"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get all action logs for a user (admin only)"""
    # Verify user exists
    user_result = await db.execute(
        select(Lead).where(Lead.id == user_id)
    )
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Build query
    query = select(ActionLog).where(ActionLog.user_id == user_id)

    if action_id is not None:
        query = query.where(ActionLog.action_id == action_id)

    if success is not None:
        query = query.where(ActionLog.success == success)

    query = query.order_by(ActionLog.created_at.desc())

    result = await db.execute(query)
    logs = result.scalars().all()

    return logs
