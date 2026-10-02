"""
CLIMASCOPE — Verdict Router
POST /api/v1/verdict
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.verdict import VerdictRequest, VerdictResponse
from ..services.ingestion.registry import IngestionService
from ..services.consensus import consensus_service
from ..services.engine import decision_engine
from ..services.recommender import recommender_service
from ..db.session import get_db
from ..db.models import DecisionAuditModel

router = APIRouter(prefix="/verdict", tags=["Verdict"])
ingestion_service = IngestionService()


@router.post("", response_model=VerdictResponse)
async def compute_verdict(req: VerdictRequest, db: Session = Depends(get_db)):
    """
    Evaluates evidence sufficiency for the specified climate action.
    Saves the audit record to the persistent decision database.
    """
    try:
        sources = await ingestion_service.ingest_evidence(
            decision=req.decision,
            enabled_ids=req.enabledSourceIds,
        )
        consensus = await consensus_service.get_consensus_for_decision(req.decision)
        verdict = decision_engine.calculate_verdict(
            sources=sources,
            consensus=consensus,
            decision=req.decision,
        )

        # Persist audit record
        try:
            missing = recommender_service.recommend_missing_evidence(
                current_score=verdict.score,
                decision=req.decision,
                active_sources=sources,
                consensus=consensus,
            )
            audit_record = DecisionAuditModel(
                id=f"dec-{uuid.uuid4().hex[:8]}",
                domain=(
                    req.decision.domain.value
                    if hasattr(req.decision.domain, "value")
                    else str(req.decision.domain)
                ),
                action=req.decision.action,
                location_label=req.decision.location.label,
                latitude=req.decision.location.lat,
                longitude=req.decision.location.lng,
                time_horizon_hours=req.decision.timeHorizonHours,
                consequence_level=(
                    req.decision.consequenceLevel.value
                    if hasattr(req.decision.consequenceLevel, "value")
                    else str(req.decision.consequenceLevel)
                ),
                sufficiency_score=verdict.score,
                verdict=(
                    verdict.verdict.value
                    if hasattr(verdict.verdict, "value")
                    else str(verdict.verdict)
                ),
                explanation=verdict.explanation,
                formula_breakdown=verdict.breakdown.model_dump(),
                evidence_snapshot=[s.model_dump() for s in sources],
                consensus_snapshot=consensus.model_dump(),
                missing_evidence_snapshot=missing.model_dump(),
                created_at=datetime.now(timezone.utc),
            )
            db.add(audit_record)
            db.commit()
        except Exception:
            db.rollback()
            raise

        return verdict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verdict calculation failed: {str(e)}")
