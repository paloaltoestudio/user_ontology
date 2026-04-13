from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Table, func
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


# Association tables for many-to-many relationships
form_actions = Table(
    "form_actions",
    Base.metadata,
    Column("form_id", Integer, ForeignKey("forms.id", ondelete="CASCADE"), primary_key=True),
    Column("action_id", Integer, ForeignKey("actions.id", ondelete="CASCADE"), primary_key=True),
)

user_actions = Table(
    "user_actions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True),
    Column("action_id", Integer, ForeignKey("actions.id", ondelete="CASCADE"), primary_key=True),
)


class Action(Base):
    """Action template for webhooks (reference to external automation)"""

    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    webhook_url = Column(String(2000), nullable=False)
    auto_send = Column(Boolean, default=False, nullable=False)  # If true, execute immediately when assigned to user
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    forms = relationship("Form", secondary=form_actions, back_populates="actions")
    users = relationship("Lead", secondary=user_actions, back_populates="actions")
    logs = relationship("ActionLog", back_populates="action", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Action(id={self.id}, name={self.name}, webhook_url={self.webhook_url})>"


class ActionLog(Base):
    """Track action webhook trigger attempts"""

    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("actions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=True, index=True)
    payload = Column(JSON, nullable=True)  # The data sent to the webhook
    response_status = Column(Integer, nullable=True)  # HTTP status code
    response_body = Column(String(2000), nullable=True)  # Response from webhook
    success = Column(Boolean, default=False, nullable=False, index=True)
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    action = relationship("Action", back_populates="logs")

    def __repr__(self) -> str:
        return f"<ActionLog(id={self.id}, action_id={self.action_id}, user_id={self.user_id}, success={self.success})>"
