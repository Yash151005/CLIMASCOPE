"""
CLIMASCOPE — What-If Request & Response Schemas
"""

from typing import List
from pydantic import BaseModel
from .decision import DecisionRequest
from .evidence import EvidencePanelResponse
from .consensus import ConsensusResponse
from .verdict import VerdictResponse, MissingEvidenceResponse


class WhatIfRequest(BaseModel):
    decision: DecisionRequest
    enabledSourceIds: List[str]


class WhatIfResponse(BaseModel):
    verdict: VerdictResponse
    evidence: EvidencePanelResponse
    consensus: ConsensusResponse
    missingEvidence: MissingEvidenceResponse
