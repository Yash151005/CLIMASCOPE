/**
 * CLIMASCOPE — Verdict Panel Component
 * =======================================
 * Sufficiency gauge, verdict badge, explanation, and formula breakdown.
 */

import React from 'react';
import { Info, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScoreGauge, VerdictBadge, GlassCard, ScoreBar } from '../ui';
import { useDecisionStore } from '../../store/decisionStore';
import { VERDICT_THRESHOLDS } from '../../config/engine';

export const VerdictPanel: React.FC = () => {
  const verdict = useDecisionStore((s) => s.verdict);
  if (!verdict) return null;

  const { breakdown } = verdict;

  return (
    <section aria-label="Verdict Panel">
      <h2 className="text-lg font-bold text-white/90 mb-4">Decision Verdict</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gauge + Badge */}
        <GlassCard className="flex flex-col items-center justify-center py-8 animate-pulse-glow">
          <div className="relative">
            <ScoreGauge score={verdict.score} size={180} />
          </div>
          <div className="mt-4">
            <VerdictBadge verdict={verdict.verdict} size="lg" />
          </div>
        </GlassCard>

        {/* Formula Breakdown */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white/70">Score Breakdown</h3>
          </div>

          {/* Formula display */}
          <div className="flex flex-wrap items-center gap-2 mb-5 px-3 py-3 rounded-lg bg-white/3 font-mono text-xs">
            <span className="text-white/70">Sufficiency =</span>
            <span className="text-cyan-300">(</span>
            <span className="text-emerald-400">{breakdown.evidenceQuality}</span>
            <span className="text-white/30">×</span>
            <span className="text-violet-400">{breakdown.modelAgreement}</span>
            <span className="text-white/30">×</span>
            <span className="text-blue-400">{breakdown.decisionRelevance}</span>
            <span className="text-cyan-300">)</span>
            <span className="text-white/30">÷</span>
            <span className="text-red-400">{breakdown.consequenceOfError}</span>
            <span className="text-white/30">=</span>
            <span className="text-white/80 font-bold">{breakdown.rawScore}</span>
            <ArrowRight className="w-3 h-3 text-white/30" />
            <span className="text-white/90 font-bold text-sm">{breakdown.normalizedScore}/100</span>
          </div>

          {/* Individual term bars */}
          <div className="space-y-3">
            <ScoreBar label="Evidence Quality" score={breakdown.evidenceQuality} />
            <ScoreBar label="Model Agreement" score={breakdown.modelAgreement} />
            <ScoreBar label="Decision Relevance" score={breakdown.decisionRelevance} />

            {/* Consequence is a multiplier, show differently */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Consequence of Error (÷)
                </span>
                <span className="text-xs font-mono text-red-400">
                  ×{breakdown.consequenceOfError}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 score-bar-fill"
                  style={{ width: `${(breakdown.consequenceOfError / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Thresholds legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ≥{VERDICT_THRESHOLDS.sufficient} Sufficient
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              ≥{VERDICT_THRESHOLDS.needMore} Need More
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              &lt;{VERDICT_THRESHOLDS.needMore} Insufficient
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Plain-language explanation */}
      <GlassCard className="mt-4">
        <h3 className="text-sm font-semibold text-white/70 mb-2">Explanation</h3>
        <p className="text-sm text-white/60 leading-relaxed">{verdict.explanation}</p>
      </GlassCard>
    </section>
  );
};
