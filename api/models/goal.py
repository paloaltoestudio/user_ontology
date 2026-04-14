from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Table, func
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Goal(Base):
    """Goal/Milestone template for tracking user progression"""

    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user who created it

    # Relationships
    completions = relationship("GoalCompletion", back_populates="goal", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, name={self.name}, is_active={self.is_active})>"


class GoalCompletion(Base):
    """Track when a user completes a goal"""

    __tablename__ = "goal_completions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)  # Internal user
    external_user_id = Column(String(255), nullable=True, index=True)  # External system user ID
    first_completed_at = Column(DateTime, nullable=False, index=True)  # When goal was first completed
    event_metadata = Column(JSON, nullable=True)  # Store all metadata sent by external app
    source_integration = Column(String(255), nullable=True)  # Which integration sent this event
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    goal = relationship("Goal", back_populates="completions")

    def __repr__(self) -> str:
        return f"<GoalCompletion(id={self.id}, goal_id={self.goal_id}, user_id={self.user_id}, first_completed_at={self.first_completed_at})>"


class GoalAssignment(Base):
    """Track goal assignments to users"""

    __tablename__ = "goal_assignments"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user who assigned it
    due_date = Column(DateTime, nullable=True)  # Optional deadline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    goal = relationship("Goal", lazy="joined", foreign_keys=[goal_id])

    def __repr__(self) -> str:
        return f"<GoalAssignment(id={self.id}, goal_id={self.goal_id}, user_id={self.user_id})>"


class IdempotencyKey(Base):
    """Track processed idempotency keys to prevent duplicate event processing"""

    __tablename__ = "idempotency_keys"

    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(255), nullable=False, unique=True, index=True)
    goal_completion_id = Column(Integer, ForeignKey("goal_completions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<IdempotencyKey(id={self.id}, idempotency_key={self.idempotency_key})>"


