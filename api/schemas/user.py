from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict, Any
from models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    """User creation schema"""

    password: str = Field(..., min_length=8, max_length=255)


class UserUpdate(BaseModel):
    """User update schema"""

    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    user_metadata: Optional[Dict[str, Any]] = None


class UserResponse(UserBase):
    """User response schema"""

    id: int
    role: UserRole
    is_active: bool
    lead_score: int
    user_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserAdminUpdate(UserUpdate):
    """User admin update schema"""

    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    lead_score: Optional[int] = None
