from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime


class ActionBase(BaseModel):
    """Base action schema"""

    name: str = Field(..., min_length=1, max_length=255, description="Action name")
    description: Optional[str] = Field(None, max_length=1000, description="Action description")
    webhook_url: str = Field(..., max_length=2000, description="Webhook URL to trigger external automation")
    auto_send: bool = Field(default=False, description="If true, execute immediately when assigned to user")


class ActionCreate(ActionBase):
    """Action creation schema"""
    pass


class ActionUpdate(BaseModel):
    """Action update schema"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    webhook_url: Optional[str] = Field(None, max_length=2000)
    auto_send: Optional[bool] = Field(None, description="If true, execute immediately when assigned to user")


class ActionResponse(ActionBase):
    """Action response schema"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActionLogResponse(BaseModel):
    """Action log entry response schema"""

    id: int
    action_id: int
    user_id: Optional[int] = None
    form_id: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BulkAssignActionRequest(BaseModel):
    """Request schema for bulk assigning action to multiple users"""

    action_id: int = Field(..., description="Action ID to assign")
    user_ids: List[int] = Field(..., min_items=1, description="List of user IDs to assign action to")


class BulkApplyActionRequest(BaseModel):
    """Request schema for bulk applying action to multiple leads"""

    action_id: int = Field(..., description="Action ID to apply")
    lead_ids: List[int] = Field(..., min_items=1, description="List of lead IDs to apply action to")
