/**
 * CLIMASCOPE — Missing Evidence Component
 * ==========================================
 * Ranked list of evidence that would most improve sufficiency.
 */

import React from 'react';
import { Plus, TrendingUp, ArrowUpRight, Lightbulb, HelpCircle } from 'lucide-react';
import type { MissingEvidenceItem } from '../../api/types';
import { GlassCard } from '../ui';
import { useDecisionStore } from '../../store/decisionStore';

const FEASIBILITY_COLORS: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const MissingCard: React.FC<{ item: MissingEvidenceItem; rank: number }> = ({
  item,
  rank,
}) => (
  <div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
    {/* Rank + Score gain */}
    <div className="flex flex-col items-center shrink-0">
      <span className="text-xs text-white/30 font-mono">#{rank}</span>
      <span className="text-lg font-bold text-emerald-400 flex items-center gap-0.5">
        +{item.estimatedScoreGain}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </span>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-sm font-semibold text-white/85 truncate">{item.name}</h4>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
            FEASIBILITY_COLORS[item.feasibility]
          }`}
        >
          {item.feasibility}
        </span>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
      <p className="text-[10px] text-cyan-400/50 mt-1 flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        {item.acquisitionHint}
      </p>
    </div>
  </div>
);

export const MissingEvidence: React.FC = () => {
  const missing = useDecisionStore((s) => s.missingEvidence);
  if (!missing) return null;

  return (
    <section aria-label="Missing Evidence">
      <h2 className="text-lg font-bold text-white/90 mb-4">
        Next-Best Evidence
      </h2>

      <GlassCard>
        {/* Summary bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/70">
              Current: <strong className="text-white/90">{missing.currentScore}</strong>
            </span>
            <span className="text-white/20">→</span>
            <span className="text-sm text-white/70">
              Potential: <strong className="text-emerald-400">{missing.potentialScore}</strong>
            </span>
          </div>
          <span className="text-xs text-white/30">
            {missing.items.length} sources identified
          </span>
        </div>

        {/* Potential bar */}
        <div className="h-2 rounded-full bg-white/5 mb-5 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-white/10 absolute"
            style={{ width: `${missing.potentialScore}%` }}
          />
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 relative"
            style={{ width: `${missing.currentScore}%` }}
          />
        </div>

        {/* Ranked list */}
        <p className="mb-3 rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/80" role="note">
          {missing.estimateNote}
        </p>
        <div>
          {missing.items.map((item, i) => (
            <MissingCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      </GlassCard>
    </section>
  );
};
