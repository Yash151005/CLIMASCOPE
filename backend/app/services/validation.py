"""
CLIMASCOPE — Validation & Ablation Pipeline Service
=====================================================
Replays historical climate events against ground-truth outcomes.
Runs source ablation stress tests (removing sources one by one) to measure
systemic brittleness and calculate the false-confidence rate.
"""

from typing import List, Dict, Any
from ..schemas.validation import HistoricalCase, RobustnessResult, ValidationResponse
from ..schemas.common import DecisionDomain, VerdictLabel, GeoLocation
from ..db.session import SessionLocal
from ..db.models import HistoricalCaseModel


DEFAULT_ROBUSTNESS_TESTS = [
    {
        "caseId": "case-mumbai-2005",
        "removedSource": "Open-Meteo High-Res Forecast",
        "originalScore": 28.0,
        "reducedScore": 17.5,
        "verdictChanged": False,
    },
    {
        "caseId": "case-mumbai-2005",
        "removedSource": "Sentinel-2 Optical & SAR",
        "originalScore": 28.0,
        "reducedScore": 22.0,
        "verdictChanged": False,
    },
    {
        "caseId": "case-mumbai-2005",
        "removedSource": "ECMWF IFS Ensemble",
        "originalScore": 28.0,
        "reducedScore": 14.0,
        "verdictChanged": False,
    },
    {
        "caseId": "case-chennai-2015",
        "removedSource": "Open-Meteo High-Res Forecast",
        "originalScore": 42.0,
        "reducedScore": 29.5,
        "verdictChanged": True,  # Flipped from NEED MORE EVIDENCE to INSUFFICIENT
    },
    {
        "caseId": "case-chennai-2015",
        "removedSource": "Historical Disaster Catalog",
        "originalScore": 42.0,
        "reducedScore": 34.0,
        "verdictChanged": True,
    },
    {
        "caseId": "case-delhi-heat-2024",
        "removedSource": "Open-Meteo High-Res Forecast",
        "originalScore": 82.0,
        "reducedScore": 61.5,
        "verdictChanged": True,  # Flipped from SUFFICIENT to NEED MORE EVIDENCE
    },
    {
        "caseId": "case-delhi-heat-2024",
        "removedSource": "NASA POWER Climatology",
        "originalScore": 82.0,
        "reducedScore": 73.0,
        "verdictChanged": False,
    },
    {
        "caseId": "case-pune-flash-2024",
        "removedSource": "Open-Meteo High-Res Forecast",
        "originalScore": 55.0,
        "reducedScore": 37.0,
        "verdictChanged": True,  # Flipped from NEED MORE EVIDENCE to INSUFFICIENT
    },
    {
        "caseId": "case-pune-flash-2024",
        "removedSource": "OpenStreetMap Infrastructure",
        "originalScore": 55.0,
        "reducedScore": 47.5,
        "verdictChanged": False,
    },
]


class ValidationPipelineService:
    def get_validation_report(self) -> ValidationResponse:
        db = SessionLocal()
        cases: List[HistoricalCase] = []

        try:
            records = db.query(HistoricalCaseModel).all()
            for r in records:
                cases.append(
                    HistoricalCase(
                        id=r.id,
                        title=r.title,
                        domain=DecisionDomain(r.domain),
                        location=GeoLocation(
                            lat=r.latitude,
                            lng=r.longitude,
                            label=r.location_label,
                        ),
                        date=r.event_date,
                        actualOutcome=r.actual_outcome,
                        predictedVerdict=VerdictLabel(r.predicted_verdict),
                        actualVerdictCorrect=r.actual_verdict_correct,
                        sufficiencyScore=r.sufficiency_score,
                    )
                )
        finally:
            db.close()

        robustness_results = [RobustnessResult(**t) for t in DEFAULT_ROBUSTNESS_TESTS]

        # Calculate metrics
        correct_count = sum(1 for c in cases if c.actualVerdictCorrect)
        total_cases = len(cases) if cases else 1
        overall_accuracy = round(correct_count / total_cases, 4)

        # False confidence: predicted SUFFICIENT but actual outcome was disastrous/incorrect
        sufficient_predictions = [c for c in cases if c.predictedVerdict == VerdictLabel.SUFFICIENT]
        false_positives = [c for c in sufficient_predictions if not c.actualVerdictCorrect]
        false_confidence_rate = (
            round(len(false_positives) / len(sufficient_predictions), 4)
            if sufficient_predictions
            else 0.0
        )

        return ValidationResponse(
            cases=cases,
            robustness=robustness_results,
            falseConfidenceRate=false_confidence_rate,
            overallAccuracy=overall_accuracy,
            datasetNote=(
                "SIMULATED SEED DATA: historical verdict labels are illustrative demo values, "
                "not a scientifically validated replay. Ablation scores are fixed demo examples, "
                "not computed from archived observations."
            ),
        )


validation_service = ValidationPipelineService()
