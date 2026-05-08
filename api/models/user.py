from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from core.database import Base


class UserRole(str, enum.Enum):
    """User roles enumeration"""

    ADMIN = "admin"
    USER = "user"


class User(Base):
    """User model for authentication and registration"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    last_active_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    lead_score = Column(Integer, default=0, nullable=False)
    user_metadata = Column(JSON, default={}, nullable=False)  # Store custom user data for scoring
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    event_logs = relationship("EventLog", back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    last_active_account = relationship("Account", foreign_keys=[last_active_account_id])

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username}, role={self.role})>"
