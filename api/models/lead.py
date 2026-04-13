from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Lead(Base):
    """Lead model for form submissions (prospects)"""

    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False, index=True)
    # Static lead information fields
    name = Column(String(255), nullable=False, index=True)
    last_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), index=True, nullable=False)  # Required static field
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    company_url = Column(String(2048), nullable=True)
    # Form tracking
    status = Column(String(50), default="new", nullable=False, index=True)  # new, contacted, qualified, etc.
    form_data = Column(JSON, nullable=False)  # All submitted field values
    notes = Column(String(2000), nullable=True)  # Admin notes about the lead
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    form = relationship("Form")
    webhook_deliveries = relationship("WebhookDelivery", back_populates="lead", cascade="all, delete-orphan")
    actions = relationship("Action", secondary="user_actions", back_populates="users")

    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, form_id={self.form_id}, email={self.email}, status={self.status})>"


class WebhookDelivery(Base):
    """Track webhook delivery attempts for leads"""

    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    webhook_url = Column(String(2000), nullable=False)
    success = Column(Boolean, default=False, nullable=False, index=True)
    error_message = Column(String(1000), nullable=True)  # Error details if failed
    response_status = Column(Integer, nullable=True)  # HTTP status code from webhook
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    lead = relationship("Lead", back_populates="webhook_deliveries")

    def __repr__(self) -> str:
        return f"<WebhookDelivery(id={self.id}, lead_id={self.lead_id}, webhook_url={self.webhook_url}, success={self.success})>"
