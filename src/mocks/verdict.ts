/**
 * CLIMASCOPE — Mock Verdict & Missing Evidence
 * ===============================================
 * ⚠ SIMULATED DATA — computed from mock inputs.
 */

import type { MissingEvidenceItem, MissingEvidenceResponse } from '../api/types';

export const MOCK_MISSING_EVIDENCE: MissingEvidenceItem[] = [
  {
    id: 'missing-radar',
    sourceType: 'weather-api',
    name: 'Real-Time Doppler Radar',
    description: 'Live radar imagery showing current precipitation cells and movement vectors.',
    estimatedScoreGain: 8,
    feasibility: 'easy',
    acquisitionHint: 'Available via national meteorological service API (e.g., IMD radar feed).',
  },
  {
    id: 'missing-river-gauge',
    sourceType: 'gis',
    name: 'River Gauge Water Levels',
    description: 'Real-time water level and discharge readings from upstream gauging stations.',
    estimatedScoreGain: 12,
    feasibility: 'moderate',
    acquisitionHint: 'Central Water Commission publishes hourly readings for major rivers.',
  },
  {
    id: 'missing-soil-moisture',
    sourceType: 'satellite',
    name: 'Soil Moisture (SMAP/SMOS)',
    description: 'Current soil moisture saturation levels indicating runoff potential.',
    estimatedScoreGain: 6,
    feasibility: 'moderate',
    acquisitionHint: 'NASA SMAP L3 data available with 1–2 day latency via Earthdata.',
  },
  {
    id: 'missing-urban-drainage',
    sourceType: 'gis',
    name: 'Urban Drainage Capacity Model',
    description: 'Storm drain network capacity and current utilization.',
    estimatedScoreGain: 10,
    feasibility: 'hard',
    acquisitionHint: 'Requires municipal engineering data; often not publicly available.',
  },
  {
    id: 'missing-crowdsource',
    sourceType: 'reports',
    name: 'Crowdsourced Flood Reports',
    description: 'Real-time community-reported flooding locations and severity.',
    estimatedScoreGain: 5,
    feasibility: 'easy',
    acquisitionHint: 'Platforms like Ushahidi or local 311 systems may provide this data.',
  },
];

export function getMockMissingEvidence(currentScore: number): MissingEvidenceResponse {
  const sorted = [...MOCK_MISSING_EVIDENCE].sort(
    (a, b) => b.estimatedScoreGain - a.estimatedScoreGain
  );
  const totalGain = sorted.reduce((sum, item) => sum + item.estimatedScoreGain, 0);
  return {
    items: sorted,
    currentScore,
    potentialScore: Math.min(100, currentScore + totalGain),
    estimateNote:
      'SIMULATED: mock score gains are illustrative placeholders and are not measured or guaranteed.',
  };
}
