from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Lead(Base):
    """Lead model for form submissions (prospects)"""

    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    # Static lead information fields
    name = Column(String(255), nullable=False, index=True)
    last_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    company_url = Column(String(2048), nullable=True)
    # Lifecycle tracking
    stage = Column(String(255), nullable=True, index=True)  # free-form label, no enum constraint
    entry_source = Column(String(50), default="form", nullable=False)
    form_data = Column(JSON, nullable=False)
    notes = Column(String(2000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    form = relationship("Form")
    webhook_deliveries = relationship("WebhookDelivery", back_populates="lead", cascade="all, delete-orphan")
    actions = relationship("Action", secondary="user_actions", back_populates="users")
    stage_history = relationship("LeadStageHistory", back_populates="lead", cascade="all, delete-orphan", order_by="LeadStageHistory.created_at")
    events = relationship("LeadEvent", back_populates="lead", cascade="all, delete-orphan", order_by="LeadEvent.created_at")
    properties = relationship("LeadProperty", back_populates="lead", cascade="all, delete-orphan")
    tags = relationship("LeadTag", back_populates="lead", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, form_id={self.form_id}, email={self.email}, stage={self.stage})>"


class LeadStageHistory(Base):
    """Track stage changes for a lead over time"""

    __tablename__ = "lead_stage_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    from_stage = Column(String(255), nullable=True)
    to_stage = Column(String(255), nullable=False)
    changed_by = Column(String(255), nullable=True)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    lead = relationship("Lead", back_populates="stage_history")

    def __repr__(self) -> str:
        return f"<LeadStageHistory(lead_id={self.lead_id}, {self.from_stage}→{self.to_stage})>"


class WebhookDelivery(Base):
    """Track webhook delivery attempts for leads"""

    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    webhook_url = Column(String(2000), nullable=False)
    success = Column(Boolean, default=False, nullable=False, index=True)
    error_message = Column(String(1000), nullable=True)
    response_status = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    lead = relationship("Lead", back_populates="webhook_deliveries")

    def __repr__(self) -> str:
        return f"<WebhookDelivery(id={self.id}, lead_id={self.lead_id}, webhook_url={self.webhook_url}, success={self.success})>"
