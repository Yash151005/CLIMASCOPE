"""
CLIMASCOPE — Evidence Router
POST /api/v1/evidence
"""

from fastapi import APIRouter, HTTPException
from ..schemas.evidence import EvidenceRequest, EvidencePanelResponse
from ..services.ingestion.registry import IngestionService
from ..services.audit import audit_service

router = APIRouter(prefix="/evidence", tags=["Evidence"])
ingestion_service = IngestionService()


@router.post("", response_model=EvidencePanelResponse)
async def get_evidence_panel(req: EvidenceRequest):
    """
    Ingests observational and forecast feeds for target location,
    runs the 5-dimension audit, and returns audited evidence sources.
    """
    try:
        sources = await ingestion_service.ingest_evidence(
            decision=req.decision,
            enabled_ids=req.enabledSourceIds,
        )
        updated_sources, aggregate_quality = audit_service.audit_evidence_panel(sources)
        return EvidencePanelResponse(
            sources=updated_sources,
            aggregateQuality=aggregate_quality,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evidence audit failed: {str(e)}")
