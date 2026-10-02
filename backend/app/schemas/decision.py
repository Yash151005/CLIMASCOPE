"""
CLIMASCOPE — Decision Schemas
"""

from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .common import GeoLocation, DecisionDomain, ConsequenceLevel


class DecisionRequest(BaseModel):
    location: GeoLocation
    domain: DecisionDomain
    action: str = Field(..., min_length=2, description="Proposed climate action or intervention")
    timeHorizonHours: int = Field(default=48, ge=1, le=720, description="Decision planning horizon in hours")
    consequenceLevel: ConsequenceLevel = Field(default=ConsequenceLevel.HIGH)


class DecisionRecordSchema(BaseModel):
    id: str
    recordType: Literal["seed-demo", "user-audit"] = "user-audit"
    request: DecisionRequest
    verdict: "VerdictResponse"
    evidence: "EvidencePanelResponse"
    consensus: "ConsensusResponse"
    missingEvidence: "MissingEvidenceResponse"
    createdAt: str


# Forward refs will be resolved in __init__.py
