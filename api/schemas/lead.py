from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class LeadBase(BaseModel):
    """Base lead schema"""

    email: Optional[str] = None
    status: str = Field(default="new", description="Lead status: new, contacted, qualified, demo_scheduled, negotiating, cold, rejected, user_signup, trial_started, customer")
    notes: Optional[str] = Field(None, max_length=2000)


class LeadCreate(BaseModel):
    """Lead creation schema (form submission)"""

    form_data: Dict[str, Any] = Field(..., description="Form field values submitted")
    email: Optional[str] = None  # Can be extracted from form_data


class LeadUpdate(BaseModel):
    """Lead update schema (admin only)"""

    status: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)


class WebhookDeliveryResponse(BaseModel):
    """Webhook delivery response schema"""

    id: int
    webhook_url: str
    success: bool
    error_message: Optional[str] = None
    response_status: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeadResponse(LeadBase):
    """Lead response schema"""

    id: int
    form_id: int
    form_data: Dict[str, Any]
    webhook_deliveries: Optional[List[WebhookDeliveryResponse]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Default lead statuses
DEFAULT_LEAD_STATUSES = [
    "new",
    "contacted",
    "qualified",
    "demo_scheduled",
    "negotiating",
    "cold",
    "rejected",
    "user_signup",
    "trial_started",
    "customer",
]
