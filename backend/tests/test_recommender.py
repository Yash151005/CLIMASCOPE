"""
Unit tests for Missing Evidence Recommender
"""

import pytest
from backend.app.schemas.decision import DecisionRequest
from backend.app.schemas.common import GeoLocation, DecisionDomain, ConsequenceLevel
from backend.app.schemas.consensus import ConsensusResponse, DisagreementBand
from backend.app.services.recommender import recommender_service


def test_recommender_returns_ranked_candidates():
    req = DecisionRequest(
        location=GeoLocation(lat=19.0, lng=72.0, label="Mumbai"),
        domain=DecisionDomain.FLOOD,
        action="Evacuation",
        timeHorizonHours=48,
        consequenceLevel=ConsequenceLevel.HIGH,
    )

    res = recommender_service.recommend_missing_evidence(
        current_score=0.0,
        decision=req,
        active_sources=[],
        consensus=ConsensusResponse(
            models=[],
            agreementScore=0.8,
            disagreementBand=DisagreementBand(min=0, max=1, unit="mm"),
            calibrationIndicator=0.0,
            explanation="test",
        ),
    )

    assert len(res.items) > 0
    assert res.potentialScore > res.currentScore
    # Verify items are sorted descending by estimatedScoreGain
    gains = [item.estimatedScoreGain for item in res.items]
    assert gains == sorted(gains, reverse=True)
