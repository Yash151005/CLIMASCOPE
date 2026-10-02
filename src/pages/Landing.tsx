/**
 * CLIMASCOPE — Landing Page
 * ===========================
 * Overview, problem statement, pipeline, and CTA.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Database,
  Search,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  BarChart3,
  Activity,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '../components/ui';

const PIPELINE_STEPS = [
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Evidence Ingestion',
    desc: 'Pull data from weather APIs, satellites, GIS, historical records, and forecasts.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Evidence Audit',
    desc: 'Score each source on freshness, provenance, completeness, spatial fit, temporal fit.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: <GitBranch className="w-6 h-6" />,
    title: 'Consensus & Uncertainty',
    desc: 'Compare models. Measure disagreement. Never average away uncertainty.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Decision Verdict',
    desc: 'SUFFICIENT · INSUFFICIENT · NEED MORE EVIDENCE — with full explanation.',
    color: 'from-emerald-500 to-emerald-600',
  },
];

const VERDICTS = [
  {
    label: 'SUFFICIENT',
    icon: <CheckCircle2 className="w-5 h-5" />,
    desc: 'Evidence supports this decision.',
    cls: 'verdict-sufficient',
  },
  {
    label: 'NEED MORE EVIDENCE',
    icon: <AlertTriangle className="w-5 h-5" />,
    desc: "Close, but gaps remain. Here's what to get.",
    cls: 'verdict-needmore',
  },
  {
    label: 'INSUFFICIENT',
    icon: <AlertTriangle className="w-5 h-5" />,
    desc: 'Do not act on this evidence alone.',
    cls: 'verdict-insufficient',
  },
];

export const Landing: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-20 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-6">
          <Activity className="w-3.5 h-3.5" />
          PCCOE International Grand Challenge 2026 · AI for Climate Change
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
            A forecast is not
          </span>
          <br />
          <span className="text-white/90">a safe decision.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
          CLIMASCOPE audits whether the available evidence is strong enough to act —
          and if not, tells you exactly what's missing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/analyze"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02]"
          >
            Start Analysis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/validation"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 text-white/70 hover:text-white/90 hover:bg-white/5 transition-all font-medium"
          >
            View Validation
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="mb-20">
        <GlassCard className="text-center py-10 px-8 max-w-3xl mx-auto">
          <Globe className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/90 mb-3">The Problem</h2>
          <p className="text-white/50 leading-relaxed">
            Climate decisions — evacuations, water releases, heat advisories — are often
            made on forecasts alone. But <strong className="text-white/80">a forecast
            without an evidence audit is a gamble</strong>. If the data is stale, the
            models disagree, or the spatial resolution is wrong, the decision may be worse
            than doing nothing. Yet there's no standard tool that says:{' '}
            <em className="text-amber-300">"your evidence isn't good enough to act."</em>
          </p>
        </GlassCard>
      </section>

      {/* Core Formula */}
      <section className="mb-20 text-center">
        <h2 className="text-xl font-bold text-white/90 mb-6">The Core Mechanism</h2>
        <GlassCard className="max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm sm:text-base py-4">
            <span className="text-white/60">Sufficiency =</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Evidence Quality
            </span>
            <span className="text-white/30">×</span>
            <span className="px-3 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Model Agreement
            </span>
            <span className="text-white/30">×</span>
            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Decision Relevance
            </span>
            <span className="text-white/30">÷</span>
            <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              Consequence of Error
            </span>
          </div>
          <p className="text-xs text-white/30 mt-3">
            Uncertainty and model disagreement are never averaged away. They are preserved and shown as part of the decision.
          </p>
        </GlassCard>
      </section>

      {/* Pipeline */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-white/90 mb-8 text-center">
          4-Stage Pipeline
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STEPS.map((step, i) => (
            <GlassCard key={i} delay={i * 100} className="text-center group hover:scale-[1.02] transition-transform">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
              >
                {step.icon}
              </div>
              <div className="text-xs text-white/30 font-mono mb-1.5">
                Stage {i + 1}
              </div>
              <h3 className="text-sm font-bold text-white/85 mb-2">{step.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{step.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Verdicts */}
      <section className="mb-20">
        <h2 className="text-xl font-bold text-white/90 mb-8 text-center">
          Three Possible Verdicts
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {VERDICTS.map((v) => (
            <div
              key={v.label}
              className={`${v.cls} rounded-xl p-5 text-center transition-transform hover:scale-[1.02]`}
            >
              <div className="mx-auto mb-3">{v.icon}</div>
              <h3 className="text-sm font-bold mb-1">{v.label}</h3>
              <p className="text-xs opacity-70">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pb-8">
        <GlassCard className="max-w-lg mx-auto py-10 animate-pulse-glow">
          <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/90 mb-3">
            Ready to audit your evidence?
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Define a climate decision and let CLIMASCOPE tell you if the evidence is strong enough.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            Start Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </GlassCard>
      </section>
    </div>
  );
};
