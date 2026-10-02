/**
 * CLIMASCOPE — Decision Input Form
 * =================================
 * Configures location, domain, action, time horizon, and consequence level.
 */

import React, { useState } from 'react';
import {
  Waves,
  Thermometer,
  CloudOff,
  Wheat,
  Droplets,
  Building2,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { DecisionDomain, ConsequenceLevel, GeoLocation } from '../../api/types';
import { useDecisionStore } from '../../store/decisionStore';
import { LocationMap } from './LocationMap';
import { GlassCard } from '../ui';
import {
  DOMAIN_LABELS,
  CONSEQUENCE_LABELS,
  CONSEQUENCE_MULTIPLIERS,
} from '../../config/engine';

const DOMAIN_OPTIONS: { id: DecisionDomain; label: string; icon: React.ReactNode; defaultAction: string }[] = [
  {
    id: 'flood',
    label: DOMAIN_LABELS.flood,
    icon: <Waves className="w-4 h-4" />,
    defaultAction: 'Issue evacuation advisory for low-lying coastal wards',
  },
  {
    id: 'heat',
    label: DOMAIN_LABELS.heat,
    icon: <Thermometer className="w-4 h-4" />,
    defaultAction: 'Activate municipal Heat Action Plan & open cooling shelters',
  },
  {
    id: 'drought',
    label: DOMAIN_LABELS.drought,
    icon: <CloudOff className="w-4 h-4" />,
    defaultAction: 'Enact mandatory Stage-2 agricultural irrigation rationing',
  },
  {
    id: 'agriculture',
    label: DOMAIN_LABELS.agriculture,
    icon: <Wheat className="w-4 h-4" />,
    defaultAction: 'Issue crop protection advisory for vulnerable monsoon acreage',
  },
  {
    id: 'water',
    label: DOMAIN_LABELS.water,
    icon: <Droplets className="w-4 h-4" />,
    defaultAction: 'Initiate 20% emergency reservoir sluice discharge',
  },
  {
    id: 'smart-city',
    label: DOMAIN_LABELS['smart-city'],
    icon: <Building2 className="w-4 h-4" />,
    defaultAction: 'Reroute urban mass transit around flood-prone underpasses',
  },
];

const PRESET_LOCATIONS: GeoLocation[] = [
  { lat: 19.076, lng: 72.8777, label: 'Mumbai, Maharashtra, India' },
  { lat: 28.6139, lng: 77.209, label: 'New Delhi, Delhi, India' },
  { lat: 13.0827, lng: 80.2707, label: 'Chennai, Tamil Nadu, India' },
  { lat: 18.5204, lng: 73.8567, label: 'Pune, Maharashtra, India' },
  { lat: 10.8505, lng: 76.2711, label: 'Kochi, Kerala, India' },
];

export const DecisionForm: React.FC = () => {
  const {
    location,
    domain,
    action,
    timeHorizonHours,
    consequenceLevel,
    loading,
    error,
    setLocation,
    setDomain,
    setAction,
    setTimeHorizon,
    setConsequenceLevel,
    runAnalysis,
    reset,
  } = useDecisionStore();

  const handleDomainSelect = (d: DecisionDomain) => {
    setDomain(d);
    const found = DOMAIN_OPTIONS.find((o) => o.id === d);
    if (found && (!action || DOMAIN_OPTIONS.some((o) => o.defaultAction === action))) {
      setAction(found.defaultAction);
    }
  };

  const handlePresetLocation = (loc: GeoLocation) => {
    setLocation(loc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Location & Domain (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Location Card */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Target Decision Area</h3>
                <p className="text-xs text-white/40">Select on map or pick a high-vulnerability test location</p>
              </div>
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1">
                {PRESET_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    key={loc.label}
                    type="button"
                    onClick={() => handlePresetLocation(loc)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-cyan-300 border border-white/5 transition-colors"
                  >
                    {loc.label.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <LocationMap value={location} onChange={setLocation} />
          </GlassCard>

          {/* Domain Selection */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-white/90 mb-1">Decision Domain</h3>
            <p className="text-xs text-white/40 mb-3">
              Calibrates domain-specific relevance weighting and threshold tolerance
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DOMAIN_OPTIONS.map((item) => {
                const active = domain === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDomainSelect(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-sm shadow-cyan-500/20'
                        : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${
                        active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Action, Time Horizon, Consequence Level (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Specific Action */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="action-input" className="text-sm font-semibold text-white/90">
                Proposed Action
              </label>
              <button
                type="button"
                onClick={() => {
                  const found = DOMAIN_OPTIONS.find((o) => o.id === domain);
                  if (found) setAction(found.defaultAction);
                }}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Fill Suggested
              </button>
            </div>
            <textarea
              id="action-input"
              rows={3}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Issue Level-3 evacuation advisory across Ward G-North..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
              required
            />
            <p className="text-[11px] text-white/40 mt-1">
              Be specific. Sufficiency audits whether evidence specifically warrants this intervention.
            </p>
          </GlassCard>

          {/* Time Horizon */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <label className="text-sm font-semibold text-white/90">Time Horizon</label>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {timeHorizonHours} Hours ({Math.round(timeHorizonHours / 24 * 10) / 10} Days)
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="168"
              step="6"
              value={timeHorizonHours}
              onChange={(e) => setTimeHorizon(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1">
              <span>6h (Immediate)</span>
              <span>24h</span>
              <span>48h</span>
              <span>72h</span>
              <span>7 Days (Synoptic)</span>
            </div>
          </GlassCard>

          {/* Consequence of Error */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <label className="text-sm font-semibold text-white/90">Consequence of Error</label>
              </div>
              <span className="text-xs font-mono text-red-400">
                ÷{CONSEQUENCE_MULTIPLIERS[consequenceLevel]} penalty
              </span>
            </div>
            <p className="text-[11px] text-white/40 mb-3">
              Divides sufficiency. Higher consequence strictly raises required evidence certainty.
            </p>

            <div className="space-y-2">
              {(['low', 'medium', 'high', 'critical'] as ConsequenceLevel[]).map((lvl) => {
                const active = consequenceLevel === lvl;
                const colors: Record<ConsequenceLevel, string> = {
                  low: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
                  medium: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
                  high: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
                  critical: 'border-red-500/40 text-red-300 bg-red-500/15',
                };
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConsequenceLevel(lvl)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all ${
                      active
                        ? colors[lvl]
                        : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px]">
                      <span>{lvl}</span>
                      <span className="font-mono">÷{CONSEQUENCE_MULTIPLIERS[lvl]}</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {CONSEQUENCE_LABELS[lvl]}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Submit / Reset Actions */}
          <div className="space-y-2 pt-2">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Auditing Evidence Pipeline...
                  </span>
                ) : (
                  <>
                    <span>Run Evidence Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={reset}
                title="Reset form"
                className="p-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/50 hover:text-white/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
