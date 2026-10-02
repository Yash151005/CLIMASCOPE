"""
CLIMASCOPE — Database Initialization & Seeding
"""

from datetime import datetime
from sqlalchemy import inspect, text
from .session import engine, Base, SessionLocal
from .models import HistoricalCaseModel, DecisionAuditModel


SEED_CASES = [
    {
        "id": "case-mumbai-2005",
        "title": "Mumbai Floods 2005",
        "domain": "flood",
        "location_label": "Mumbai, Maharashtra, India",
        "latitude": 19.076,
        "longitude": 72.8777,
        "event_date": "2005-07-26T00:00:00Z",
        "actual_outcome": "Catastrophic flooding — 944mm in 24h, 1,000+ deaths.",
        "predicted_verdict": "INSUFFICIENT",
        "actual_verdict_correct": True,
        "sufficiency_score": 28.0,
    },
    {
        "id": "case-chennai-2015",
        "title": "Chennai Floods 2015",
        "domain": "flood",
        "location_label": "Chennai, Tamil Nadu, India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "event_date": "2015-12-01T00:00:00Z",
        "actual_outcome": "Severe urban flooding — 490mm in 24h, major infrastructure damage.",
        "predicted_verdict": "NEED MORE EVIDENCE",
        "actual_verdict_correct": True,
        "sufficiency_score": 42.0,
    },
    {
        "id": "case-kerala-2018",
        "title": "Kerala Floods 2018",
        "domain": "flood",
        "location_label": "Kerala, India",
        "latitude": 10.8505,
        "longitude": 76.2711,
        "event_date": "2018-08-15T00:00:00Z",
        "actual_outcome": "Worst flooding in century — reservoir overflows, 483 deaths.",
        "predicted_verdict": "INSUFFICIENT",
        "actual_verdict_correct": True,
        "sufficiency_score": 31.0,
    },
    {
        "id": "case-delhi-heat-2024",
        "title": "Delhi Heat Wave 2024",
        "domain": "heat",
        "location_label": "New Delhi, Delhi, India",
        "latitude": 28.6139,
        "longitude": 77.209,
        "event_date": "2024-05-28T00:00:00Z",
        "actual_outcome": "Record 52.3°C. Multiple heat-related fatalities reported.",
        "predicted_verdict": "SUFFICIENT",
        "actual_verdict_correct": True,
        "sufficiency_score": 82.0,
    },
    {
        "id": "case-pune-flash-2024",
        "title": "Pune Flash Floods 2024",
        "domain": "flood",
        "location_label": "Pune, Maharashtra, India",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "event_date": "2024-07-25T00:00:00Z",
        "actual_outcome": "Sudden flash flooding in low-lying areas. Moderate damage.",
        "predicted_verdict": "NEED MORE EVIDENCE",
        "actual_verdict_correct": False,
        "sufficiency_score": 55.0,
    },
    {
        "id": "case-rajasthan-drought-2023",
        "title": "Rajasthan Drought 2023",
        "domain": "drought",
        "location_label": "Rajasthan, India",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "event_date": "2023-06-01T00:00:00Z",
        "actual_outcome": "Prolonged dry spell. Crop failures across Barmer and Jaisalmer.",
        "predicted_verdict": "SUFFICIENT",
        "actual_verdict_correct": True,
        "sufficiency_score": 76.0,
    },
]


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        columns = {
            column["name"]
            for column in inspect(engine).get_columns("decision_audits")
        }
        if "record_kind" not in columns:
            db.execute(
                text(
                    "ALTER TABLE decision_audits "
                    "ADD COLUMN record_kind VARCHAR(32) NOT NULL DEFAULT 'user-audit'"
                )
            )
            db.commit()

        existing_case_ids = {
            row[0] for row in db.query(HistoricalCaseModel.id).all()
        }
        for case_data in SEED_CASES:
            if case_data["id"] not in existing_case_ids:
                case = HistoricalCaseModel(**case_data)
                db.add(case)

        if not db.query(DecisionAuditModel).filter(
            DecisionAuditModel.record_kind == "seed-demo"
        ).first():
            db.add_all(_seed_demo_history())
        db.commit()

        if engine.dialect.name == "postgresql":
            db.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            columns = {
                column["name"]
                for column in inspect(engine).get_columns("decision_audits")
            }
            if "location_geom" not in columns:
                db.execute(
                    text(
                        "ALTER TABLE decision_audits "
                        "ADD COLUMN location_geom geometry(Point, 4326)"
                    )
                )
            db.execute(
                text(
                    "UPDATE decision_audits SET location_geom = "
                    "ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) "
                    "WHERE location_geom IS NULL"
                )
            )
            db.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_decision_audits_location_geom "
                    "ON decision_audits USING GIST (location_geom)"
                )
            )
            db.commit()
    finally:
        db.close()


def _seed_demo_history() -> list[DecisionAuditModel]:
    """Seed clearly identified examples to make comparison usable on first run."""
    scenarios = [
        {
            "id": "dec-demo-mumbai",
            "domain": "flood",
            "action": "SIMULATED DEMO: Issue evacuation advisory for Zone A",
            "location_label": "Mumbai, Maharashtra, India",
            "latitude": 19.076,
            "longitude": 72.8777,
            "time_horizon_hours": 48,
            "consequence_level": "critical",
            "score": 58.0,
            "verdict": "NEED MORE EVIDENCE",
            "quality": 0.76,
            "agreement": 0.71,
            "relevance": 0.95,
            "penalty": 3.0,
            "created_at": "2026-10-01T08:30:00+00:00",
        },
        {
            "id": "dec-demo-delhi",
            "domain": "heat",
            "action": "SIMULATED DEMO: Activate municipal Heat Action Plan",
            "location_label": "New Delhi, Delhi, India",
            "latitude": 28.6139,
            "longitude": 77.209,
            "time_horizon_hours": 72,
            "consequence_level": "high",
            "score": 74.0,
            "verdict": "SUFFICIENT",
            "quality": 0.82,
            "agreement": 0.88,
            "relevance": 0.90,
            "penalty": 2.0,
            "created_at": "2026-09-30T14:15:00+00:00",
        },
        {
            "id": "dec-demo-pune",
            "domain": "flood",
            "action": "SIMULATED DEMO: Pre-emptively close bridge underpasses",
            "location_label": "Pune, Maharashtra, India",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "time_horizon_hours": 24,
            "consequence_level": "medium",
            "score": 35.0,
            "verdict": "INSUFFICIENT",
            "quality": 0.52,
            "agreement": 0.55,
            "relevance": 0.85,
            "penalty": 1.5,
            "created_at": "2026-09-28T10:00:00+00:00",
        },
    ]
    records = []
    for scenario in scenarios:
        raw_score = (
            scenario["quality"] * scenario["agreement"] * scenario["relevance"]
            / scenario["penalty"]
        )
        records.append(
            DecisionAuditModel(
                id=scenario["id"],
                domain=scenario["domain"],
                action=scenario["action"],
                location_label=scenario["location_label"],
                latitude=scenario["latitude"],
                longitude=scenario["longitude"],
                time_horizon_hours=scenario["time_horizon_hours"],
                consequence_level=scenario["consequence_level"],
                sufficiency_score=scenario["score"],
                verdict=scenario["verdict"],
                explanation=(
                    "[SIMULATED SEED EXAMPLE] Illustrative audit record for UI comparison; "
                    "not a live observation, tested result, or operational recommendation."
                ),
                formula_breakdown={
                    "evidenceQuality": scenario["quality"],
                    "modelAgreement": scenario["agreement"],
                    "decisionRelevance": scenario["relevance"],
                    "consequenceOfError": scenario["penalty"],
                    "rawScore": round(raw_score, 3),
                    "normalizedScore": scenario["score"],
                },
                evidence_snapshot=[],
                consensus_snapshot={
                    "models": [],
                    "agreementScore": scenario["agreement"],
                    "disagreementBand": {"min": 0, "max": 0, "unit": "illustrative"},
                    "calibrationIndicator": 0,
                    "explanation": "[SIMULATED SEED EXAMPLE] No forecast observations stored.",
                },
                missing_evidence_snapshot={
                    "items": [],
                    "currentScore": scenario["score"],
                    "potentialScore": scenario["score"],
                },
                record_kind="seed-demo",
                created_at=datetime.fromisoformat(scenario["created_at"]),
            )
        )
    return records


if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded.")
