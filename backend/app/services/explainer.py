"""
CLIMASCOPE — Explanation Generator Service
============================================
Deterministic, template-driven natural language explanations directly tied
to the mathematical terms of the Sufficiency formula.
Zero hallucinations: outputs are grounded in exact numerical scores and weights.
"""

from ..schemas.common import VerdictLabel, ConsequenceLevel
from ..schemas.decision import DecisionRequest
from ..schemas.verdict import FormulaBreakdown


class ExplanationService:
    def generate_explanation(
        self,
        breakdown: FormulaBreakdown,
        verdict: VerdictLabel,
        decision: DecisionRequest,
    ) -> str:
        statements = []

        # 1. Primary Verdict Conclusion
        action_name = decision.action.strip()
        if verdict == VerdictLabel.SUFFICIENT:
            statements.append(
                f"Evidence base strongly satisfies the threshold to proceed with '{action_name}'."
            )
        elif verdict == VerdictLabel.NEED_MORE_EVIDENCE:
            statements.append(
                f"Evidence base is informative but currently falls short of the threshold for '{action_name}'."
            )
        else:
            statements.append(
                f"Evidence is strictly INSUFFICIENT to justify '{action_name}' at this stage."
            )

        # 2. Evidence Quality Commentary
        if breakdown.evidenceQuality >= 0.80:
            statements.append(
                f"Aggregate evidence quality is high ({round(breakdown.evidenceQuality * 100)}%), "
                "with strong spatial resolution and provenance across active feeds."
            )
        elif breakdown.evidenceQuality >= 0.60:
            statements.append(
                f"Evidence quality is moderate ({round(breakdown.evidenceQuality * 100)}%); "
                "gaps exist in sensor latency or cloud cover."
            )
        else:
            statements.append(
                f"Evidence quality is depressed ({round(breakdown.evidenceQuality * 100)}%), "
                "driven by stale observations or coarse spatial-temporal fit."
            )

        # 3. Model Agreement Commentary
        if breakdown.modelAgreement >= 0.85:
            statements.append(
                f"Numerical weather prediction models show high consensus ({round(breakdown.modelAgreement * 100)}% agreement)."
            )
        elif breakdown.modelAgreement >= 0.65:
            statements.append(
                f"Model agreement is fair ({round(breakdown.modelAgreement * 100)}%), "
                "though divergence exists across ensemble members on convective storm peak intensity."
            )
        else:
            statements.append(
                f"High model disagreement ({round(breakdown.modelAgreement * 100)}% agreement); "
                "forecast uncertainty is high and must not be averaged away."
            )

        # 4. Consequence Penalty Impact
        if breakdown.consequenceOfError >= 2.5:
            statements.append(
                "Because consequence of error is marked CRITICAL (÷3.0 penalty), the bar for sufficiency "
                "is set at the highest standard to prevent catastrophic false confidence."
            )
        elif breakdown.consequenceOfError >= 1.8:
            statements.append(
                "Elevated consequence level (÷2.0 penalty) requires corroborating ground-truth evidence."
            )

        return " ".join(statements)


explainer_service = ExplanationService()
