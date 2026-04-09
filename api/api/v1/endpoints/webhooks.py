from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from datetime import datetime

from core.database import get_db
from core.config import settings
from models.event_log import EventLog
from models.user import User
from services.scoring_logic import calculate_user_score

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/events")
async def log_event(
    payload: dict,
    x_webhook_secret: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook endpoint to log user events and trigger scoring recalculation.

    Expected payload:
    {
        "user_id": 1,
        "event_type": "form_step_1_complete",
        "event_data": {...}
    }
    """

    # TODO: Implement webhook signature verification if needed
    # if x_webhook_secret != settings.WEBHOOK_SECRET:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid webhook secret"
    #     )

    user_id = payload.get("user_id")
    event_type = payload.get("event_type")
    event_data = payload.get("event_data", {})

    if not user_id or not event_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: user_id, event_type",
        )

    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Log event
    event_log = EventLog(
        user_id=user_id,
        event_type=event_type,
        event_data=event_data,
        created_at=datetime.utcnow(),
    )
    db.add(event_log)
    await db.flush()

    # Recalculate user score
    try:
        new_score = await calculate_user_score(user_id, db)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate score: {str(e)}",
        )

    await db.commit()

    return {
        "event_id": event_log.id,
        "user_id": user_id,
        "event_type": event_type,
        "new_score": new_score,
    }


@router.post("/n8n/{workflow_id}")
async def handle_n8n_webhook(
    workflow_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook endpoint for n8n workflow triggers.

    This endpoint allows n8n to send data back to the API for processing.

    Expected payload:
    {
        "user_id": 1,
        "workflow_name": "send_welcome_email",
        "status": "completed",
        "data": {...}
    }
    """

    user_id = payload.get("user_id")

    if user_id:
        # Log workflow completion as event
        event_log = EventLog(
            user_id=user_id,
            event_type=f"n8n_workflow_{workflow_id}",
            event_data=payload,
            created_at=datetime.utcnow(),
        )
        db.add(event_log)
        await db.commit()

    return {"status": "received", "workflow_id": workflow_id}
