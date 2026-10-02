"""
CLIMASCOPE — Consensus Router
POST /api/v1/consensus
"""

from fastapi import APIRouter
from ..schemas.consensus import ConsensusRequest, ConsensusResponse
from ..services.consensus import consensus_service

router = APIRouter(prefix="/consensus", tags=["Consensus"])


@router.post("", response_model=ConsensusResponse)
async def get_consensus(req: ConsensusRequest):
    """
    Compares operational numerical models and returns agreement score,
    disagreement spread band, and calibration metrics.
    """
    return await consensus_service.get_consensus_for_decision(req.decision)
