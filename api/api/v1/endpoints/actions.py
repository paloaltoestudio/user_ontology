from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
import logging

from core.database import get_db
from core.security import get_current_admin, get_current_account
from models.user import User
from models.account import Account
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


async def _get_owned_action(action_id: int, account: Account, db: AsyncSession) -> Action:
    result = await db.execute(select(Action).where(Action.id == action_id))
    action = result.scalars().first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
    if action.account_id is not None and action.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return action


async def _get_owned_form_for_action(form_id: int, account: Account, db: AsyncSession) -> Form:
    result = await db.execute(
        select(Form).options(selectinload(Form.actions)).where(Form.id == form_id)
    )
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    if form.account_id is not None and form.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return form


async def _get_owned_lead_for_action(lead_id: int, account: Account, db: AsyncSession) -> Lead:
    result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(Lead.id == lead_id)
    )
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if lead.account_id is not None and lead.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return lead


@router.post("", response_model=ActionResponse, status_code=status.HTTP_201_CREATED)
async def create_action(
    action_data: ActionCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Create a new action (admin only)"""
    action = Action(
        name=action_data.name,
        description=action_data.description,
        webhook_url=action_data.webhook_url,
        account_id=account.id,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return action


@router.get("", response_model=List[ActionResponse])
async def list_actions(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """List all actions for the active account (admin only)"""
    result = await db.execute(
        select(Action).where(Action.account_id == account.id).order_by(Action.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{action_id}", response_model=ActionResponse)
async def get_action(
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Get a specific action (admin only)"""
    return await _get_owned_action(action_id, account, db)


@router.put("/{action_id}", response_model=ActionResponse)
async def update_action(
    action_id: int,
    action_data: ActionUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Update an action (admin only)"""
    action = await _get_owned_action(action_id, account, db)

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
    account: Account = Depends(get_current_account),
):
    """Delete an action (admin only)"""
    action = await _get_owned_action(action_id, account, db)
    await db.delete(action)
    await db.commit()


# Form-Action endpoints
@router.post("/forms/{form_id}/actions/{action_id}", status_code=status.HTTP_201_CREATED)
async def add_action_to_form(
    form_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Add an action to a form (admin only)"""
    form = await _get_owned_form_for_action(form_id, account, db)
    action = await _get_owned_action(action_id, account, db)

    if action in form.actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action already assigned to form",
        )

    form.actions.append(action)
    await db.commit()

    return {"message": f"Action {action_id} added to form {form_id}"}


@router.delete("/forms/{form_id}/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_action_from_form(
    form_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Remove an action from a form (admin only)"""
    form = await _get_owned_form_for_action(form_id, account, db)
    action = await _get_owned_action(action_id, account, db)

    if action in form.actions:
        form.actions.remove(action)
        await db.commit()


@router.get("/forms/{form_id}/actions", response_model=List[ActionResponse])
async def get_form_actions(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Get all actions for a form (admin only)"""
    form = await _get_owned_form_for_action(form_id, account, db)
    return form.actions


# User-Action endpoints
@router.post("/users/{user_id}/actions/{action_id}", status_code=status.HTTP_201_CREATED)
async def add_action_to_user(
    user_id: int,
    action_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Add an action to a user (admin only)"""
    user = await _get_owned_lead_for_action(user_id, account, db)
    action = await _get_owned_action(action_id, account, db)

    if action in user.actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action already assigned to user",
        )

    user.actions.append(action)
    await db.commit()

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
    account: Account = Depends(get_current_account),
):
    """Bulk assign an action to multiple users (admin only)"""
    action = await _get_owned_action(request.action_id, account, db)

    user_result = await db.execute(
        select(Lead).options(selectinload(Lead.actions)).where(
            Lead.id.in_(request.user_ids),
            Lead.account_id == account.id,
        )
    )
    users = user_result.scalars().unique().all()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found with provided IDs",
        )

    assigned_count = 0
    auto_sent_count = 0

    for user in users:
        if action not in user.actions:
            user.actions.append(action)
            assigned_count += 1

    await db.commit()

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
    account: Account = Depends(get_current_account),
):
    """Remove an action from a user (admin only)"""
    user = await _get_owned_lead_for_action(user_id, account, db)
    action = await _get_owned_action(action_id, account, db)

    if action in user.actions:
        user.actions.remove(action)
        await db.commit()


@router.get("/users/{user_id}/actions", response_model=List[ActionResponse])
async def get_user_actions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Get all actions for a user (admin only)"""
    user = await _get_owned_lead_for_action(user_id, account, db)
    return user.actions


# Action Logs endpoints
@router.get("/{action_id}/logs", response_model=List[ActionLogResponse])
async def get_action_logs(
    action_id: int,
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Get logs for an action (admin only)"""
    await _get_owned_action(action_id, account, db)

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
    account: Account = Depends(get_current_account),
):
    """Get all action logs for a user (admin only)"""
    await _get_owned_lead_for_action(user_id, account, db)

    query = select(ActionLog).where(ActionLog.user_id == user_id)

    if action_id is not None:
        query = query.where(ActionLog.action_id == action_id)

    if success is not None:
        query = query.where(ActionLog.success == success)

    query = query.order_by(ActionLog.created_at.desc())

    result = await db.execute(query)
    logs = result.scalars().all()

    return logs
