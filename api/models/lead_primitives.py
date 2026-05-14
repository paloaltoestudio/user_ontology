from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class LeadEvent(Base):
    """Immutable append-only facts about a lead. Never updated or deleted."""

    __tablename__ = "lead_events"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(255), nullable=False, index=True)  # e.g. "ecommerce.purchase"
    payload = Column(JSON, nullable=False, default=dict)
    source = Column(String(255), nullable=False)  # "admin", "api", "ai_agent", "system", or api_key name
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    lead = relationship("Lead", back_populates="events")

    def __repr__(self) -> str:
        return f"<LeadEvent(id={self.id}, lead_id={self.lead_id}, event_type={self.event_type})>"


class LeadProperty(Base):
    """Typed key/value pairs attached to a lead. Upsert semantics per key."""

    __tablename__ = "lead_properties"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    key = Column(String(255), nullable=False, index=True)
    value = Column(String(4096), nullable=False)  # always stored as string, cast by value_type
    value_type = Column(String(20), nullable=False, default="string")  # string | number | boolean | datetime
    source = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="properties")

    __table_args__ = (
        UniqueConstraint("lead_id", "key", name="uq_lead_property_lead_key"),
    )

    def __repr__(self) -> str:
        return f"<LeadProperty(lead_id={self.lead_id}, key={self.key}, value={self.value})>"


class LeadTag(Base):
    """Stackable classification labels for a lead. Unique per (lead, name)."""

    __tablename__ = "lead_tags"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)  # e.g. "vip", "at-risk"
    source = Column(String(255), nullable=False)  # "admin", "api", "rule", "ai_agent"
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    applied_by = Column(String(255), nullable=False)  # user email, api key name, or agent id

    lead = relationship("Lead", back_populates="tags")

    __table_args__ = (
        UniqueConstraint("lead_id", "name", name="uq_lead_tag_lead_name"),
    )

    def __repr__(self) -> str:
        return f"<LeadTag(lead_id={self.lead_id}, name={self.name})>"
