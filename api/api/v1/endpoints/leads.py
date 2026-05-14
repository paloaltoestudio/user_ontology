from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
import httpx
import logging

from core.database import get_db, AsyncSessionLocal
from core.security import get_current_admin, get_current_account
from models.user import User
from models.account import Account
from models.form import Form
from models.lead import Lead, LeadStageHistory, WebhookDelivery
from models.action import Action, ActionLog
from models.goal import Goal, GoalCompletion, GoalAssignment
from models.form import Form
from schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from schemas.action import BulkApplyActionRequest
from services.action_service import trigger_form_actions, trigger_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])


async def _get_owned_lead(lead_id: int, account: Account, db: AsyncSession) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if lead.account_id is not None and lead.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return lead


async def send_webhooks(lead_id: int, form_id: int, form_data: dict, webhook_urls: list):
    """Send form data to webhooks asynchronously"""
    async with AsyncSessionLocal() as db:
        for webhook_url in webhook_urls:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(webhook_url, json=form_data)

                    delivery = WebhookDelivery(
                        lead_id=lead_id,
                        webhook_url=webhook_url,
                        success=response.status_code < 400,
                        response_status=response.status_code,
                    )
                    db.add(delivery)
            except Exception as e:
                delivery = WebhookDelivery(
                    lead_id=lead_id,
                    webhook_url=webhook_url,
                    success=False,
                    error_message=str(e)[:1000],
                )
                db.add(delivery)
                logger.error(f"Webhook delivery failed for lead {lead_id} to {webhook_url}: {str(e)}")

        await db.commit()


async def trigger_actions_for_form(lead_id: int, form_id: int, form_data: dict):
    """Trigger all actions attached to a form when lead submits it"""
    async with AsyncSessionLocal() as db:
        try:
            await trigger_form_actions(
                form_id=form_id,
                user_id=lead_id,
                form_data=form_data,
                db=db,
            )
        except Exception as e:
            logger.error(f"Failed to trigger form actions for lead {lead_id}: {str(e)}")


@router.post("/submit/{form_id}", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def submit_form(
    form_id: int,
    lead_data: LeadCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Submit a form and create a lead (public endpoint - no auth required)"""
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalars().first()

    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    lead = Lead(
        form_id=form_id,
        account_id=form.account_id,
        name=lead_data.name,
        last_name=lead_data.last_name,
        email=lead_data.email,
        phone=lead_data.phone,
        company=lead_data.company,
        company_url=lead_data.company_url,
        form_data=lead_data.form_data,
        stage=None,
    )
    db.add(lead)
    await db.flush()
    lead_id = lead.id
    await db.commit()

    if form.webhooks:
        background_tasks.add_task(
            send_webhooks,
            lead_id=lead_id,
            form_id=form_id,
            form_data=lead_data.form_data,
            webhook_urls=form.webhooks
        )

    background_tasks.add_task(
        trigger_actions_for_form,
        lead_id=lead_id,
        form_id=form_id,
        form_data=lead_data.form_data,
    )

    result = await db.execute(
        select(Lead).options(selectinload(Lead.webhook_deliveries)).where(Lead.id == lead_id)
    )
    return result.scalars().unique().first()


@router.get("", response_model=list[LeadResponse])
async def list_leads(
    form_id: Optional[int] = Query(None, description="Filter by form ID"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """List leads for the active account (admin only)"""
    query = select(Lead).options(selectinload(Lead.webhook_deliveries))

    filters = [Lead.account_id == account.id]
    if form_id:
        filters.append(Lead.form_id == form_id)
    if stage:
        filters.append(Lead.stage == stage)

    query = query.where(and_(*filters)).order_by(Lead.created_at.desc())

    result = await db.execute(query)
    return result.scalars().unique().all()


@router.get("/stats")
async def get_lead_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Return total lead count and breakdown by stage for the active account."""
    rows = await db.execute(
        select(Lead.stage, func.count(Lead.id))
        .where(Lead.account_id == account.id)
        .group_by(Lead.stage)
    )
    counts = rows.all()

    total = sum(c for _, c in counts)
    by_stage = [
        {
            "stage": s,
            "count": count,
            "percentage": round(count / total * 100, 1) if total else 0,
        }
        for s, count in sorted(counts, key=lambda x: x[1], reverse=True)
    ]

    return {"total": total, "by_stage": by_stage}


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Get a specific lead (admin only)"""
    lead = await _get_owned_lead(lead_id, account, db)

    result = await db.execute(
        select(Lead).options(selectinload(Lead.webhook_deliveries)).where(Lead.id == lead_id)
    )
    return result.scalars().unique().first()


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Update lead stage and notes (admin only)"""
    lead = await _get_owned_lead(lead_id, account, db)

    update_data = lead_data.model_dump(exclude_unset=True)

    if "stage" in update_data and update_data["stage"] != lead.stage:
        db.add(LeadStageHistory(
            lead_id=lead.id,
            from_stage=lead.stage,
            to_stage=update_data["stage"],
            changed_by=admin_user.email,
        ))

    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)

    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Delete a lead (admin only)"""
    lead = await _get_owned_lead(lead_id, account, db)
    await db.delete(lead)
    await db.commit()


@router.post("/actions/apply", status_code=status.HTTP_200_OK)
async def apply_action_to_leads(
    request: BulkApplyActionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Apply an action to multiple leads (admin only)"""
    action_result = await db.execute(select(Action).where(Action.id == request.action_id))
    action = action_result.scalars().first()

    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")

    leads_result = await db.execute(
        select(Lead).where(Lead.id.in_(request.lead_ids), Lead.account_id == account.id)
    )
    leads = leads_result.scalars().all()

    if not leads:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No leads found with provided IDs")

    applied_count = 0
    for lead in leads:
        try:
            payload = {
                "id": lead.id,
                "form_id": lead.form_id,
                "name": lead.name,
                "last_name": lead.last_name,
                "email": lead.email,
                "phone": lead.phone,
                "company": lead.company,
                "company_url": lead.company_url,
                "stage": lead.stage,
                "form_data": lead.form_data,
                "notes": lead.notes,
                "created_at": lead.created_at.isoformat(),
                "updated_at": lead.updated_at.isoformat(),
            }
            await trigger_action(
                action_id=request.action_id,
                user_id=lead.id,
                payload=payload,
                db=db,
            )
            applied_count += 1
        except Exception as e:
            logger.error(f"Failed to apply action {request.action_id} to lead {lead.id}: {str(e)}")

    return {
        "message": f"Action applied to {applied_count} lead(s)",
        "applied_count": applied_count,
    }


@router.get("/{lead_id}/journey")
async def get_lead_journey(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Return all journey data for a lead: form, goals, actions, stage history."""
    await _get_owned_lead(lead_id, account, db)

    result = await db.execute(
        select(Lead).options(
            selectinload(Lead.stage_history),
        ).where(Lead.id == lead_id)
    )
    lead = result.scalars().unique().first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    form_result = await db.execute(select(Form).where(Form.id == lead.form_id))
    form = form_result.scalars().first()

    assignments_result = await db.execute(
        select(GoalAssignment, Goal, GoalCompletion)
        .join(Goal, GoalAssignment.goal_id == Goal.id)
        .outerjoin(GoalCompletion, (GoalCompletion.goal_id == Goal.id) & (GoalCompletion.user_id == lead_id))
        .where(GoalAssignment.user_id == lead_id)
    )
    goals = [
        {
            "id": assignment.id,
            "goal_id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "completed": completion is not None,
            "completed_at": completion.first_completed_at.isoformat() if completion else None,
            "assigned_at": assignment.assigned_at.isoformat(),
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        }
        for assignment, goal, completion in assignments_result.all()
    ]

    triggered_actions_result = await db.execute(
        select(Action, ActionLog)
        .join(ActionLog, ActionLog.action_id == Action.id)
        .where(ActionLog.user_id == lead_id)
        .order_by(ActionLog.created_at.desc())
    )
    seen_action_ids: set[int] = set()
    actions = []
    for action, log in triggered_actions_result.all():
        if action.id not in seen_action_ids:
            seen_action_ids.add(action.id)
            actions.append({
                "id": action.id,
                "name": action.name,
                "description": action.description,
                "last_triggered_at": log.created_at.isoformat(),
                "last_success": log.success,
            })

    stage_history = [
        {
            "id": h.id,
            "from_stage": h.from_stage,
            "to_stage": h.to_stage,
            "changed_by": h.changed_by,
            "note": h.note,
            "created_at": h.created_at.isoformat(),
        }
        for h in lead.stage_history
    ]

    return {
        "lead": {
            "id": lead.id,
            "name": lead.name,
            "last_name": lead.last_name,
            "email": lead.email,
            "company": lead.company,
            "stage": lead.stage,
            "created_at": lead.created_at.isoformat(),
            "entry_source": lead.entry_source,
        },
        "entry": {
            "source": lead.entry_source,
            "form_id": form.id if form else None,
            "form_name": form.name if form else None,
            "at": lead.created_at.isoformat(),
        },
        "goals": goals,
        "actions": actions,
        "stage_history": stage_history,
    }
