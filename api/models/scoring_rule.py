from sqlalchemy import Column, Integer, String, DateTime, func
from datetime import datetime
from core.database import Base


class ScoringRule(Base):
    """Scoring rules for calculating user lead score"""

    __tablename__ = "scoring_rules"

    id = Column(Integer, primary_key=True, index=True)
    field_key = Column(String(255), nullable=False, index=True)  # e.g., "form_step_1_complete", "email_verified"
    operator = Column(String(50), nullable=False)  # e.g., "equals", "contains", "greater_than"
    value = Column(String(255), nullable=False)  # e.g., "true", "admin", "100"
    points = Column(Integer, nullable=False)  # Points to award when rule matches
    is_active = Column(Integer, default=1, nullable=False)  # 1 for active, 0 for inactive
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ScoringRule(id={self.id}, field_key={self.field_key}, operator={self.operator}, points={self.points})>"
