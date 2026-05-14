from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime

ValueType = Literal["string", "number", "boolean", "datetime"]


# ---------------------------------------------------------------------------
# Stage definitions
# ---------------------------------------------------------------------------

class StageDefinitionCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    color: Optional[str] = Field(None, max_length=32)
    sort_order: int = 0


class StageDefinitionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    color: Optional[str] = Field(None, max_length=32)
    sort_order: Optional[int] = None


class StageDefinitionResponse(BaseModel):
    id: int
    account_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Tag definitions
# ---------------------------------------------------------------------------

class TagDefinitionCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    color: Optional[str] = Field(None, max_length=32)


class TagDefinitionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    color: Optional[str] = Field(None, max_length=32)


class TagDefinitionResponse(BaseModel):
    id: int
    account_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Property definitions
# ---------------------------------------------------------------------------

class PropertyDefinitionCreate(BaseModel):
    key: str = Field(..., max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    value_type: ValueType = "string"


class PropertyDefinitionUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    value_type: Optional[ValueType] = None


class PropertyDefinitionResponse(BaseModel):
    id: int
    account_id: int
    key: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    value_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Event type definitions
# ---------------------------------------------------------------------------

class EventTypeDefinitionCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    payload_schema: Optional[Dict[str, Any]] = None


class EventTypeDefinitionUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=1024)
    payload_schema: Optional[Dict[str, Any]] = None


class EventTypeDefinitionResponse(BaseModel):
    id: int
    account_id: int
    name: str
    description: Optional[str] = None
    payload_schema: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
