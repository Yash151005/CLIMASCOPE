"""
CLIMASCOPE — Decision Engine
==============================
Implements the core mathematical mechanism:
Sufficiency = (Evidence Quality × Model Agreement × Decision Relevance) ÷ Consequence of Error
Normalized to 0–100.
Maps score to verdict labels:
- SUFFICIENT: score >= threshold_sufficient
- NEED MORE EVIDENCE: score >= threshold_need_more and < threshold_sufficient
- INSUFFICIENT: score < threshold_need_more
"""

from typing import List, Tuple
from ..config import settings
from ..schemas.common import VerdictLabel, ConsequenceLevel
from ..schemas.decision import DecisionRequest
from ..schemas.evidence import EvidenceSource
from ..schemas.consensus import ConsensusResponse
from ..schemas.verdict import (
    VerdictResponse,
    FormulaBreakdown,
    ThresholdsConfig,
)
from .audit import audit_service
from .explainer import explainer_service


class DecisionEngine:
    def __init__(self):
        self.threshold_sufficient = settings.VERDICT_THRESHOLD_SUFFICIENT
        self.threshold_need_more = settings.VERDICT_THRESHOLD_NEED_MORE
        self.consequence_multipliers = settings.CONSEQUENCE_MULTIPLIERS
        self.domain_relevance = settings.DOMAIN_RELEVANCE

    def calculate_verdict(
        self,
        sources: List[EvidenceSource],
        consensus: ConsensusResponse,
        decision: DecisionRequest,
    ) -> VerdictResponse:
        # 1. Evidence Quality (0.0 to 1.0)
        _, evidence_quality = audit_service.audit_evidence_panel(sources)

        # 2. Model Agreement (0.0 to 1.0)
        model_agreement = consensus.agreementScore

        # 3. Decision Relevance (0.0 to 1.0)
        domain_key = (
            decision.domain.value
            if hasattr(decision.domain, "value")
            else str(decision.domain)
        )
        base_relevance = self.domain_relevance.get(domain_key, 0.85)

        # Apply time horizon decay if horizon exceeds threshold
        decay_start = settings.TIME_HORIZON_DECAY_START_HOURS
        decay_rate = settings.TIME_HORIZON_DECAY_RATE
        if decision.timeHorizonHours > decay_start:
            extra_hours = decision.timeHorizonHours - decay_start
            decay_penalty = min(0.35, extra_hours * decay_rate)
            decision_relevance = max(0.40, base_relevance - decay_penalty)
        else:
            decision_relevance = base_relevance

        # 4. Consequence of Error Multiplier
        consequence_key = (
            decision.consequenceLevel.value
            if hasattr(decision.consequenceLevel, "value")
            else str(decision.consequenceLevel)
        )
        consequence_of_error = self.consequence_multipliers.get(consequence_key, 1.5)

        # 5. Core Formula: (EQ × MA × DR) ÷ CoE
        raw_score = (
            evidence_quality * model_agreement * decision_relevance
        ) / consequence_of_error

        # Normalize to 0–100 scale (normalizer calibrates 1.0 theoretical max to 100)
        normalized_score = min(100.0, max(0.0, round(raw_score * 100.0, 1)))

        # 6. Map to Verdict Label
        if normalized_score >= self.threshold_sufficient:
            verdict = VerdictLabel.SUFFICIENT
        elif normalized_score >= self.threshold_need_more:
            verdict = VerdictLabel.NEED_MORE_EVIDENCE
        else:
            verdict = VerdictLabel.INSUFFICIENT

        breakdown = FormulaBreakdown(
            evidenceQuality=round(evidence_quality, 2),
            modelAgreement=round(model_agreement, 2),
            decisionRelevance=round(decision_relevance, 2),
            consequenceOfError=consequence_of_error,
            rawScore=round(raw_score, 3),
            normalizedScore=normalized_score,
        )

        explanation = explainer_service.generate_explanation(
            breakdown=breakdown,
            verdict=verdict,
            decision=decision,
        )

        return VerdictResponse(
            score=normalized_score,
            verdict=verdict,
            explanation=explanation,
            breakdown=breakdown,
            thresholds=ThresholdsConfig(
                sufficient=self.threshold_sufficient,
                needMore=self.threshold_need_more,
            ),
        )


decision_engine = DecisionEngine()
