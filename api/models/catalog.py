from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, UniqueConstraint
from datetime import datetime
from core.database import Base


class StageDefinition(Base):
    """Global catalog of lifecycle stages for an account."""

    __tablename__ = "stage_definitions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    color = Column(String(32), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("account_id", "name", name="uq_stage_def_account_name"),
    )


class TagDefinition(Base):
    """Global catalog of lead tags for an account."""

    __tablename__ = "tag_definitions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    color = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("account_id", "name", name="uq_tag_def_account_name"),
    )


class PropertyDefinition(Base):
    """Global catalog of lead property keys for an account."""

    __tablename__ = "property_definitions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)
    description = Column(String(1024), nullable=True)
    value_type = Column(String(20), nullable=False, default="string")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("account_id", "key", name="uq_prop_def_account_key"),
    )


class EventTypeDefinition(Base):
    """Global catalog of lead event types for an account."""

    __tablename__ = "event_type_definitions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    payload_schema = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("account_id", "name", name="uq_event_type_def_account_name"),
    )
