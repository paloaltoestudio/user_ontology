from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class GoalBase(BaseModel):
    """Base goal schema"""

    name: str = Field(..., min_length=1, max_length=255, description="Goal name")
    description: Optional[str] = Field(None, max_length=1000, description="Goal description")
    is_active: bool = Field(default=True, description="Whether goal is active")


class GoalCreate(GoalBase):
    """Goal creation schema"""
    pass


class GoalUpdate(BaseModel):
    """Goal update schema"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = Field(None)


class GoalResponse(GoalBase):
    """Goal response schema"""

    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalCompletionResponse(BaseModel):
    """Goal completion response schema"""

    id: int
    goal_id: int
    user_id: int
    external_user_id: Optional[str] = None
    first_completed_at: datetime
    event_metadata: Optional[Dict[str, Any]] = None
    source_integration: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GoalEventRequest(BaseModel):
    """Request schema for external app to post goal completion event"""

    goal_id: int = Field(..., description="Goal ID")
    goal_name: Optional[str] = Field(None, max_length=255, description="Goal name for reference (not used for lookup)")
    external_user_id: Optional[str] = Field(None, max_length=255, description="External system's user ID")
    internal_user_id: Optional[int] = Field(None, description="Our internal user ID (optional)")
    email: Optional[str] = Field(None, description="User email (used as fallback if external_user_id not found)")
    timestamp: datetime = Field(..., description="When the goal was completed in external system")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata to store")


class GoalEventResponse(BaseModel):
    """Response schema for goal event"""

    success: bool = Field(..., description="Whether event was processed successfully")
    data: Optional[GoalCompletionResponse] = Field(None, description="Goal completion data if successful")
    error: Optional[Dict[str, Any]] = Field(None, description="Error details if failed")


class GoalAssignmentCreate(BaseModel):
    """Request schema to assign goal to a single user"""

    user_id: int = Field(..., description="User/Lead ID to assign goal to")
    due_date: Optional[datetime] = Field(None, description="Optional deadline for the goal")


class GoalAssignmentBulkCreate(BaseModel):
    """Request schema to assign goal to multiple users"""

    user_ids: list[int] = Field(..., min_items=1, description="List of User/Lead IDs to assign goal to")
    due_date: Optional[datetime] = Field(None, description="Optional deadline for all assignments")


class GoalAssignmentResponse(BaseModel):
    """Response schema for goal assignment"""

    id: int
    goal_id: int
    user_id: int
    assigned_by: Optional[int] = None
    due_date: Optional[datetime] = None
    assigned_at: datetime
    created_at: datetime
    updated_at: datetime
    goal: Optional['GoalResponse'] = None

    class Config:
        from_attributes = True


class GoalAssignmentBulkResponse(BaseModel):
    """Response schema for bulk goal assignments"""

    success: bool = Field(..., description="Whether all assignments were created successfully")
    assigned_count: int = Field(..., description="Number of users the goal was assigned to")
    failed_count: int = Field(default=0, description="Number of assignments that failed")
    assignments: list[GoalAssignmentResponse] = Field(default=[], description="Created assignments")
    errors: Optional[Dict[str, str]] = Field(None, description="Errors for failed assignments")


class ApiKeyCreate(BaseModel):
    """Request schema to create API key"""

    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name for the API key")


class ApiKeyResponse(BaseModel):
    """Response schema for API key"""

    id: int
    name: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class ApiKeyCreateResponse(ApiKeyResponse):
    """Response schema for API key creation (includes the actual key)"""

    key: str = Field(..., description="The actual API key - only shown at creation time")


# Update forward references for nested schemas
GoalAssignmentResponse.model_rebuild()
