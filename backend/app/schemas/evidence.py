"""
CLIMASCOPE — Evidence Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from .common import EvidenceSourceType, AuditDimension
from .decision import DecisionRequest


class AuditScore(BaseModel):
    dimension: AuditDimension
    score: float = Field(..., ge=0.0, le=1.0, description="Audit score 0 to 1")
    explanation: str
    weight: float = Field(default=0.2, ge=0.0, le=1.0)


class EvidenceSource(BaseModel):
    id: str
    type: EvidenceSourceType
    name: str
    provider: str
    description: str
    retrievedAt: str
    dataTimestamp: str
    license: str
    resolution: str
    auditScores: List[AuditScore]
    overallQuality: float = Field(..., ge=0.0, le=1.0)
    enabled: bool = True
    rawSummary: str


class EvidencePanelResponse(BaseModel):
    sources: List[EvidenceSource]
    aggregateQuality: float = Field(..., ge=0.0, le=1.0)


class EvidenceRequest(BaseModel):
    decision: DecisionRequest
    enabledSourceIds: Optional[List[str]] = None
