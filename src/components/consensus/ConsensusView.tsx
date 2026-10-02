/**
 * CLIMASCOPE — Consensus View Component
 * ========================================
 * Multiple model outputs, disagreement band, agreement score.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ErrorBar,
} from 'recharts';
import { Gauge, AlertCircle, CheckCircle } from 'lucide-react';
import type { ConsensusResponse } from '../../api/types';
import { GlassCard, ScoreBar } from '../ui';
import { useDecisionStore } from '../../store/decisionStore';

const MODEL_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ec4899', // pink
];

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-white/90">{data.modelName}</p>
      <p className="text-white/60">
        {data.value} {data.unit}
      </p>
      <p className="text-white/40">
        Range: {data.low}–{data.high} {data.unit}
      </p>
      <p className="text-white/40">Provider: {data.provider}</p>
    </div>
  );
};

export const ConsensusView: React.FC = () => {
  const consensus = useDecisionStore((s) => s.consensus);
  if (!consensus) return null;

  const chartData = consensus.models.map((m) => ({
    modelName: m.modelName,
    value: m.value,
    low: m.confidenceLow,
    high: m.confidenceHigh,
    unit: m.unit,
    provider: m.provider,
    errorLow: m.value - m.confidenceLow,
    errorHigh: m.confidenceHigh - m.value,
  }));

  const mean =
    consensus.models.reduce((s, m) => s + m.value, 0) / consensus.models.length;

  return (
    <section aria-label="Consensus View">
      <h2 className="text-lg font-bold text-white/90 mb-4">Model Consensus</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            Forecast Comparison ({consensus.models[0]?.unit || 'units'})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <XAxis
                  dataKey="modelName"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <ReferenceLine
                  y={mean}
                  stroke="rgba(6,182,212,0.4)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mean: ${mean.toFixed(0)}`,
                    position: 'right',
                    fill: 'rgba(6,182,212,0.6)',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} fillOpacity={0.8} />
                  ))}
                  <ErrorBar
                    dataKey="errorHigh"
                    width={6}
                    strokeWidth={1.5}
                    stroke="rgba(255,255,255,0.3)"
                    direction="y"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-white/40 mt-2 text-center">
            Per-model bounds are shown only when supplied. The disagreement band remains explicit and is never averaged away.
          </p>
        </GlassCard>

        {/* Metrics */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              {consensus.agreementScore >= 0.7 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <h3 className="text-sm font-semibold text-white/70">Agreement Score</h3>
            </div>
            <div className="text-3xl font-bold text-white/90 mb-2">
              {Math.round(consensus.agreementScore * 100)}%
            </div>
            <ScoreBar label="agreement" score={consensus.agreementScore} />
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-white/70 mb-2">Disagreement Band</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-white/80">
                {consensus.disagreementBand.min}–{consensus.disagreementBand.max}
              </span>
              <span className="text-xs text-white/40">{consensus.disagreementBand.unit}</span>
            </div>
            <p className="text-xs text-white/40">
              Spread: {consensus.disagreementBand.max - consensus.disagreementBand.min}{' '}
              {consensus.disagreementBand.unit}
            </p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white/70">Calibration</h3>
            </div>
            {consensus.calibrationStatus === 'available' ? (
              <ScoreBar
                label="calibration"
                score={consensus.calibrationIndicator}
                explanation="Calibration measured against observed forecast-error distributions."
              />
            ) : (
              <p className="rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
                {consensus.calibrationStatus === 'illustrative'
                  ? 'SIMULATED: calibration is not measured against observed forecast errors.'
                  : 'Not measured: no observed forecast-error reference dataset is connected.'}
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Explanation */}
      <GlassCard className="mt-4">
        <p className="text-sm text-white/60 leading-relaxed font-mono">
          {consensus.explanation}
        </p>
      </GlassCard>
    </section>
  );
};
