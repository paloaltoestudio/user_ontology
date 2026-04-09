from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ScoringRuleBase(BaseModel):
    """Base scoring rule schema"""

    field_key: str = Field(..., min_length=1, max_length=255)
    operator: str = Field(..., min_length=1, max_length=50)  # equals, contains, greater_than, etc.
    value: str = Field(..., min_length=1, max_length=255)
    points: int = Field(..., ge=0, le=1000)


class ScoringRuleCreate(ScoringRuleBase):
    """Scoring rule creation schema"""

    pass


class ScoringRuleUpdate(BaseModel):
    """Scoring rule update schema"""

    field_key: Optional[str] = Field(None, min_length=1, max_length=255)
    operator: Optional[str] = Field(None, min_length=1, max_length=50)
    value: Optional[str] = Field(None, min_length=1, max_length=255)
    points: Optional[int] = Field(None, ge=0, le=1000)
    is_active: Optional[int] = None


class ScoringRuleResponse(ScoringRuleBase):
    """Scoring rule response schema"""

    id: int
    is_active: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
