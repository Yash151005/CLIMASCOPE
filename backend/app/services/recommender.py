"""
CLIMASCOPE — Missing Evidence Recommender Service
==================================================
Identifies evidence gaps and estimates each candidate's marginal score impact
using configured assumed quality profiles, then ranks by estimated gain.
"""

from typing import List
from ..schemas.common import EvidenceSourceType
from ..schemas.verdict import MissingEvidenceItem, MissingEvidenceResponse
from ..schemas.decision import DecisionRequest
from ..schemas.evidence import EvidenceSource
from ..schemas.consensus import ConsensusResponse
from ..config import settings
from .audit import audit_service


CANDIDATE_SOURCES = [
    {
        "id": "missing-river-gauge",
        "sourceType": EvidenceSourceType.GIS,
        "name": "Upstream River Gauging Telemetry",
        "description": "Continuous stage and discharge sensors from upstream catchment monitoring stations.",
        "feasibility": "moderate",
        "acquisitionHint": "Check Central Water Commission and state irrigation portals for coverage and access terms.",
    },
    {
        "id": "missing-urban-drainage",
        "sourceType": EvidenceSourceType.GIS,
        "name": "Subterranean Urban Drainage Capacity Model",
        "description": "Culvert diameter, slope, and backwater saturation modeling for the targeted municipality.",
        "feasibility": "hard",
        "acquisitionHint": "Request municipal engineering GIS data; coverage and access vary by authority.",
    },
    {
        "id": "missing-radar",
        "sourceType": EvidenceSourceType.WEATHER_API,
        "name": "Live Dual-Pol Doppler Weather Radar Feed",
        "description": "10-minute volume scans tracking convective precipitation cell velocity and reflectivity.",
        "feasibility": "easy",
        "acquisitionHint": "Check the national meteorological service for an accessible radar product.",
    },
    {
        "id": "missing-soil-moisture",
        "sourceType": EvidenceSourceType.SATELLITE,
        "name": "SMAP L3 Satellite Surface Soil Moisture",
        "description": "Microwave radiometry capturing antecedent moisture and runoff coefficient saturation.",
        "feasibility": "moderate",
        "acquisitionHint": "NASA Earthdata provides public product information; access and latency depend on the product.",
    },
    {
        "id": "missing-crowdsource",
        "sourceType": EvidenceSourceType.REPORTS,
        "name": "Verified Crowdsourced Citizen Flood Observations",
        "description": "Geo-tagged community reports of local street waterlogging and underpass submergence.",
        "feasibility": "easy",
        "acquisitionHint": "Check whether the municipality or a trusted open mapping service exposes verified reports.",
    },
]


class RecommenderService:
    def recommend_missing_evidence(
        self,
        current_score: float,
        decision: DecisionRequest,
        active_sources: List[EvidenceSource],
        consensus: ConsensusResponse,
    ) -> MissingEvidenceResponse:
        domain_key = (
            decision.domain.value
            if hasattr(decision.domain, "value")
            else str(decision.domain)
        )
        consequence_key = (
            decision.consequenceLevel.value
            if hasattr(decision.consequenceLevel, "value")
            else str(decision.consequenceLevel)
        )
        relevance = settings.DOMAIN_RELEVANCE.get(domain_key, 0.85)
        if decision.timeHorizonHours > settings.TIME_HORIZON_DECAY_START_HOURS:
            hours_over = decision.timeHorizonHours - settings.TIME_HORIZON_DECAY_START_HOURS
            relevance = max(
                0.40,
                relevance - min(0.35, hours_over * settings.TIME_HORIZON_DECAY_RATE),
            )
        consequence = settings.CONSEQUENCE_MULTIPLIERS.get(consequence_key, 1.5)
        model_agreement = consensus.agreementScore

        enabled_qualities = [
            audit_service.audit_source_quality(source)
            for source in active_sources
            if source.enabled
        ]
        quality_sum = sum(enabled_qualities)
        source_count = len(enabled_qualities)

        ranked_items: List[MissingEvidenceItem] = []
        potential_quality_sum = quality_sum
        potential_source_count = source_count

        for cand in CANDIDATE_SOURCES:
            prior_quality = (
                potential_quality_sum / potential_source_count
                if potential_source_count
                else 0.0
            )
            candidate_quality = settings.CANDIDATE_EVIDENCE_QUALITY[cand["id"]]
            updated_quality_sum = potential_quality_sum + candidate_quality
            updated_source_count = potential_source_count + 1
            updated_quality = updated_quality_sum / updated_source_count
            marginal_gain = (
                (updated_quality - prior_quality)
                * model_agreement
                * relevance
                * 100
                / consequence
            )
            scaled_gain = round(max(0.0, marginal_gain), 1)

            ranked_items.append(
                MissingEvidenceItem(
                    id=cand["id"],
                    sourceType=cand["sourceType"],
                    name=cand["name"],
                    description=cand["description"],
                    estimatedScoreGain=scaled_gain,
                    feasibility=cand["feasibility"],
                    acquisitionHint=cand["acquisitionHint"],
                )
            )
            potential_quality_sum = updated_quality_sum
            potential_source_count = updated_source_count

        # Sort descending by marginal gain
        ranked_items.sort(key=lambda x: x.estimatedScoreGain, reverse=True)

        if potential_source_count:
            potential_quality = potential_quality_sum / potential_source_count
            potential_score = min(
                100.0,
                round(
                    potential_quality
                    * model_agreement
                    * relevance
                    * 100
                    / consequence,
                    1,
                ),
            )
        else:
            potential_score = current_score

        return MissingEvidenceResponse(
            items=ranked_items,
            currentScore=current_score,
            potentialScore=potential_score,
            estimateNote=(
                "Illustrative marginal estimates use assumed candidate quality profiles, "
                "the current evidence quality, model agreement, decision relevance, and "
                "consequence multiplier. These are not measured or guaranteed gains."
            ),
        )


recommender_service = RecommenderService()
