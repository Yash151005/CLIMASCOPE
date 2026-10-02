/**
 * CLIMASCOPE — Validation Dashboard
 * ====================================
 * Historical case replay, source ablation robustness,
 * and false-confidence rate analytics.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  Percent,
  Sliders,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import type { ValidationResponse } from '../api/types';
import { api } from '../api/client';
import { GlassCard, VerdictBadge, Skeleton, ErrorBanner } from '../components/ui';

export const Validation: React.FC = () => {
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getValidation()
      .then((res) => {
        if (mounted) {
          setData(res);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorBanner message={error || 'Failed to load validation dataset.'} />
      </div>
    );
  }

  const accuracyPct = Math.round(data.overallAccuracy * 100);
  const falseConfidencePct = Math.round(data.falseConfidenceRate * 100);
  const correctCases = data.cases.filter((item) => item.actualVerdictCorrect).length;

  // Prepare chart data for robustness ablation
  const robustnessChartData = data.robustness.map((r, i) => ({
    name: `${r.caseId.replace('case-', '').split('-')[0]} (-${r.removedSource.split(' ')[0]})`,
    original: r.originalScore,
    reduced: r.reducedScore,
    delta: r.originalScore - r.reducedScore,
    caseId: r.caseId,
    removed: r.removedSource,
    verdictChanged: r.verdictChanged,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white/95">
            Validation & Robustness Dashboard
          </h1>
        </div>
        <p className="text-xs text-white/50">
          Seeded historical case examples and source-removal scenarios.
        </p>
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" role="note">
          {data.datasetNote}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Illustrative Label Match Rate
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white/90">{accuracyPct}%</span>
              <span className="text-xs text-emerald-400">Seed labels</span>
            </div>
            <p className="text-[11px] text-white/30 mt-0.5">
              {correctCases} of {data.cases.length} cases matched the supplied ground truth labels
            </p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Seed False-Confidence Rate
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white/90">{falseConfidencePct}%</span>
              <span className="text-xs text-amber-400">Seed labels</span>
            </div>
            <p className="text-[11px] text-white/30 mt-0.5">Computed only from illustrative seed labels</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Demo Ablation Verdict Shifts
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white/90">
                {data.robustness.filter((r) => r.verdictChanged).length}/{data.robustness.length}
              </span>
              <span className="text-xs text-violet-400">Verdict Shifts</span>
            </div>
            <p className="text-[11px] text-white/30 mt-0.5">Sensitivities isolated under source loss</p>
          </div>
        </GlassCard>
      </div>

      {/* Historical Case Replay Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Seeded Historical Case Examples
        </h2>

        <div className="glass rounded-xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/3 border-b border-white/5 text-white/40 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Case Title</th>
                  <th className="py-3.5 px-4 font-semibold">Domain</th>
                  <th className="py-3.5 px-4 font-semibold">Event Date</th>
                  <th className="py-3.5 px-4 font-semibold">Score</th>
                  <th className="py-3.5 px-4 font-semibold">Audit Verdict</th>
                  <th className="py-3.5 px-4 font-semibold">Ground Truth Outcome</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Correct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.cases.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 px-4 font-medium text-white/90">{c.title}</td>
                    <td className="py-3 px-4 capitalize text-white/60">{c.domain}</td>
                    <td className="py-3 px-4 font-mono text-white/40">
                      {new Date(c.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white/80">
                      {c.sufficiencyScore}/100
                    </td>
                    <td className="py-3 px-4">
                      <VerdictBadge verdict={c.predictedVerdict} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-white/50 max-w-xs">{c.actualOutcome}</td>
                    <td className="py-3 px-4 text-center">
                      {c.actualVerdictCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Robustness Under Source Removal Chart & Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Ablation Stress Test: Impact of Source Removal
        </h2>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Chart */}
          <GlassCard className="lg:col-span-7">
            <h3 className="text-sm font-semibold text-white/80 mb-1">
              Score Drop When A Source Is Removed
            </h3>
            <p className="text-xs text-white/40 mb-4">
              Bars indicate sufficiency score drop (original vs degraded).
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={robustnessChartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="glass p-2.5 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-white">{d.caseId}</p>
                          <p className="text-white/60">Removed: {d.removed}</p>
                          <p className="text-white/40">
                            Score: {d.original} → {d.reduced} (-{d.delta} pts)
                          </p>
                          <p
                            className={
                              d.verdictChanged ? 'text-red-400 font-semibold' : 'text-emerald-400'
                            }
                          >
                            {d.verdictChanged ? '⚠ Verdict Flipped' : '✓ Verdict Robust'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                    {robustnessChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.verdictChanged ? '#ef4444' : '#06b6d4'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-white/40 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Verdict Changed (Fragile)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Verdict Maintained (Robust)
              </span>
            </div>
          </GlassCard>

          {/* Ablation Details Table */}
          <GlassCard className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">Ablation Summary</h3>
              <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1">
                {data.robustness.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white/3 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white/80">{r.caseId.replace('case-', '')}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Removed: {r.removedSource}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-white/90">
                        {r.originalScore} → {r.reducedScore}
                      </span>
                      <div className="text-[10px] mt-0.5">
                        {r.verdictChanged ? (
                          <span className="text-red-400 font-semibold">Verdict Changed</span>
                        ) : (
                          <span className="text-emerald-400">Stable</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-white/35 mt-4 pt-3 border-t border-white/5">
              Identifies Single-Points-of-Failure: if removing one weather API causes the verdict to collapse from SUFFICIENT to INSUFFICIENT, the decision is brittle.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};
