"""
CLIMASCOPE — Validation & Benchmark Schemas
"""

from typing import List
from pydantic import BaseModel
from .common import GeoLocation, DecisionDomain, VerdictLabel


class HistoricalCase(BaseModel):
    id: str
    title: str
    domain: DecisionDomain
    location: GeoLocation
    date: str
    actualOutcome: str
    predictedVerdict: VerdictLabel
    actualVerdictCorrect: bool
    sufficiencyScore: float


class RobustnessResult(BaseModel):
    caseId: str
    removedSource: str
    originalScore: float
    reducedScore: float
    verdictChanged: bool


class ValidationResponse(BaseModel):
    cases: List[HistoricalCase]
    robustness: List[RobustnessResult]
    falseConfidenceRate: float
    overallAccuracy: float
    datasetNote: str
