"""
Unit tests for Evidence Audit Module
"""

import pytest
from backend.app.schemas.evidence import EvidenceSource, AuditScore
from backend.app.schemas.common import EvidenceSourceType, AuditDimension
from backend.app.services.audit import audit_service


def test_source_quality_weighted_sum():
    source = EvidenceSource(
        id="test-src",
        type=EvidenceSourceType.WEATHER_API,
        name="Test Sensor",
        provider="Test Provider",
        description="A test source",
        retrievedAt="2026-10-01T00:00:00Z",
        dataTimestamp="2026-10-01T00:00:00Z",
        license="MIT",
        resolution="1km",
        auditScores=[
            AuditScore(dimension=AuditDimension.FRESHNESS, score=1.0, explanation="Fresh"),
            AuditScore(dimension=AuditDimension.PROVENANCE, score=1.0, explanation="Verified"),
            AuditScore(dimension=AuditDimension.COMPLETENESS, score=1.0, explanation="Complete"),
            AuditScore(dimension=AuditDimension.SPATIAL_FIT, score=1.0, explanation="High fit"),
            AuditScore(dimension=AuditDimension.TEMPORAL_FIT, score=1.0, explanation="High fit"),
        ],
        overallQuality=0.0,
        enabled=True,
        rawSummary="Summary",
    )

    quality = audit_service.audit_source_quality(source)
    assert quality == 1.0


def test_source_quality_zero_when_no_scores():
    source = EvidenceSource(
        id="empty-src",
        type=EvidenceSourceType.GIS,
        name="Empty",
        provider="Provider",
        description="",
        retrievedAt="",
        dataTimestamp="",
        license="",
        resolution="",
        auditScores=[],
        overallQuality=0.0,
        enabled=True,
        rawSummary="",
    )
    assert audit_service.audit_source_quality(source) == 0.0


def test_aggregate_quality_ignores_disabled_sources():
    s1 = EvidenceSource(
        id="s1",
        type=EvidenceSourceType.WEATHER_API,
        name="Source 1",
        provider="P",
        description="",
        retrievedAt="",
        dataTimestamp="",
        license="",
        resolution="",
        auditScores=[AuditScore(dimension=AuditDimension.FRESHNESS, score=1.0, explanation="")],
        overallQuality=1.0,
        enabled=True,
        rawSummary="",
    )
    s2 = EvidenceSource(
        id="s2",
        type=EvidenceSourceType.WEATHER_API,
        name="Source 2",
        provider="P",
        description="",
        retrievedAt="",
        dataTimestamp="",
        license="",
        resolution="",
        auditScores=[AuditScore(dimension=AuditDimension.FRESHNESS, score=0.0, explanation="")],
        overallQuality=0.0,
        enabled=False,  # Disabled
        rawSummary="",
    )

    updated, aggregate = audit_service.audit_evidence_panel([s1, s2])
    # Enabled source has quality 1.0, disabled source has quality 0.0, aggregate should be 1.0
    assert aggregate == 1.0
