from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class ExternalSubmission(Base):
    """Raw payload received from an external form via inbound webhook"""

    __tablename__ = "external_submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    raw_payload = Column(JSON, nullable=False)  # Original payload as received, never mutated
    content_type = Column(String(100), nullable=True)  # e.g. application/json, application/x-www-form-urlencoded
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, processed, failed
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)  # set when successfully processed
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    processed_at = Column(DateTime, nullable=True)

    form = relationship("Form")
    lead = relationship("Lead")

    def __repr__(self) -> str:
        return f"<ExternalSubmission(id={self.id}, form_id={self.form_id}, status={self.status})>"
