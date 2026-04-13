from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from datetime import datetime
from core.database import Base


class ApiKey(Base):
    """
    System-wide API keys for external integrations.
    Can be scoped to specific features (goals, webhooks, integrations, etc.)
    """

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), nullable=False, unique=True, index=True)  # The actual API key (sk_...)
    name = Column(String(255), nullable=False)  # Human-readable name
    description = Column(String(1000), nullable=True)  # Optional description
    scopes = Column(JSON, default=[], nullable=False)  # List of scopes: ["goals", "webhooks", "integrations"]
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who created it
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_used_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, name={self.name}, scopes={self.scopes}, is_active={self.is_active})>"

    def has_scope(self, scope: str) -> bool:
        """Check if this API key has the required scope"""
        return scope in self.scopes
