/**
 * CLIMASCOPE — Mock Decision History
 * =====================================
 * ⚠ SIMULATED decision records for the History/Compare page.
 */

import type { DecisionRecord } from '../api/types';
import { getMockEvidencePanel } from './evidence';
import { getMockConsensus } from './consensus';
import { getMockMissingEvidence } from './verdict';

export const MOCK_DECISION_RECORDS: DecisionRecord[] = [
  {
    id: 'dec-001',
    request: {
      location: { lat: 19.076, lng: 72.8777, label: 'Mumbai, India' },
      domain: 'flood',
      action: 'Issue evacuation advisory for Zone A',
      timeHorizonHours: 48,
      consequenceLevel: 'critical',
    },
    verdict: {
      score: 58,
      verdict: 'NEED MORE EVIDENCE',
      explanation:
        '[SIMULATED] Evidence quality is moderate (0.76) and model agreement is fair (0.71), but the critical consequence level demands higher certainty. Key gaps: real-time radar and river gauge data would significantly improve confidence.',
      breakdown: {
        evidenceQuality: 0.76,
        modelAgreement: 0.71,
        decisionRelevance: 0.95,
        consequenceOfError: 3.0,
        rawScore: 0.51,
        normalizedScore: 58,
      },
      thresholds: { sufficient: 70, needMore: 40 },
    },
    evidence: getMockEvidencePanel(),
    consensus: getMockConsensus(),
    missingEvidence: getMockMissingEvidence(58),
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: 'dec-002',
    request: {
      location: { lat: 28.6139, lng: 77.209, label: 'Delhi, India' },
      domain: 'heat',
      action: 'Activate heat action plan — public cooling centers',
      timeHorizonHours: 72,
      consequenceLevel: 'high',
    },
    verdict: {
      score: 74,
      verdict: 'SUFFICIENT',
      explanation:
        '[SIMULATED] Strong model agreement on extreme heat (>45°C). Evidence freshness is excellent. At "high" consequence, the sufficiency threshold is 70, and the score of 74 clears it narrowly.',
      breakdown: {
        evidenceQuality: 0.82,
        modelAgreement: 0.88,
        decisionRelevance: 0.90,
        consequenceOfError: 2.0,
        rawScore: 0.65,
        normalizedScore: 74,
      },
      thresholds: { sufficient: 70, needMore: 40 },
    },
    evidence: getMockEvidencePanel(),
    consensus: getMockConsensus(),
    missingEvidence: getMockMissingEvidence(74),
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
  {
    id: 'dec-003',
    request: {
      location: { lat: 18.5204, lng: 73.8567, label: 'Pune, India' },
      domain: 'flood',
      action: 'Close low-lying underpasses',
      timeHorizonHours: 24,
      consequenceLevel: 'medium',
    },
    verdict: {
      score: 35,
      verdict: 'INSUFFICIENT',
      explanation:
        '[SIMULATED] Evidence is stale (satellite imagery 3 days old) and spatial resolution is insufficient for underpass-level decisions. Model disagreement is high.',
      breakdown: {
        evidenceQuality: 0.52,
        modelAgreement: 0.55,
        decisionRelevance: 0.85,
        consequenceOfError: 1.5,
        rawScore: 0.24,
        normalizedScore: 35,
      },
      thresholds: { sufficient: 70, needMore: 40 },
    },
    evidence: getMockEvidencePanel(),
    consensus: getMockConsensus(),
    missingEvidence: getMockMissingEvidence(35),
    createdAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
  },
];
