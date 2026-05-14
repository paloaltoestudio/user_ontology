from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class LeadEventCreate(BaseModel):
    event_type: str = Field(..., max_length=255, description="e.g. 'ecommerce.purchase'")
    payload: Dict[str, Any] = Field(default_factory=dict)


class LeadEventResponse(BaseModel):
    id: int
    lead_id: int
    account_id: Optional[int] = None
    event_type: str
    payload: Dict[str, Any]
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Properties
# ---------------------------------------------------------------------------

ValueType = Literal["string", "number", "boolean", "datetime"]


class LeadPropertyUpsert(BaseModel):
    value: str = Field(..., max_length=4096)
    value_type: ValueType = "string"


class LeadPropertyResponse(BaseModel):
    id: int
    lead_id: int
    account_id: Optional[int] = None
    key: str
    value: str
    value_type: str
    source: str
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

class LeadTagCreate(BaseModel):
    name: str = Field(..., max_length=255)


class LeadTagResponse(BaseModel):
    id: int
    lead_id: int
    account_id: Optional[int] = None
    name: str
    source: str
    applied_at: datetime
    applied_by: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Stage
# ---------------------------------------------------------------------------

class LeadStageUpdate(BaseModel):
    stage: Optional[str] = Field(None, max_length=255)
    note: Optional[str] = Field(None, max_length=500)


class LeadStageHistoryResponse(BaseModel):
    id: int
    lead_id: int
    from_stage: Optional[str] = None
    to_stage: str
    changed_by: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
