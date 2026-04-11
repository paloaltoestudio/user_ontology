from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class LeadBase(BaseModel):
    """Base lead schema"""

    name: str = Field(..., min_length=1, max_length=255, description="Lead first name")
    last_name: str = Field(..., min_length=1, max_length=255, description="Lead last name")
    email: str = Field(..., max_length=255, description="Lead email")
    phone: Optional[str] = Field(None, max_length=50, description="Lead phone number")
    company: Optional[str] = Field(None, max_length=255, description="Lead company")
    company_url: Optional[str] = Field(None, max_length=2048, description="Lead company website")
    status: str = Field(default="new", description="Lead status: new, contacted, qualified, demo_scheduled, negotiating, cold, rejected, user_signup, trial_started, customer")
    notes: Optional[str] = Field(None, max_length=2000)


class LeadCreate(BaseModel):
    """Lead creation schema (form submission)"""

    name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    company_url: Optional[str] = Field(None, max_length=2048)
    form_data: Dict[str, Any] = Field(..., description="Form field values submitted")


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
