from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class FormFieldBase(BaseModel):
    """Base form field schema"""

    field_name: str = Field(..., min_length=1, max_length=255)
    field_type: str = Field(..., description="text, email, password, number, textarea, select, checkbox, date")
    required: bool = False
    help_text: Optional[str] = Field(None, max_length=500)
    user_field_mapping: Optional[str] = Field(None, max_length=255, description="null=metadata, 'email'=User.email, etc.")
    field_options: Optional[List[Dict[str, str]]] = Field(None, description="For select/checkbox: [{'label': '...', 'value': '...'}]")
    display_order: int


class FormFieldCreate(FormFieldBase):
    """Create form field schema"""
    pass


class FormFieldUpdate(BaseModel):
    """Update form field schema"""

    field_name: Optional[str] = Field(None, min_length=1, max_length=255)
    field_type: Optional[str] = None
    required: Optional[bool] = None
    help_text: Optional[str] = Field(None, max_length=500)
    user_field_mapping: Optional[str] = Field(None, max_length=255)
    field_options: Optional[List[Dict[str, str]]] = None
    display_order: Optional[int] = None


class FormFieldResponse(FormFieldBase):
    """Form field response schema"""

    id: int
    step_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FormStepBase(BaseModel):
    """Base form step schema"""

    step_number: int
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class FormStepCreate(FormStepBase):
    """Create form step schema"""

    fields: Optional[List[FormFieldCreate]] = []


class FormStepUpdate(BaseModel):
    """Update form step schema"""

    step_number: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class FormStepResponse(FormStepBase):
    """Form step response schema"""

    id: int
    form_id: int
    fields: List[FormFieldResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FormBase(BaseModel):
    """Base form schema"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: bool = False
    display_as_steps: bool = Field(default=True, description="If true, display form as steps; if false, show all fields at once")
    webhooks: Optional[List[str]] = Field(default_factory=list, description="Webhook URLs to send form data to")
    lead_field_mapping: Optional[Dict[str, str]] = Field(default_factory=dict, description="Maps lead static fields to form field names: {'name': 'first_name', 'email': 'contact_email', ...}")


class FormCreate(FormBase):
    """Create form schema"""

    steps: Optional[List[FormStepCreate]] = []


class FormUpdate(BaseModel):
    """Update form schema"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    display_as_steps: Optional[bool] = None
    webhooks: Optional[List[str]] = None
    lead_field_mapping: Optional[Dict[str, str]] = None


class FormResponse(FormBase):
    """Form response schema"""

    id: int
    steps: List[FormStepResponse]
    display_as_steps: bool
    webhooks: List[str]
    webhook_token: Optional[str] = None
    external_field_mapping: Optional[Dict[str, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
