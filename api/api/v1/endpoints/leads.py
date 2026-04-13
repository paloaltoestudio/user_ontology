from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
import httpx
import logging

from core.database import get_db, AsyncSessionLocal
from core.security import get_current_admin
from models.user import User
from models.form import Form
from models.lead import Lead, WebhookDelivery
from models.action import Action
from schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from schemas.action import BulkApplyActionRequest
from services.action_service import trigger_form_actions, trigger_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])


async def send_webhooks(lead_id: int, form_id: int, form_data: dict, webhook_urls: list):
    """Send form data to webhooks asynchronously"""
    async with AsyncSessionLocal() as db:
        for webhook_url in webhook_urls:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(webhook_url, json=form_data)

                    # Log successful delivery
                    delivery = WebhookDelivery(
                        lead_id=lead_id,
                        webhook_url=webhook_url,
                        success=response.status_code < 400,
                        response_status=response.status_code,
                    )
                    db.add(delivery)
            except Exception as e:
                # Log failed delivery
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
    # Verify form exists and get webhooks
    result = await db.execute(
        select(Form).where(Form.id == form_id)
    )
    form = result.scalars().first()

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    # Create lead with static fields
    lead = Lead(
        form_id=form_id,
        name=lead_data.name,
        last_name=lead_data.last_name,
        email=lead_data.email,
        phone=lead_data.phone,
        company=lead_data.company,
        company_url=lead_data.company_url,
        form_data=lead_data.form_data,
        status="new",
    )
    db.add(lead)
    await db.flush()  # Get the lead ID without committing
    lead_id = lead.id
    await db.commit()

    # Send webhooks in background (non-blocking)
    if form.webhooks:
        background_tasks.add_task(
            send_webhooks,
            lead_id=lead_id,
            form_id=form_id,
            form_data=lead_data.form_data,
            webhook_urls=form.webhooks
        )

    # Trigger form actions in background (non-blocking)
    background_tasks.add_task(
        trigger_actions_for_form,
        lead_id=lead_id,
        form_id=form_id,
        form_data=lead_data.form_data,
    )

    # Refresh to get latest data and eager load relationships
    result = await db.execute(
        select(Lead).options(selectinload(Lead.webhook_deliveries)).where(Lead.id == lead_id)
    )
    return result.scalars().unique().first()


@router.get("", response_model=list[LeadResponse])
async def list_leads(
    form_id: Optional[int] = Query(None, description="Filter by form ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """List leads (admin only)"""
    query = select(Lead).options(selectinload(Lead.webhook_deliveries))

    # Apply filters
    filters = []
    if form_id:
        filters.append(Lead.form_id == form_id)
    if status:
        filters.append(Lead.status == status)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Lead.created_at.desc())

    result = await db.execute(query)
    leads = result.scalars().unique().all()

    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Get a specific lead (admin only)"""
    result = await db.execute(
        select(Lead).options(selectinload(Lead.webhook_deliveries)).where(Lead.id == lead_id)
    )
    lead = result.scalars().unique().first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Update lead status and notes (admin only)"""
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )
    lead = result.scalars().first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    # Update fields
    update_data = lead_data.model_dump(exclude_unset=True)
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
):
    """Delete a lead (admin only)"""
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )
    lead = result.scalars().first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    await db.delete(lead)
    await db.commit()


@router.post("/actions/apply", status_code=status.HTTP_200_OK)
async def apply_action_to_leads(
    request: BulkApplyActionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """Apply an action to multiple leads (admin only)"""
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

    # Verify all leads exist
    leads_result = await db.execute(
        select(Lead).where(Lead.id.in_(request.lead_ids))
    )
    leads = leads_result.scalars().all()

    if not leads:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No leads found with provided IDs",
        )

    # Trigger action for each lead
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
                "status": lead.status,
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
