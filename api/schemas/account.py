import re
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models.account import MembershipRole


def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")[:100]


class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)


class AccountResponse(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MembershipResponse(BaseModel):
    id: int
    user_id: int
    account_id: int
    role: MembershipRole
    created_at: datetime
    account: AccountResponse

    class Config:
        from_attributes = True


class AddMemberRequest(BaseModel):
    email: str
    role: MembershipRole = MembershipRole.MEMBER


class SwitchAccountRequest(BaseModel):
    account_id: int


class SlugValidationResponse(BaseModel):
    slug: str
    available: bool
