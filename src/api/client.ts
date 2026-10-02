/**
 * CLIMASCOPE — API Client
 * =========================
 * Typed API client that currently routes to mock handlers.
 * When the real backend is ready, replace imports with fetch calls
 * to the actual API endpoints — no component changes needed.
 */

import type {
  DecisionRequest,
  EvidencePanelResponse,
  ConsensusResponse,
  VerdictResponse,
  MissingEvidenceResponse,
  WhatIfRequest,
  WhatIfResponse,
  ValidationResponse,
  DecisionRecord,
} from './types';

import {
  fetchEvidence as mockEvidence,
  fetchConsensus as mockConsensus,
  fetchVerdict as mockVerdict,
  fetchMissingEvidence as mockMissing,
  fetchWhatIf as mockWhatIf,
  fetchValidation as mockValidation,
  fetchHistory as mockHistory,
  fetchDecisionById as mockDecisionById,
} from '../mocks/handlers';

/**
 * Configure with VITE_USE_MOCKS and VITE_API_BASE_URL.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

/* ─── Endpoint Contract ─────────────────────────────────────── */
/*
 * These are the endpoints the backend must implement in Phase 2:
 *
 * POST /api/v1/evidence         → EvidencePanelResponse
 *   Body: { decision: DecisionRequest, enabledSourceIds?: string[] }
 *
 * POST /api/v1/consensus        → ConsensusResponse
 *   Body: { decision: DecisionRequest }
 *
 * POST /api/v1/verdict          → VerdictResponse
 *   Body: { decision: DecisionRequest, enabledSourceIds?: string[] }
 *
 * POST /api/v1/missing-evidence → MissingEvidenceResponse
 *   Body: { decision: DecisionRequest, enabledSourceIds?: string[] }
 *
 * POST /api/v1/what-if          → WhatIfResponse
 *   Body: WhatIfRequest
 *
 * GET  /api/v1/validation       → ValidationResponse
 *
 * GET  /api/v1/history          → DecisionRecord[]
 *
 * GET  /api/v1/history/:id      → DecisionRecord
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(await getErrorMessage(res));
  return res.json() as Promise<T>;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const payload = body as { detail?: unknown; message?: unknown };
      const detail = payload.detail ?? payload.message;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((item) =>
            item && typeof item === 'object' && 'msg' in item
              ? String(item.msg)
              : String(item)
          )
          .join('; ');
      }
    }
  } catch {
    // A non-JSON response should still expose its HTTP status below.
  }
  return `API error: ${response.status} ${response.statusText}`;
}

/* ─── Public API ─────────────────────────────────────────────── */

export const api = {
  async getEvidence(
    decision: DecisionRequest,
    enabledSourceIds?: string[]
  ): Promise<EvidencePanelResponse> {
    if (USE_MOCKS) return mockEvidence(decision, enabledSourceIds);
    return post('/evidence', { decision, enabledSourceIds });
  },

  async getConsensus(decision: DecisionRequest): Promise<ConsensusResponse> {
    if (USE_MOCKS) return mockConsensus(decision);
    return post('/consensus', { decision });
  },

  async getVerdict(
    decision: DecisionRequest,
    enabledSourceIds?: string[]
  ): Promise<VerdictResponse> {
    if (USE_MOCKS) return mockVerdict(decision, enabledSourceIds);
    return post('/verdict', { decision, enabledSourceIds });
  },

  async getMissingEvidence(
    decision: DecisionRequest,
    enabledSourceIds?: string[]
  ): Promise<MissingEvidenceResponse> {
    if (USE_MOCKS) return mockMissing(decision, enabledSourceIds);
    return post('/missing-evidence', { decision, enabledSourceIds });
  },

  async whatIf(req: WhatIfRequest): Promise<WhatIfResponse> {
    if (USE_MOCKS) return mockWhatIf(req);
    return post('/what-if', req);
  },

  async getValidation(): Promise<ValidationResponse> {
    if (USE_MOCKS) return mockValidation();
    return get('/validation');
  },

  async getHistory(): Promise<DecisionRecord[]> {
    if (USE_MOCKS) return mockHistory();
    return get('/history');
  },

  async getDecisionById(id: string): Promise<DecisionRecord | undefined> {
    if (USE_MOCKS) return mockDecisionById(id);
    return get(`/history/${id}`);
  },
};
