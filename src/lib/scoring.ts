/**
 * CLIMASCOPE — Client-Side Scoring Engine
 * =========================================
 * Implements the sufficiency formula for real-time What-If updates.
 * Sufficiency = (Evidence Quality × Model Agreement × Decision Relevance) ÷ Consequence of Error
 * Normalized to 0–100.
 */

import type {
  EvidenceSource,
  VerdictLabel,
  VerdictResponse,
  FormulaBreakdown,
  DecisionRequest,
  ConsensusResponse,
} from '../api/types';
import {
  AUDIT_WEIGHTS,
  CONSEQUENCE_MULTIPLIERS,
  VERDICT_THRESHOLDS,
  DOMAIN_RELEVANCE,
} from '../config/engine';

/** Compute weighted quality score for a single evidence source */
export function computeSourceQuality(source: EvidenceSource): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const audit of source.auditScores) {
    const w = AUDIT_WEIGHTS[audit.dimension] ?? 0.2;
    weightedSum += audit.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/** Compute aggregate evidence quality from enabled sources */
export function computeAggregateQuality(sources: EvidenceSource[]): number {
  const enabled = sources.filter((s) => s.enabled);
  if (enabled.length === 0) return 0;
  const sum = enabled.reduce((acc, s) => acc + computeSourceQuality(s), 0);
  return sum / enabled.length;
}

/** Map verdict label from normalized score */
export function getVerdictLabel(score: number): VerdictLabel {
  if (score >= VERDICT_THRESHOLDS.sufficient) return 'SUFFICIENT';
  if (score >= VERDICT_THRESHOLDS.needMore) return 'NEED MORE EVIDENCE';
  return 'INSUFFICIENT';
}

/** Generate plain-language explanation from formula terms */
export function generateExplanation(
  breakdown: FormulaBreakdown,
  verdict: VerdictLabel,
  domain: string,
  action: string
): string {
  const parts: string[] = [];

  if (verdict === 'SUFFICIENT') {
    parts.push(
      `Evidence is strong enough to proceed with "${action}".`
    );
  } else if (verdict === 'NEED MORE EVIDENCE') {
    parts.push(
      `Evidence is approaching but not yet sufficient for "${action}".`
    );
  } else {
    parts.push(
      `Evidence is NOT sufficient to support "${action}" at this time.`
    );
  }

  // Evidence quality commentary
  if (breakdown.evidenceQuality >= 0.8) {
    parts.push('Evidence quality is high across sources.');
  } else if (breakdown.evidenceQuality >= 0.6) {
    parts.push('Evidence quality is moderate — some sources have gaps.');
  } else {
    parts.push('Evidence quality is low — significant data gaps exist.');
  }

  // Model agreement commentary
  if (breakdown.modelAgreement >= 0.8) {
    parts.push('Forecast models show strong agreement.');
  } else if (breakdown.modelAgreement >= 0.6) {
    parts.push('Model agreement is fair but notable disagreement remains.');
  } else {
    parts.push('Models significantly disagree — forecast uncertainty is high.');
  }

  // Consequence impact
  if (breakdown.consequenceOfError >= 2.5) {
    parts.push(
      'The critical consequence level demands much higher certainty than normal.'
    );
  } else if (breakdown.consequenceOfError >= 1.5) {
    parts.push(
      'Elevated consequence level raises the bar for sufficiency.'
    );
  }

  return '[SIMULATED] ' + parts.join(' ');
}

/** Full sufficiency calculation */
export function computeVerdict(
  sources: EvidenceSource[],
  consensus: ConsensusResponse,
  decision: DecisionRequest
): VerdictResponse {
  const evidenceQuality = computeAggregateQuality(sources);
  const modelAgreement = consensus.agreementScore;
  const decisionRelevance = DOMAIN_RELEVANCE[decision.domain] ?? 0.8;
  const consequenceOfError =
    CONSEQUENCE_MULTIPLIERS[decision.consequenceLevel] ?? 1.5;

  // Core formula: (EQ × MA × DR) / CoE
  const rawScore =
    (evidenceQuality * modelAgreement * decisionRelevance) / consequenceOfError;

  // Normalize to 0–100 (rawScore max theoretical is ~1.0 when CoE=1)
  const normalizedScore = Math.min(100, Math.round(rawScore * 100));

  const verdict = getVerdictLabel(normalizedScore);

  const breakdown: FormulaBreakdown = {
    evidenceQuality: Math.round(evidenceQuality * 100) / 100,
    modelAgreement: Math.round(modelAgreement * 100) / 100,
    decisionRelevance: Math.round(decisionRelevance * 100) / 100,
    consequenceOfError,
    rawScore: Math.round(rawScore * 1000) / 1000,
    normalizedScore,
  };

  const explanation = generateExplanation(
    breakdown,
    verdict,
    decision.domain,
    decision.action
  );

  return {
    score: normalizedScore,
    verdict,
    explanation,
    breakdown,
    thresholds: {
      sufficient: VERDICT_THRESHOLDS.sufficient,
      needMore: VERDICT_THRESHOLDS.needMore,
    },
  };
}
