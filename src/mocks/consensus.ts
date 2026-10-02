/**
 * CLIMASCOPE — Mock Consensus Data
 * ==================================
 * ⚠ SIMULATED DATA — not real model outputs.
 */

import type { ConsensusResponse, ModelOutput } from '../api/types';

export const MOCK_MODEL_OUTPUTS: ModelOutput[] = [
  {
    modelId: 'ecmwf-ifs',
    modelName: 'ECMWF IFS',
    provider: 'ECMWF',
    value: 145,
    unit: 'mm/48h',
    confidenceLow: 95,
    confidenceHigh: 210,
    timestamp: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    modelId: 'gfs-ncep',
    modelName: 'GFS (NCEP)',
    provider: 'NOAA',
    value: 132,
    unit: 'mm/48h',
    confidenceLow: 80,
    confidenceHigh: 190,
    timestamp: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
  {
    modelId: 'icon-dwd',
    modelName: 'ICON',
    provider: 'DWD',
    value: 160,
    unit: 'mm/48h',
    confidenceLow: 110,
    confidenceHigh: 230,
    timestamp: new Date(Date.now() - 3.5 * 3600_000).toISOString(),
  },
  {
    modelId: 'gem-cmc',
    modelName: 'GEM',
    provider: 'CMC',
    value: 118,
    unit: 'mm/48h',
    confidenceLow: 70,
    confidenceHigh: 175,
    timestamp: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    modelId: 'metoffice-ukv',
    modelName: 'Met Office UKV',
    provider: 'Met Office',
    value: 155,
    unit: 'mm/48h',
    confidenceLow: 105,
    confidenceHigh: 215,
    timestamp: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
];

export function getMockConsensus(): ConsensusResponse {
  const values = MOCK_MODEL_OUTPUTS.map((m) => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const allLows = MOCK_MODEL_OUTPUTS.map((m) => m.confidenceLow);
  const allHighs = MOCK_MODEL_OUTPUTS.map((m) => m.confidenceHigh);
  const spread = Math.max(...values) - Math.min(...values);
  // Agreement score: inversely proportional to spread relative to mean
  const agreementScore = Math.max(0, Math.min(1, 1 - spread / mean));

  return {
    models: MOCK_MODEL_OUTPUTS,
    agreementScore: Math.round(agreementScore * 100) / 100,
    disagreementBand: {
      min: Math.min(...allLows),
      max: Math.max(...allHighs),
      unit: 'mm/48h',
    },
    calibrationIndicator: 0.78,
    calibrationStatus: 'illustrative',
    explanation:
      '[SIMULATED] Five models agree on heavy rainfall (118–160mm/48h). ' +
      `Spread of ${spread}mm gives agreement score of ${(agreementScore * 100).toFixed(0)}%. ` +
      'Disagreement is moderate — driven by ICON predicting a more intense core.',
  };
}
