"""
Unit tests for Decision Engine & Sufficiency Formula
"""

import pytest
from backend.app.schemas.decision import DecisionRequest
from backend.app.schemas.evidence import EvidenceSource, AuditScore
from backend.app.schemas.consensus import ConsensusResponse, DisagreementBand, ModelOutput
from backend.app.schemas.common import (
    GeoLocation,
    DecisionDomain,
    ConsequenceLevel,
    EvidenceSourceType,
    AuditDimension,
    VerdictLabel,
)
from backend.app.services.engine import decision_engine


def make_dummy_source(quality: float = 0.9) -> EvidenceSource:
    return EvidenceSource(
        id="dummy",
        type=EvidenceSourceType.WEATHER_API,
        name="Dummy",
        provider="Provider",
        description="",
        retrievedAt="",
        dataTimestamp="",
        license="",
        resolution="",
        auditScores=[
            AuditScore(dimension=AuditDimension.FRESHNESS, score=quality, explanation=""),
            AuditScore(dimension=AuditDimension.PROVENANCE, score=quality, explanation=""),
            AuditScore(dimension=AuditDimension.COMPLETENESS, score=quality, explanation=""),
            AuditScore(dimension=AuditDimension.SPATIAL_FIT, score=quality, explanation=""),
            AuditScore(dimension=AuditDimension.TEMPORAL_FIT, score=quality, explanation=""),
        ],
        overallQuality=quality,
        enabled=True,
        rawSummary="",
    )


def make_dummy_consensus(agreement: float = 0.9) -> ConsensusResponse:
    return ConsensusResponse(
        models=[
            ModelOutput(
                modelId="m1",
                modelName="M1",
                provider="P",
                value=100.0,
                unit="mm",
                confidenceLow=80.0,
                confidenceHigh=120.0,
                timestamp="",
            )
        ],
        agreementScore=agreement,
        disagreementBand=DisagreementBand(min=80.0, max=120.0, unit="mm"),
        calibrationIndicator=0.8,
        explanation="",
    )


def test_sufficiency_scales_inversely_with_consequence():
    sources = [make_dummy_source(0.9)]
    consensus = make_dummy_consensus(0.9)

    low_req = DecisionRequest(
        location=GeoLocation(lat=19.0, lng=72.0, label="Loc"),
        domain=DecisionDomain.FLOOD,
        action="Action",
        timeHorizonHours=24,
        consequenceLevel=ConsequenceLevel.LOW,  # Multiplier 1.0
    )

    critical_req = DecisionRequest(
        location=GeoLocation(lat=19.0, lng=72.0, label="Loc"),
        domain=DecisionDomain.FLOOD,
        action="Action",
        timeHorizonHours=24,
        consequenceLevel=ConsequenceLevel.CRITICAL,  # Multiplier 3.0
    )

    low_verdict = decision_engine.calculate_verdict(sources, consensus, low_req)
    critical_verdict = decision_engine.calculate_verdict(sources, consensus, critical_req)

    # Score under critical consequence must be significantly lower than under low consequence
    assert low_verdict.score > critical_verdict.score
    # Specifically, ratio should approximate 3.0:1.0
    ratio = low_verdict.score / critical_verdict.score
    assert 2.5 <= ratio <= 3.5


def test_verdict_threshold_mapping():
    sources_high = [make_dummy_source(0.95)]
    consensus_high = make_dummy_consensus(0.95)
    req_low = DecisionRequest(
        location=GeoLocation(lat=19.0, lng=72.0, label="Loc"),
        domain=DecisionDomain.FLOOD,
        action="Action",
        timeHorizonHours=24,
        consequenceLevel=ConsequenceLevel.LOW,
    )

    verdict_sufficient = decision_engine.calculate_verdict(sources_high, consensus_high, req_low)
    assert verdict_sufficient.verdict == VerdictLabel.SUFFICIENT
    assert verdict_sufficient.score >= 70.0

    # Degraded evidence
    sources_low = [make_dummy_source(0.3)]
    consensus_low = make_dummy_consensus(0.3)
    verdict_insufficient = decision_engine.calculate_verdict(sources_low, consensus_low, req_low)
    assert verdict_insufficient.verdict == VerdictLabel.INSUFFICIENT
    assert verdict_insufficient.score < 40.0
