"""
CLIMASCOPE — Database Models
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, JSON
from .session import Base


class DecisionAuditModel(Base):
    __tablename__ = "decision_audits"

    id = Column(String(64), primary_key=True, default=lambda: f"dec-{uuid.uuid4().hex[:8]}")
    domain = Column(String(32), nullable=False)
    action = Column(Text, nullable=False)
    location_label = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    time_horizon_hours = Column(Integer, nullable=False, default=48)
    consequence_level = Column(String(32), nullable=False, default="high")

    # Scores and Verdict
    sufficiency_score = Column(Float, nullable=False)
    verdict = Column(String(32), nullable=False)
    explanation = Column(Text, nullable=False)

    # Detailed breakdown JSON
    formula_breakdown = Column(JSON, nullable=False)
    evidence_snapshot = Column(JSON, nullable=False)
    consensus_snapshot = Column(JSON, nullable=False)
    missing_evidence_snapshot = Column(JSON, nullable=True)
    record_kind = Column(String(32), nullable=False, default="user-audit")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class HistoricalCaseModel(Base):
    __tablename__ = "historical_cases"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    domain = Column(String(32), nullable=False)
    location_label = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    event_date = Column(String(32), nullable=False)
    actual_outcome = Column(Text, nullable=False)
    predicted_verdict = Column(String(32), nullable=False)
    actual_verdict_correct = Column(Boolean, nullable=False)
    sufficiency_score = Column(Float, nullable=False)
    ablation_data = Column(JSON, nullable=True)
