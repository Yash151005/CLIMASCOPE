/**
 * CLIMASCOPE — Analysis & What-If Workspace
 * ===========================================
 * Main workspace combining Decision Specification, Live What-If Audit,
 * Verdict Synthesis, Consensus View, and Next-Best Evidence.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  ShieldAlert,
  RotateCcw,
  Zap,
  Info,
} from 'lucide-react';
import { useDecisionStore } from '../store/decisionStore';
import { DecisionForm } from '../components/forms/DecisionForm';
import { EvidencePanel } from '../components/evidence/EvidencePanel';
import { ConsensusView } from '../components/consensus/ConsensusView';
import { VerdictPanel } from '../components/verdict/VerdictPanel';
import { MissingEvidence } from '../components/evidence/MissingEvidence';
import { ErrorBanner, GlassCard } from '../components/ui';
import { DOMAIN_LABELS } from '../config/engine';

export const Analysis: React.FC = () => {
  const {
    location,
    domain,
    action,
    timeHorizonHours,
    consequenceLevel,
    analysisReady,
    loading,
    whatIfLoading,
    error,
    setLocation,
    setDomain,
    setAction,
    setTimeHorizon,
    setConsequenceLevel,
    runAnalysis,
  } = useDecisionStore();

  const [formOpen, setFormOpen] = useState(!analysisReady);

  // Quick Demo Scenario Pre-fill
  const loadDemoScenario = (scenario: 'mumbai' | 'delhi' | 'pune') => {
    if (scenario === 'mumbai') {
      setLocation({ lat: 19.076, lng: 72.8777, label: 'Mumbai, Maharashtra, India' });
      setDomain('flood');
      setAction('Issue evacuation advisory for Zone A coastal slum clusters');
      setTimeHorizon(48);
      setConsequenceLevel('critical');
    } else if (scenario === 'delhi') {
      setLocation({ lat: 28.6139, lng: 77.209, label: 'New Delhi, Delhi, India' });
      setDomain('heat');
      setAction('Activate city-wide emergency heat shelters & water tanker distribution');
      setTimeHorizon(72);
      setConsequenceLevel('high');
    } else {
      setLocation({ lat: 18.5204, lng: 73.8567, label: 'Pune, Maharashtra, India' });
      setDomain('flood');
      setAction('Pre-emptively close low-lying bridge underpasses');
      setTimeHorizon(24);
      setConsequenceLevel('medium');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Quick Demos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white/95">
              Evidence Sufficiency Audit
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Quantify whether observational & model evidence justifies high-stakes climate action.
          </p>
        </div>

        {/* Demo Scenario Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Load Sample Case:
          </span>
          <button
            onClick={() => loadDemoScenario('mumbai')}
            className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all"
          >
            Mumbai Flood (Critical)
          </button>
          <button
            onClick={() => loadDemoScenario('delhi')}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all"
          >
            Delhi Heatwave (High)
          </button>
          <button
            onClick={() => loadDemoScenario('pune')}
            className="px-2.5 py-1 text-xs rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-all"
          >
            Pune Flash Flood (Medium)
          </button>
        </div>
      </div>

      {/* Decision Configuration Card / Summary */}
      <GlassCard className="transition-all">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Decision Specification</span>
            </div>

            {location && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 text-white/70">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {location.label.split(',')[0]}
              </span>
            )}

            <span className="px-2 py-0.5 rounded bg-white/5 text-white/70 capitalize font-mono">
              {DOMAIN_LABELS[domain]}
            </span>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/70 font-mono">
              <Clock className="w-3 h-3 text-white/40" />
              {timeHorizonHours}h
            </span>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 uppercase font-mono text-[11px] text-amber-300">
              <ShieldAlert className="w-3 h-3" />
              {consequenceLevel}
            </span>
          </div>

          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
            aria-expanded={formOpen}
          >
            <span>{formOpen ? 'Collapse Setup' : 'Edit Setup'}</span>
            {formOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Form */}
        {formOpen && (
          <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in-up">
            <DecisionForm />
          </div>
        )}
      </GlassCard>

      {/* When analysis has not been triggered yet */}
      {!analysisReady && !loading && (
        <div className="text-center py-16 space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white/90">
            Define your decision parameters above
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Choose a location, specify your proposed intervention, set time horizon and consequence level, then click{' '}
            <strong className="text-cyan-300">"Run Evidence Audit"</strong>.
          </p>
        </div>
      )}

      {/* Active Analysis Dashboard */}
      {analysisReady && (
        <div className="space-y-8 animate-fade-in-up">
          {error && <ErrorBanner message={error} />}
          {/* Live What-If Callout */}
          <div className="glass rounded-xl p-4 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-violet-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">
                  Live What-If Analysis Active
                </h3>
                <p className="text-xs text-white/50">
                  Toggle sources below to refresh the verdict and recommendations while preserving forecast disagreement.
                </p>
              </div>
            </div>
            <span className="text-xs text-cyan-300" role="status" aria-live="polite">
              {whatIfLoading ? 'Recalculating…' : 'Ready'}
            </span>
          </div>

          {/* Core Decision Verdict */}
          <VerdictPanel />

          {/* Model Consensus & Uncertainty View */}
          <ConsensusView />

          {/* Evidence Panel (Sources with What-If toggles) */}
          <EvidencePanel />

          {/* Missing Evidence & Next-Best Evidence */}
          <MissingEvidence />
        </div>
      )}
    </div>
  );
};
