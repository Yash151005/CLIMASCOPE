/**
 * CLIMASCOPE — Reusable UI Components
 */

import React from 'react';
import { clsx } from 'clsx';
import type { VerdictLabel } from '../../api/types';

/* ─── Score Gauge (circular) ────────────────────────────────── */

interface ScoreGaugeProps {
  score: number; // 0–100
  size?: number;
  label?: string;
  verdict?: VerdictLabel;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 160,
  label = 'Sufficiency',
  verdict,
}) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? 'var(--color-verdict-sufficient)'
      : score >= 40
        ? 'var(--color-verdict-needmore)'
        : 'var(--color-verdict-insufficient)';

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`${label}: ${score} out of 100`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-white/50 uppercase tracking-wider mt-0.5">
          {label}
        </span>
      </div>
      {verdict && (
        <VerdictBadge verdict={verdict} />
      )}
    </div>
  );
};

/* ─── Verdict Badge ─────────────────────────────────────────── */

interface VerdictBadgeProps {
  verdict: VerdictLabel;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const cls = clsx(
    'inline-flex items-center gap-2 rounded-full font-semibold tracking-wide uppercase',
    {
      'verdict-sufficient': verdict === 'SUFFICIENT',
      'verdict-insufficient': verdict === 'INSUFFICIENT',
      'verdict-needmore': verdict === 'NEED MORE EVIDENCE',
    },
    {
      'px-3 py-1 text-xs': size === 'sm',
      'px-4 py-1.5 text-sm': size === 'md',
      'px-6 py-2.5 text-base': size === 'lg',
    }
  );

  const icon = verdict === 'SUFFICIENT' ? '✓' : verdict === 'INSUFFICIENT' ? '✕' : '◔';

  return (
    <span className={cls} role="status" aria-label={`Verdict: ${verdict}`}>
      <span aria-hidden="true">{icon}</span>
      {verdict}
    </span>
  );
};

/* ─── Score Bar ─────────────────────────────────────────────── */

interface ScoreBarProps {
  label: string;
  score: number; // 0–1
  explanation?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, explanation }) => {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8
      ? 'bg-emerald-500'
      : score >= 0.6
        ? 'bg-cyan-500'
        : score >= 0.4
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <div className="space-y-1.5" title={explanation}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70 capitalize">
          {label.replace('-', ' ')}
        </span>
        <span className="text-xs font-mono text-white/50">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full score-bar-fill ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
};

/* ─── Glass Card ────────────────────────────────────────────── */

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  animate = true,
  delay = 0,
}) => (
  <div
    className={clsx(
      'glass rounded-xl p-5',
      animate && 'animate-fade-in-up',
      className
    )}
    style={animate ? { animationDelay: `${delay}ms` } : undefined}
  >
    {children}
  </div>
);

/* ─── Loading Skeleton ──────────────────────────────────────── */

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={clsx('rounded-lg bg-white/5 animate-shimmer', className)} />
);

/* ─── Empty State ───────────────────────────────────────────── */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white/20">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white/70 mb-2">{title}</h3>
    <p className="text-sm text-white/40 max-w-md">{description}</p>
  </div>
);

/* ─── Error Banner ──────────────────────────────────────────── */

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => (
  <div
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
    role="alert"
  >
    <span className="shrink-0">⚠</span>
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300" aria-label="Dismiss">
        ✕
      </button>
    )}
  </div>
);
