"""
CLIMASCOPE — Evidence Audit Service
=====================================
Scores each evidence source across the five core dimensions:
- Freshness: age of observation vs decision urgency
- Provenance: dataset origin credibility and processing chain transparency
- Data Completeness: absence of missing parameters, cloud gaps, or missing members
- Spatial Fit: alignment between dataset resolution and AOI perimeter
- Temporal Fit: alignment between data cadence and decision time horizon

Computes weighted quality for individual sources and the aggregate evidence panel.
All weights are read dynamically from settings.AUDIT_WEIGHTS.
"""

from typing import List, Tuple
from ..config import settings
from ..schemas.evidence import EvidenceSource, EvidencePanelResponse


class AuditService:
    def __init__(self):
        self.weights = settings.AUDIT_WEIGHTS

    def audit_source_quality(self, source: EvidenceSource) -> float:
        """
        Calculates the explainable weighted quality score (0.0 to 1.0)
        for a single evidence source using configurable audit dimension weights.
        """
        if not source.auditScores:
            return 0.0

        weighted_sum = 0.0
        total_weight = 0.0

        for audit in source.auditScores:
            dim_key = (
                audit.dimension.value
                if hasattr(audit.dimension, "value")
                else str(audit.dimension)
            )
            weight = self.weights.get(dim_key, audit.weight)
            weighted_sum += audit.score * weight
            total_weight += weight

        if total_weight <= 0:
            return 0.0

        return round(weighted_sum / total_weight, 4)

    def audit_evidence_panel(
        self, sources: List[EvidenceSource]
    ) -> Tuple[List[EvidenceSource], float]:
        """
        Re-computes individual qualities and overall aggregate quality
        for all active (enabled) evidence sources.
        """
        updated_sources: List[EvidenceSource] = []
        enabled_qualities: List[float] = []

        for src in sources:
            quality = self.audit_source_quality(src)
            weighted_scores = [
                score.model_copy(
                    update={
                        "weight": self.weights.get(
                            score.dimension.value
                            if hasattr(score.dimension, "value")
                            else str(score.dimension),
                            score.weight,
                        )
                    }
                )
                for score in src.auditScores
            ]
            src_copy = src.model_copy(
                update={"overallQuality": quality, "auditScores": weighted_scores}
            )
            updated_sources.append(src_copy)

            if src_copy.enabled:
                enabled_qualities.append(quality)

        if not enabled_qualities:
            aggregate_quality = 0.0
        else:
            aggregate_quality = sum(enabled_qualities) / len(enabled_qualities)

        return updated_sources, round(aggregate_quality, 4)


audit_service = AuditService()
