/**
 * CLIMASCOPE — History & Side-by-Side Comparison
 * ==================================================
 * Review past decisions and compare two scenarios side-by-side.
 */

import React, { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  GitCompare,
  ArrowRightLeft,
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import type { DecisionRecord } from '../api/types';
import { api } from '../api/client';
import {
  EmptyState,
  GlassCard,
  VerdictBadge,
  ScoreGauge,
  ScoreBar,
  Skeleton,
  ErrorBanner,
} from '../components/ui';
import { DOMAIN_LABELS } from '../config/engine';

export const History: React.FC = () => {
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Side-by-side selection
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    api
      .getHistory()
      .then((data) => {
        if (mounted) {
          setRecords(data);
          if (data.length >= 2) {
            setLeftId(data[0].id);
            setRightId(data[1].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorBanner message={error} />
      </div>
    );
  }

  const leftRecord = records.find((r) => r.id === leftId);
  const rightRecord = records.find((r) => r.id === rightId);

  const scoreDelta =
    leftRecord && rightRecord ? rightRecord.verdict.score - leftRecord.verdict.score : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <HistoryIcon className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white/95">
            Decision Audit History & Comparison
          </h1>
        </div>
        <p className="text-xs text-white/50">
          Compare evidence sufficiency across different locations, actions, and risk thresholds.
        </p>
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" role="note">
          Seeded comparison cases are simulated examples. Only records labeled as user audits were created by running this app.
        </p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="w-8 h-8" />}
          title="No saved audits yet"
          description="Run an evidence audit to create a decision record. Saved scenarios will appear here for comparison."
        />
      ) : (
      <>
      {/* Side-by-Side Comparison Workspace */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            Side-by-Side Scenario Diff
          </h2>

          {/* Selectors */}
          <div className="flex items-center gap-3">
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 focus:outline-none"
              aria-label="Select left scenario"
            >
              {records.map((r) => (
                <option key={r.id} value={r.id} className="bg-surface-800 text-white">
                  Scenario A: {r.request.location.label.split(',')[0]} ({r.request.domain})
                </option>
              ))}
            </select>

            <span className="text-xs text-white/30">vs</span>

            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 focus:outline-none"
              aria-label="Select right scenario"
            >
              {records.map((r) => (
                <option key={r.id} value={r.id} className="bg-surface-800 text-white">
                  Scenario B: {r.request.location.label.split(',')[0]} ({r.request.domain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Callout */}
        {leftRecord && rightRecord && (
          <div className="glass rounded-xl p-4 flex items-center justify-between text-xs border border-white/5">
            <span className="text-white/60">Sufficiency Score Variance:</span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span>{leftRecord.verdict.score}</span>
              <span className="text-white/30">→</span>
              <span>{rightRecord.verdict.score}</span>
              <span
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                  scoreDelta > 0
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : scoreDelta < 0
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-white/40 bg-white/5'
                }`}
              >
                {scoreDelta > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : scoreDelta < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
              </span>
            </div>
          </div>
        )}

        {records.length < 2 && (
          <EmptyState
            icon={<GitCompare className="w-8 h-8" />}
            title="Add another audit to compare"
            description="Side-by-side comparisons become available after at least two decisions have been saved."
          />
        )}

        {/* Two Column Side-by-Side Comparison */}
        {leftRecord && rightRecord && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario A (Left) */}
            <GlassCard className="space-y-4 border-l-2 border-l-cyan-400">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    Scenario A
                  </span>
                  <h3 className="text-base font-bold text-white/90">
                    {leftRecord.request.location.label}
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    {leftRecord.request.action}
                  </p>
                </div>
                <VerdictBadge verdict={leftRecord.verdict.verdict} size="sm" />
              </div>

              {/* Param chips */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-white/5 capitalize text-white/60">
                  {DOMAIN_LABELS[leftRecord.request.domain]}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 font-mono">
                  {leftRecord.request.timeHorizonHours}h Horizon
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 uppercase font-mono">
                  Risk: {leftRecord.request.consequenceLevel}
                </span>
              </div>

              {/* Gauge */}
              <div className="py-2 flex justify-center">
                <ScoreGauge score={leftRecord.verdict.score} size={130} />
              </div>

              {/* Formula Terms */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                <ScoreBar
                  label="Evidence Quality"
                  score={leftRecord.verdict.breakdown.evidenceQuality}
                />
                <ScoreBar
                  label="Model Agreement"
                  score={leftRecord.verdict.breakdown.modelAgreement}
                />
                <ScoreBar
                  label="Decision Relevance"
                  score={leftRecord.verdict.breakdown.decisionRelevance}
                />
              </div>

              <p className="text-xs text-white/45 italic pt-2 border-t border-white/5">
                "{leftRecord.verdict.explanation}"
              </p>
            </GlassCard>

            {/* Scenario B (Right) */}
            <GlassCard className="space-y-4 border-l-2 border-l-violet-400">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest">
                    Scenario B
                  </span>
                  <h3 className="text-base font-bold text-white/90">
                    {rightRecord.request.location.label}
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    {rightRecord.request.action}
                  </p>
                </div>
                <VerdictBadge verdict={rightRecord.verdict.verdict} size="sm" />
              </div>

              {/* Param chips */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-white/5 capitalize text-white/60">
                  {DOMAIN_LABELS[rightRecord.request.domain]}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 font-mono">
                  {rightRecord.request.timeHorizonHours}h Horizon
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 uppercase font-mono">
                  Risk: {rightRecord.request.consequenceLevel}
                </span>
              </div>

              {/* Gauge */}
              <div className="py-2 flex justify-center">
                <ScoreGauge score={rightRecord.verdict.score} size={130} />
              </div>

              {/* Formula Terms */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                <ScoreBar
                  label="Evidence Quality"
                  score={rightRecord.verdict.breakdown.evidenceQuality}
                />
                <ScoreBar
                  label="Model Agreement"
                  score={rightRecord.verdict.breakdown.modelAgreement}
                />
                <ScoreBar
                  label="Decision Relevance"
                  score={rightRecord.verdict.breakdown.decisionRelevance}
                />
              </div>

              <p className="text-xs text-white/45 italic pt-2 border-t border-white/5">
                "{rightRecord.verdict.explanation}"
              </p>
            </GlassCard>
          </div>
        )}
      </section>

      {/* Decision Log Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white/90">All Saved Audits</h2>
        <div className="glass rounded-xl overflow-hidden border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/3 border-b border-white/5 text-white/40 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Domain</th>
                <th className="py-3.5 px-4 font-semibold">Proposed Action</th>
                <th className="py-3.5 px-4 font-semibold">Consequence</th>
                <th className="py-3.5 px-4 font-semibold">Score</th>
                <th className="py-3.5 px-4 font-semibold">Verdict</th>
                <th className="py-3.5 px-4 font-semibold">Audited Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 font-medium text-white/90">
                    {r.request.location.label.split(',')[0]}
                  </td>
                  <td className="py-3 px-4 capitalize text-white/60">{r.request.domain}</td>
                  <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                    {r.request.action}
                    {r.recordType === 'seed-demo' && (
                      <span className="ml-2 inline-flex rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] font-mono text-amber-300">
                    {r.request.consequenceLevel}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white/80">
                    {r.verdict.score}/100
                  </td>
                  <td className="py-3 px-4">
                    <VerdictBadge verdict={r.verdict.verdict} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-white/40">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}
    </div>
  );
};
