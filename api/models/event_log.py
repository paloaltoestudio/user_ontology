from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class EventLog(Base):
    """Event log for tracking user milestones and actions"""

    __tablename__ = "event_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(255), nullable=False, index=True)  # e.g., "form_step_1_complete", "email_verified", "profile_updated"
    event_data = Column(JSON, default={}, nullable=False)  # Additional event metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="event_logs")

    def __repr__(self) -> str:
        return f"<EventLog(id={self.id}, user_id={self.user_id}, event_type={self.event_type})>"
