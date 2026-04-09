from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class EventLogBase(BaseModel):
    """Base event log schema"""

    event_type: str = Field(..., min_length=1, max_length=255)
    event_data: Dict[str, Any] = Field(default_factory=dict)


class EventLogCreate(EventLogBase):
    """Event log creation schema"""

    pass


class EventLogResponse(EventLogBase):
    """Event log response schema"""

    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
