/**
 * CLIMASCOPE — Zustand Decision Store
 * ======================================
 * Global state for the current decision session.
 */

import { create } from 'zustand';
import type {
  DecisionRequest,
  EvidencePanelResponse,
  ConsensusResponse,
  VerdictResponse,
  MissingEvidenceResponse,
  GeoLocation,
  DecisionDomain,
  ConsequenceLevel,
} from '../api/types';
import { api } from '../api/client';

let whatIfRequestId = 0;

interface DecisionState {
  /* ─── Form state ──────────────────────────────────────── */
  location: GeoLocation | null;
  domain: DecisionDomain;
  action: string;
  timeHorizonHours: number;
  consequenceLevel: ConsequenceLevel;

  /* ─── Results ─────────────────────────────────────────── */
  evidence: EvidencePanelResponse | null;
  consensus: ConsensusResponse | null;
  verdict: VerdictResponse | null;
  missingEvidence: MissingEvidenceResponse | null;

  /* ─── UI state ────────────────────────────────────────── */
  loading: boolean;
  whatIfLoading: boolean;
  error: string | null;
  analysisReady: boolean;

  /* ─── Actions ─────────────────────────────────────────── */
  setLocation: (loc: GeoLocation) => void;
  setDomain: (d: DecisionDomain) => void;
  setAction: (a: string) => void;
  setTimeHorizon: (h: number) => void;
  setConsequenceLevel: (c: ConsequenceLevel) => void;
  runAnalysis: () => Promise<void>;
  toggleSource: (sourceId: string) => void;
  reset: () => void;
}

const initialState = {
  location: null,
  domain: 'flood' as DecisionDomain,
  action: '',
  timeHorizonHours: 48,
  consequenceLevel: 'high' as ConsequenceLevel,
  evidence: null,
  consensus: null,
  verdict: null,
  missingEvidence: null,
  loading: false,
  whatIfLoading: false,
  error: null,
  analysisReady: false,
};

export const useDecisionStore = create<DecisionState>((set, get) => ({
  ...initialState,

  setLocation: (loc) => set({ location: loc }),
  setDomain: (d) => set({ domain: d }),
  setAction: (a) => set({ action: a }),
  setTimeHorizon: (h) => set({ timeHorizonHours: h }),
  setConsequenceLevel: (c) => set({ consequenceLevel: c }),

  runAnalysis: async () => {
    const { location, domain, action, timeHorizonHours, consequenceLevel } = get();
    whatIfRequestId += 1;
    if (!location) {
      set({ error: 'Please select a location on the map.', whatIfLoading: false });
      return;
    }
    if (!action.trim()) {
      set({ error: 'Please describe the specific action.', whatIfLoading: false });
      return;
    }

    const decision: DecisionRequest = {
      location,
      domain,
      action,
      timeHorizonHours,
      consequenceLevel,
    };

    set({ loading: true, whatIfLoading: false, error: null });
    try {
      const [evidence, consensus, verdict, missingEvidence] = await Promise.all([
        api.getEvidence(decision),
        api.getConsensus(decision),
        api.getVerdict(decision),
        api.getMissingEvidence(decision),
      ]);

      set({
        evidence,
        consensus,
        verdict,
        missingEvidence,
        loading: false,
        analysisReady: true,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Analysis failed.',
      });
    }
  },

  toggleSource: (sourceId: string) => {
    const { evidence, consensus, location, domain, action, timeHorizonHours, consequenceLevel } = get();
    if (!evidence || !consensus || !location) return;

    const requestId = ++whatIfRequestId;
    const updatedSources = evidence.sources.map((s) =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    );
    const enabledSourceIds = updatedSources.filter((s) => s.enabled).map((s) => s.id);
    const decision = {
      location,
      domain,
      action,
      timeHorizonHours,
      consequenceLevel,
    };

    set({
      evidence: {
        ...evidence,
        sources: updatedSources,
        aggregateQuality:
          updatedSources.length === 0
            ? 0
            : updatedSources.filter((source) => source.enabled).reduce(
                (sum, source) => sum + source.overallQuality,
                0
              ) / Math.max(enabledSourceIds.length, 1),
      },
      error: null,
      whatIfLoading: true,
    });

    api
      .whatIf({ decision, enabledSourceIds })
      .then((result) => {
        if (requestId !== whatIfRequestId) return;
        set({
          evidence: result.evidence,
          consensus: result.consensus,
          verdict: result.verdict,
          missingEvidence: result.missingEvidence,
          whatIfLoading: false,
        });
      })
      .catch((err) => {
        if (requestId !== whatIfRequestId) return;
        set({
          evidence,
          whatIfLoading: false,
          error: err instanceof Error ? err.message : 'What-if analysis failed.',
        });
      });
  },

  reset: () => {
    whatIfRequestId += 1;
    set(initialState);
  },
}));
