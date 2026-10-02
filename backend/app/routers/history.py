"""Persisted decision history endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..db.models import DecisionAuditModel
from ..db.session import get_db
from ..schemas.common import ConsequenceLevel, DecisionDomain, GeoLocation, VerdictLabel
from ..schemas.consensus import ConsensusResponse
from ..schemas.decision import DecisionRecordSchema, DecisionRequest
from ..schemas.evidence import EvidencePanelResponse
from ..schemas.verdict import (
    FormulaBreakdown,
    MissingEvidenceResponse,
    ThresholdsConfig,
    VerdictResponse,
)

router = APIRouter(prefix="/history", tags=["History"])


def _to_record(row: DecisionAuditModel) -> DecisionRecordSchema:
    breakdown = row.formula_breakdown
    consensus = row.consensus_snapshot or {}
    missing = row.missing_evidence_snapshot or {}
    return DecisionRecordSchema(
        id=row.id,
        recordType=row.record_kind,
        request=DecisionRequest(
            location=GeoLocation(
                lat=row.latitude, lng=row.longitude, label=row.location_label
            ),
            domain=DecisionDomain(row.domain),
            action=row.action,
            timeHorizonHours=row.time_horizon_hours,
            consequenceLevel=ConsequenceLevel(row.consequence_level),
        ),
        verdict=VerdictResponse(
            score=row.sufficiency_score,
            verdict=VerdictLabel(row.verdict),
            explanation=row.explanation,
            breakdown=FormulaBreakdown(**breakdown),
            thresholds=ThresholdsConfig(
                sufficient=settings.VERDICT_THRESHOLD_SUFFICIENT,
                needMore=settings.VERDICT_THRESHOLD_NEED_MORE,
            ),
        ),
        evidence=EvidencePanelResponse(
            sources=row.evidence_snapshot or [],
            aggregateQuality=breakdown.get("evidenceQuality", 0.0),
        ),
        consensus=ConsensusResponse(
            models=consensus.get("models", []),
            agreementScore=consensus.get("agreementScore", 0.0),
            disagreementBand=consensus.get(
                "disagreementBand", {"min": 0, "max": 0, "unit": ""}
            ),
            calibrationIndicator=consensus.get("calibrationIndicator", 0.0),
            explanation=consensus.get("explanation", ""),
        ),
        missingEvidence=MissingEvidenceResponse(
            items=missing.get("items", []),
            currentScore=missing.get("currentScore", row.sufficiency_score),
            potentialScore=missing.get("potentialScore", row.sufficiency_score),
            estimateNote=missing.get(
                "estimateNote",
                "Seeded or legacy record; no measured potential score is available.",
            ),
        ),
        createdAt=row.created_at.isoformat(),
    )


@router.get("", response_model=List[DecisionRecordSchema])
def get_all_history(db: Session = Depends(get_db)):
    rows = (
        db.query(DecisionAuditModel)
        .order_by(DecisionAuditModel.created_at.desc())
        .all()
    )
    return [_to_record(row) for row in rows]


@router.get("/{record_id}", response_model=DecisionRecordSchema)
def get_history_by_id(record_id: str, db: Session = Depends(get_db)):
    row = db.get(DecisionAuditModel, record_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Decision record not found.")
    return _to_record(row)
