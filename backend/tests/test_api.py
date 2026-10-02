"""
Integration Tests for all 8 REST API Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

SAMPLE_DECISION = {
    "location": {
        "lat": 19.076,
        "lng": 72.8777,
        "label": "Mumbai, Maharashtra, India"
    },
    "domain": "flood",
    "action": "Issue evacuation advisory for Zone A",
    "timeHorizonHours": 48,
    "consequenceLevel": "high"
}


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_post_evidence_endpoint(client):
    res = client.post("/api/v1/evidence", json={"decision": SAMPLE_DECISION})
    assert res.status_code == 200
    data = res.json()
    assert "sources" in data
    assert len(data["sources"]) > 0
    assert "aggregateQuality" in data


def test_post_consensus_endpoint(client):
    res = client.post("/api/v1/consensus", json={"decision": SAMPLE_DECISION})
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "agreementScore" in data
    assert "disagreementBand" in data


def test_post_verdict_endpoint(client):
    res = client.post("/api/v1/verdict", json={"decision": SAMPLE_DECISION})
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert "verdict" in data
    assert data["verdict"] in ["SUFFICIENT", "INSUFFICIENT", "NEED MORE EVIDENCE"]
    assert "breakdown" in data
    assert "explanation" in data


def test_post_missing_evidence_endpoint(client):
    res = client.post("/api/v1/missing-evidence", json={"decision": SAMPLE_DECISION})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "currentScore" in data
    assert "potentialScore" in data


def test_post_what_if_endpoint(client):
    payload = {
        "decision": SAMPLE_DECISION,
        "enabledSourceIds": ["src-openmeteo-forecast", "src-osm-gis"]
    }
    res = client.post("/api/v1/what-if", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "verdict" in data
    assert "evidence" in data
    assert "consensus" in data
    assert "missingEvidence" in data


def test_get_validation_endpoint(client):
    res = client.get("/api/v1/validation")
    assert res.status_code == 200
    data = res.json()
    assert "cases" in data
    assert "robustness" in data
    assert "overallAccuracy" in data
    assert "falseConfidenceRate" in data


def test_get_history_endpoint(client):
    res = client.get("/api/v1/history")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert any(item["recordType"] == "seed-demo" for item in data)

    # Check individual record fetch
    first_id = data[0]["id"]
    single_res = client.get(f"/api/v1/history/{first_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == first_id


def test_validation_labels_seed_dataset_as_simulated(client):
    res = client.get("/api/v1/validation")
    assert res.status_code == 200
    assert "SIMULATED SEED DATA" in res.json()["datasetNote"]
