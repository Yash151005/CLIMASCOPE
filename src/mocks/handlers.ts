/**
 * CLIMASCOPE — Mock API Handlers
 * =================================
 * Central mock layer that simulates backend responses.
 * Each function matches a backend endpoint 1:1.
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
} from '../api/types';
import { getMockEvidencePanel, MOCK_EVIDENCE_SOURCES } from './evidence';
import { getMockConsensus } from './consensus';
import { getMockMissingEvidence } from './verdict';
import { getMockValidation } from './validation';
import { MOCK_DECISION_RECORDS } from './history';
import { computeVerdict } from '../lib/scoring';

/** Simulate network latency */
function delay(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchEvidence(
  _decision: DecisionRequest,
  enabledIds?: string[]
): Promise<EvidencePanelResponse> {
  await delay(800);
  return getMockEvidencePanel(enabledIds);
}

export async function fetchConsensus(
  _decision: DecisionRequest
): Promise<ConsensusResponse> {
  await delay(600);
  return getMockConsensus();
}

export async function fetchVerdict(
  decision: DecisionRequest,
  enabledSourceIds?: string[]
): Promise<VerdictResponse> {
  await delay(400);
  const evidence = getMockEvidencePanel(enabledSourceIds);
  const consensus = getMockConsensus();
  return computeVerdict(evidence.sources, consensus, decision);
}

export async function fetchMissingEvidence(
  decision: DecisionRequest,
  enabledSourceIds?: string[]
): Promise<MissingEvidenceResponse> {
  await delay(300);
  const evidence = getMockEvidencePanel(enabledSourceIds);
  const consensus = getMockConsensus();
  const verdict = computeVerdict(evidence.sources, consensus, decision);
  return getMockMissingEvidence(verdict.score);
}

export async function fetchWhatIf(req: WhatIfRequest): Promise<WhatIfResponse> {
  await delay(200); // What-If should feel instant
  const evidence = getMockEvidencePanel(req.enabledSourceIds);
  const consensus = getMockConsensus();
  const verdict = computeVerdict(evidence.sources, consensus, req.decision);
  const missingEvidence = getMockMissingEvidence(verdict.score);
  return { verdict, evidence, consensus, missingEvidence };
}

export async function fetchValidation(): Promise<ValidationResponse> {
  await delay(700);
  return getMockValidation();
}

export async function fetchHistory(): Promise<DecisionRecord[]> {
  await delay(500);
  return MOCK_DECISION_RECORDS;
}

export async function fetchDecisionById(
  id: string
): Promise<DecisionRecord | undefined> {
  await delay(300);
  return MOCK_DECISION_RECORDS.find((d) => d.id === id);
}
