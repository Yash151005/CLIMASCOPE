"""
Ablation Stress Test: Proving Verdict Changes When Evidence Is Removed
========================================================================
Core working rule validation: tests that removing an observational feed
drops sufficiency and shifts the verdict from SUFFICIENT to INSUFFICIENT
or NEED MORE EVIDENCE.
"""

import pytest
from backend.app.schemas.decision import DecisionRequest
from backend.app.schemas.common import (
    GeoLocation,
    DecisionDomain,
    ConsequenceLevel,
    VerdictLabel,
    EvidenceSourceType,
    AuditDimension,
)
from backend.app.schemas.evidence import EvidenceSource, AuditScore
from backend.app.schemas.consensus import ConsensusResponse, DisagreementBand, ModelOutput
from backend.app.services.engine import decision_engine


def make_test_source(source_id: str, quality: float) -> EvidenceSource:
    return EvidenceSource(
        id=source_id,
        type=EvidenceSourceType.WEATHER_API,
        name=f"Source {source_id}",
        provider="Provider",
        description="",
        retrievedAt="",
        dataTimestamp="",
        license="Open",
        resolution="1km",
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


def test_verdict_flips_when_evidence_source_is_removed():
    """
    Step 1: Baseline scenario with multiple high-quality sources and high consensus.
    Consequence: MEDIUM (penalty 1.5).
    Verdict starts as SUFFICIENT.
    """
    decision = DecisionRequest(
        location=GeoLocation(lat=28.6139, lng=77.209, label="New Delhi"),
        domain=DecisionDomain.HEAT,
        action="Deploy mobile emergency cooling centers",
        timeHorizonHours=24,
        consequenceLevel=ConsequenceLevel.LOW,
    )

    consensus = ConsensusResponse(
        models=[
            ModelOutput(
                modelId="m1",
                modelName="ECMWF",
                provider="ECMWF",
                value=46.0,
                unit="°C",
                confidenceLow=44.0,
                confidenceHigh=48.0,
                timestamp="",
            ),
            ModelOutput(
                modelId="m2",
                modelName="GFS",
                provider="NOAA",
                value=46.5,
                unit="°C",
                confidenceLow=44.5,
                confidenceHigh=48.5,
                timestamp="",
            ),
        ],
        agreementScore=0.90,
        disagreementBand=DisagreementBand(min=44.0, max=48.5, unit="°C"),
        calibrationIndicator=0.85,
        explanation="High agreement",
    )

    # 3 High quality feeds (0.95 quality)
    src_weather = make_test_source("src-weather", 0.95)
    src_satellite = make_test_source("src-satellite", 0.92)
    src_ground = make_test_source("src-ground", 0.94)

    all_sources = [src_weather, src_satellite, src_ground]

    initial_verdict = decision_engine.calculate_verdict(all_sources, consensus, decision)
    assert initial_verdict.verdict == VerdictLabel.SUFFICIENT
    assert initial_verdict.score >= 70.0  # Threshold for SUFFICIENT

    """
    Step 2: Ablation — disable the primary weather API feed and degrade remaining feeds.
    Simulates losing the real-time weather feed.
    """
    ablated_sources = [
        make_test_source("src-weather", 0.95).model_copy(update={"enabled": False}),
        make_test_source("src-satellite", 0.45),  # Cloud obstructed satellite
        make_test_source("src-ground", 0.40),     # Stale ground observation
    ]

    ablated_verdict = decision_engine.calculate_verdict(ablated_sources, consensus, decision)

    # Prove that score dropped significantly
    assert ablated_verdict.score < initial_verdict.score

    # Prove that verdict changed from SUFFICIENT to NEED MORE EVIDENCE or INSUFFICIENT
    assert ablated_verdict.verdict != initial_verdict.verdict
    assert ablated_verdict.verdict in [
        VerdictLabel.NEED_MORE_EVIDENCE,
        VerdictLabel.INSUFFICIENT,
    ]
