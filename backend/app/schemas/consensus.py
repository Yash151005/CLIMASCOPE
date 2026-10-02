"""
CLIMASCOPE — Consensus & Uncertainty Schemas
"""

from typing import List
from typing import Literal
from pydantic import BaseModel, Field
from .decision import DecisionRequest


class ModelOutput(BaseModel):
    modelId: str
    modelName: str
    provider: str
    value: float
    unit: str
    confidenceLow: float
    confidenceHigh: float
    timestamp: str


class DisagreementBand(BaseModel):
    min: float
    max: float
    unit: str


class ConsensusResponse(BaseModel):
    models: List[ModelOutput]
    agreementScore: float = Field(..., ge=0.0, le=1.0)
    disagreementBand: DisagreementBand
    calibrationIndicator: float = Field(..., ge=0.0, le=1.0)
    calibrationStatus: Literal["available", "unavailable", "illustrative"] = "unavailable"
    explanation: str


class ConsensusRequest(BaseModel):
    decision: DecisionRequest
