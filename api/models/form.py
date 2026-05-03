from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
import secrets
from core.database import Base


class Form(Base):
    """Registration form template"""

    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    display_as_steps = Column(Boolean, default=True, nullable=False)  # If true, show form as steps; if false, show all fields at once
    webhooks = Column(JSON, default=[], nullable=False)  # List of webhook URLs to send form data to
    lead_field_mapping = Column(JSON, default={}, nullable=False)  # Maps lead properties to form field names: {"name": "field_name", "email": "contact_email", ...}
    webhook_token = Column(String(64), unique=True, index=True, nullable=True)  # Secret token for inbound external webhook URL
    external_field_mapping = Column(JSON, nullable=True)  # Maps lead properties to incoming payload keys: {"email": "contact_email", "name": "first_name"}
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    steps = relationship("FormStep", back_populates="form", cascade="all, delete-orphan")
    actions = relationship("Action", secondary="form_actions", back_populates="forms")

    def __repr__(self) -> str:
        return f"<Form(id={self.id}, name={self.name}, is_active={self.is_active})>"


class FormStep(Base):
    """Step/page within a form"""

    __tablename__ = "form_steps"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    form = relationship("Form", back_populates="steps")
    fields = relationship("FormField", back_populates="step", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<FormStep(id={self.id}, form_id={self.form_id}, step_number={self.step_number})>"


class FormField(Base):
    """Field within a form step"""

    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("form_steps.id"), nullable=False, index=True)
    field_name = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, email, password, number, textarea, select, checkbox, date
    required = Column(Boolean, default=False, nullable=False)
    help_text = Column(String(500), nullable=True)
    user_field_mapping = Column(String(255), nullable=True)  # null=metadata, "email"="User.email", etc.
    field_options = Column(JSON, nullable=True)  # For select/checkbox: [{"label": "...", "value": "..."}]
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    step = relationship("FormStep", back_populates="fields")

    def __repr__(self) -> str:
        return f"<FormField(id={self.id}, field_name={self.field_name}, field_type={self.field_type})>"
