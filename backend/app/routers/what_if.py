"""
CLIMASCOPE — What-If Router
POST /api/v1/what-if
"""

from fastapi import APIRouter, HTTPException
from ..schemas.whatif import WhatIfRequest, WhatIfResponse
from ..schemas.evidence import EvidencePanelResponse
from ..services.ingestion.registry import IngestionService
from ..services.audit import audit_service
from ..services.consensus import consensus_service
from ..services.engine import decision_engine
from ..services.recommender import recommender_service

router = APIRouter(prefix="/what-if", tags=["What-If"])
ingestion_service = IngestionService()


@router.post("", response_model=WhatIfResponse)
async def simulate_what_if(req: WhatIfRequest):
    """
    Evaluates what happens to Sufficiency, Verdict, and Missing Evidence
    when specific evidence sources are ablated or included.
    """
    try:
        raw_sources = await ingestion_service.ingest_evidence(
            decision=req.decision,
            enabled_ids=req.enabledSourceIds,
        )
        updated_sources, aggregate_quality = audit_service.audit_evidence_panel(raw_sources)
        evidence_panel = EvidencePanelResponse(
            sources=updated_sources,
            aggregateQuality=aggregate_quality,
        )

        consensus = await consensus_service.get_consensus_for_decision(req.decision)

        verdict = decision_engine.calculate_verdict(
            sources=updated_sources,
            consensus=consensus,
            decision=req.decision,
        )

        missing_evidence = recommender_service.recommend_missing_evidence(
            current_score=verdict.score,
            decision=req.decision,
            active_sources=updated_sources,
            consensus=consensus,
        )

        return WhatIfResponse(
            verdict=verdict,
            evidence=evidence_panel,
            consensus=consensus,
            missingEvidence=missing_evidence,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-If simulation failed: {str(e)}")
