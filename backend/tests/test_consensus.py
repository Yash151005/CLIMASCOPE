"""
Unit tests for Consensus & Uncertainty Module
"""

import pytest
from backend.app.schemas.decision import DecisionRequest
from backend.app.schemas.common import GeoLocation, DecisionDomain, ConsequenceLevel
from backend.app.services.consensus import consensus_service


def test_consensus_computes_agreement_and_disagreement_band():
    req = DecisionRequest(
        location=GeoLocation(lat=19.076, lng=72.8777, label="Mumbai"),
        domain=DecisionDomain.FLOOD,
        action="Test action",
        timeHorizonHours=48,
        consequenceLevel=ConsequenceLevel.HIGH,
    )

    res = consensus_service.get_consensus(req)

    assert len(res.models) >= 4
    assert 0.0 <= res.agreementScore <= 1.0
    assert res.disagreementBand.min < res.disagreementBand.max
    assert res.calibrationIndicator == 0.0
    assert res.calibrationStatus == "illustrative"
    assert "uncertainty" in res.explanation.lower() or "models" in res.explanation.lower()
