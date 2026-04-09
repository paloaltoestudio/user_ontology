from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter(prefix="/flows", tags=["flows"])


@router.post("/start/{flow_id}")
async def start_flow(
    flow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start a registration flow for the current user.

    TODO: Implement flow logic
    - Trigger n8n workflow
    - Log event
    - Return flow state
    """
    return {"message": f"Flow {flow_id} started for user {current_user.id}"}


@router.post("/complete/{flow_id}")
async def complete_flow(
    flow_id: str,
    flow_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete a registration flow step.

    TODO: Implement flow completion logic
    - Update user metadata
    - Log event
    - Trigger scoring
    - Trigger n8n notifications
    """
    return {"message": f"Flow {flow_id} step completed for user {current_user.id}"}
