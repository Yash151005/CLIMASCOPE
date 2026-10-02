/**
 * CLIMASCOPE — Evidence Panel Component
 * ========================================
 * Displays evidence sources as cards with audit scores.
 * Toggle sources on/off for What-If analysis.
 */

import React from 'react';
import {
  Cloud,
  Satellite,
  Map,
  Clock,
  FileText,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { EvidenceSource, EvidenceSourceType, AuditScore } from '../../api/types';
import { ScoreBar, GlassCard } from '../ui';
import { useDecisionStore } from '../../store/decisionStore';
import { AUDIT_WEIGHTS } from '../../config/engine';

const SOURCE_ICONS: Record<EvidenceSourceType, React.ReactNode> = {
  'weather-api': <Cloud className="w-5 h-5" />,
  satellite: <Satellite className="w-5 h-5" />,
  gis: <Map className="w-5 h-5" />,
  'historical-events': <Clock className="w-5 h-5" />,
  'forecast-model': <BarChart3 className="w-5 h-5" />,
  reports: <FileText className="w-5 h-5" />,
};

const QualityIcon: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 0.8) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (score >= 0.6) return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
};

interface EvidenceCardProps {
  source: EvidenceSource;
  onToggle: (id: string) => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ source, onToggle }) => {
  const [expanded, setExpanded] = React.useState(false);
  const freshnessMinutes = Math.round(
    (Date.now() - new Date(source.retrievedAt).getTime()) / 60_000
  );
  const freshnessLabel =
    freshnessMinutes < 60
      ? `${freshnessMinutes}m ago`
      : `${Math.round(freshnessMinutes / 60)}h ago`;

  return (
    <GlassCard
      className={`transition-all duration-300 ${
        source.enabled
          ? 'opacity-100'
          : 'opacity-40 grayscale'
      }`}
      animate={false}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
            {SOURCE_ICONS[source.type]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">{source.name}</h3>
            <p className="text-xs text-white/40">
              {source.provider} · {freshnessLabel} · {source.resolution}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(source.id)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
          aria-label={`${source.enabled ? 'Disable' : 'Enable'} ${source.name}`}
          aria-pressed={source.enabled}
        >
          {source.enabled ? (
            <ToggleRight className="w-5 h-5 text-cyan-400" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-white/30" />
          )}
        </button>
      </div>

      {/* Quality badge */}
      <div className="flex items-center gap-2 mb-3">
        <QualityIcon score={source.overallQuality} />
        <span className="text-xs font-medium text-white/60">
          Quality: {Math.round(source.overallQuality * 100)}%
        </span>
        <span className="text-xs text-white/30">·</span>
        <span className="text-xs text-white/40">{source.license}</span>
      </div>

      {/* Summary */}
      <p className="text-xs text-white/50 leading-relaxed mb-3 font-mono bg-white/3 rounded px-3 py-2">
        {source.rawSummary}
      </p>

      {/* Audit scores */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors mb-2"
        aria-expanded={expanded}
      >
        {expanded ? '▾ Hide audit details' : '▸ Show audit details'}
      </button>

      {expanded && (
        <div className="space-y-2.5 mt-2 animate-fade-in-up">
          {source.auditScores.map((audit) => (
            <div key={audit.dimension}>
              <ScoreBar
                label={`${audit.dimension} · weight ${(
                  audit.weight ?? AUDIT_WEIGHTS[audit.dimension]
                ).toFixed(2)}`}
                score={audit.score}
                explanation={audit.explanation}
              />
              <p className="text-[10px] text-white/30 mt-0.5 pl-1">
                {audit.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export const EvidencePanel: React.FC = () => {
  const evidence = useDecisionStore((s) => s.evidence);
  const toggleSource = useDecisionStore((s) => s.toggleSource);

  if (!evidence) return null;

  const enabledCount = evidence.sources.filter((s) => s.enabled).length;

  return (
    <section aria-label="Evidence Panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white/90">Evidence Sources</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {enabledCount} of {evidence.sources.length} enabled · Aggregate quality:{' '}
            {Math.round(evidence.aggregateQuality * 100)}%
          </p>
        </div>
        <div className="text-xs text-amber-400/60 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Toggle sources to see score impact
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {evidence.sources.map((source) => (
          <EvidenceCard key={source.id} source={source} onToggle={toggleSource} />
        ))}
      </div>
    </section>
  );
};
