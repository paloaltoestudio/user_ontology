from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ApiKeyBase(BaseModel):
    """Base API key schema"""

    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name for the API key")
    description: Optional[str] = Field(None, max_length=1000, description="Optional description of what the key is used for")
    scopes: List[str] = Field(
        ...,
        min_items=1,
        description="List of scopes this key has access to (e.g., ['goals', 'webhooks'])"
    )


class ApiKeyCreate(ApiKeyBase):
    """Request schema to create API key"""
    pass


class ApiKeyUpdate(BaseModel):
    """Request schema to update API key"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    scopes: Optional[List[str]] = Field(None, min_items=1)


class ApiKeyResponse(BaseModel):
    """Response schema for API key (does NOT include the actual key)"""

    id: int
    name: str
    description: Optional[str] = None
    scopes: List[str]
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    last_used_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreateResponse(ApiKeyResponse):
    """Response schema for API key creation (includes the actual key - only shown once!)"""

    key: str = Field(
        ...,
        description="The actual API key - SAVE THIS! Only shown at creation time. Use as Bearer token."
    )
