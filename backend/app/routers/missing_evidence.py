"""
CLIMASCOPE — Missing Evidence Router
POST /api/v1/missing-evidence
"""

from fastapi import APIRouter, HTTPException
from ..schemas.verdict import VerdictRequest, MissingEvidenceResponse
from ..services.ingestion.registry import IngestionService
from ..services.consensus import consensus_service
from ..services.engine import decision_engine
from ..services.recommender import recommender_service

router = APIRouter(prefix="/missing-evidence", tags=["Missing Evidence"])
ingestion_service = IngestionService()


@router.post("", response_model=MissingEvidenceResponse)
async def get_missing_evidence(req: VerdictRequest):
    """
    Ranks next-best candidate evidence sources by their marginal sufficiency gain.
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
        return recommender_service.recommend_missing_evidence(
            current_score=verdict.score,
            decision=req.decision,
            active_sources=sources,
            consensus=consensus,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Missing evidence recommendation failed: {str(e)}"
        )
