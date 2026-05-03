from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ExternalSubmissionResponse(BaseModel):
    id: int
    form_id: int
    raw_payload: Dict[str, Any]
    content_type: Optional[str] = None
    status: str
    lead_id: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExternalSubmissionStats(BaseModel):
    pending: int
    processed: int
    failed: int
    total: int


class ExternalFieldMappingUpdate(BaseModel):
    mapping: Dict[str, str] = Field(
        ...,
        description="Maps lead properties to incoming payload keys. e.g. {'email': 'contact_email', 'name': 'first_name'}"
    )


class ProcessResult(BaseModel):
    processed: int
    stopped_at: Optional[int] = None  # submission id where processing stopped due to failure
    remaining_pending: int
    message: str
