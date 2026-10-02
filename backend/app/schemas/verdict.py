"""
CLIMASCOPE — Verdict & Missing Evidence Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from .common import VerdictLabel, EvidenceSourceType
from .decision import DecisionRequest


class FormulaBreakdown(BaseModel):
    evidenceQuality: float
    modelAgreement: float
    decisionRelevance: float
    consequenceOfError: float
    rawScore: float
    normalizedScore: float


class ThresholdsConfig(BaseModel):
    sufficient: float
    needMore: float


class VerdictResponse(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    verdict: VerdictLabel
    explanation: str
    breakdown: FormulaBreakdown
    thresholds: ThresholdsConfig


class MissingEvidenceItem(BaseModel):
    id: str
    sourceType: EvidenceSourceType
    name: str
    description: str
    estimatedScoreGain: float
    feasibility: str
    acquisitionHint: str


class MissingEvidenceResponse(BaseModel):
    items: List[MissingEvidenceItem]
    currentScore: float
    potentialScore: float
    estimateNote: str = (
        "Illustrative marginal estimate based on assumed candidate quality profiles; "
        "not a measured or guaranteed score gain."
    )


class VerdictRequest(BaseModel):
    decision: DecisionRequest
    enabledSourceIds: Optional[List[str]] = None
