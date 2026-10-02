/**
 * CLIMASCOPE — Mock Validation Data
 * ====================================
 * ⚠ SIMULATED historical cases for the Validation Dashboard.
 */

import type { HistoricalCase, RobustnessResult, ValidationResponse } from '../api/types';

export const MOCK_HISTORICAL_CASES: HistoricalCase[] = [
  {
    id: 'case-mumbai-2005',
    title: 'Mumbai Floods 2005',
    domain: 'flood',
    location: { lat: 19.076, lng: 72.8777, label: 'Mumbai, India' },
    date: '2005-07-26T00:00:00Z',
    actualOutcome: 'Catastrophic flooding — 944mm in 24h, 1,000+ deaths.',
    predictedVerdict: 'INSUFFICIENT',
    actualVerdictCorrect: true,
    sufficiencyScore: 28,
  },
  {
    id: 'case-chennai-2015',
    title: 'Chennai Floods 2015',
    domain: 'flood',
    location: { lat: 13.0827, lng: 80.2707, label: 'Chennai, India' },
    date: '2015-12-01T00:00:00Z',
    actualOutcome: 'Severe urban flooding — 490mm in 24h, major infrastructure damage.',
    predictedVerdict: 'NEED MORE EVIDENCE',
    actualVerdictCorrect: true,
    sufficiencyScore: 42,
  },
  {
    id: 'case-kerala-2018',
    title: 'Kerala Floods 2018',
    domain: 'flood',
    location: { lat: 10.8505, lng: 76.2711, label: 'Kerala, India' },
    date: '2018-08-15T00:00:00Z',
    actualOutcome: 'Worst flooding in century — reservoir overflows, 483 deaths.',
    predictedVerdict: 'INSUFFICIENT',
    actualVerdictCorrect: true,
    sufficiencyScore: 31,
  },
  {
    id: 'case-delhi-heat-2024',
    title: 'Delhi Heat Wave 2024',
    domain: 'heat',
    location: { lat: 28.6139, lng: 77.209, label: 'Delhi, India' },
    date: '2024-05-28T00:00:00Z',
    actualOutcome: 'Record 52.3°C. Multiple heat-related fatalities reported.',
    predictedVerdict: 'SUFFICIENT',
    actualVerdictCorrect: true,
    sufficiencyScore: 82,
  },
  {
    id: 'case-pune-flash-2024',
    title: 'Pune Flash Floods 2024',
    domain: 'flood',
    location: { lat: 18.5204, lng: 73.8567, label: 'Pune, India' },
    date: '2024-07-25T00:00:00Z',
    actualOutcome: 'Sudden flash flooding in low-lying areas. Moderate damage.',
    predictedVerdict: 'NEED MORE EVIDENCE',
    actualVerdictCorrect: false,
    sufficiencyScore: 55,
  },
  {
    id: 'case-rajasthan-drought-2023',
    title: 'Rajasthan Drought 2023',
    domain: 'drought',
    location: { lat: 26.9124, lng: 75.7873, label: 'Rajasthan, India' },
    date: '2023-06-01T00:00:00Z',
    actualOutcome: 'Prolonged dry spell. Crop failures across Barmer and Jaisalmer.',
    predictedVerdict: 'SUFFICIENT',
    actualVerdictCorrect: true,
    sufficiencyScore: 76,
  },
];

export const MOCK_ROBUSTNESS: RobustnessResult[] = [
  { caseId: 'case-mumbai-2005', removedSource: 'Open-Meteo Forecast', originalScore: 28, reducedScore: 18, verdictChanged: false },
  { caseId: 'case-mumbai-2005', removedSource: 'Sentinel-2 Imagery', originalScore: 28, reducedScore: 22, verdictChanged: false },
  { caseId: 'case-mumbai-2005', removedSource: 'ECMWF Ensemble', originalScore: 28, reducedScore: 15, verdictChanged: false },
  { caseId: 'case-chennai-2015', removedSource: 'Open-Meteo Forecast', originalScore: 42, reducedScore: 30, verdictChanged: true },
  { caseId: 'case-chennai-2015', removedSource: 'Historical Events', originalScore: 42, reducedScore: 35, verdictChanged: true },
  { caseId: 'case-delhi-heat-2024', removedSource: 'Open-Meteo Forecast', originalScore: 82, reducedScore: 62, verdictChanged: true },
  { caseId: 'case-delhi-heat-2024', removedSource: 'NASA POWER', originalScore: 82, reducedScore: 74, verdictChanged: false },
  { caseId: 'case-pune-flash-2024', removedSource: 'Open-Meteo Forecast', originalScore: 55, reducedScore: 38, verdictChanged: true },
  { caseId: 'case-pune-flash-2024', removedSource: 'OSM GIS', originalScore: 55, reducedScore: 48, verdictChanged: false },
];

export function getMockValidation(): ValidationResponse {
  const correctCount = MOCK_HISTORICAL_CASES.filter((c) => c.actualVerdictCorrect).length;
  const overallAccuracy = correctCount / MOCK_HISTORICAL_CASES.length;
  // False confidence: cases where verdict was SUFFICIENT but outcome was wrong
  const falsePositives = MOCK_HISTORICAL_CASES.filter(
    (c) => c.predictedVerdict === 'SUFFICIENT' && !c.actualVerdictCorrect
  ).length;
  const sufficientCases = MOCK_HISTORICAL_CASES.filter(
    (c) => c.predictedVerdict === 'SUFFICIENT'
  ).length;
  const falseConfidenceRate = sufficientCases > 0 ? falsePositives / sufficientCases : 0;

  return {
    cases: MOCK_HISTORICAL_CASES,
    robustness: MOCK_ROBUSTNESS,
    falseConfidenceRate,
    overallAccuracy,
    datasetNote:
      'SIMULATED SEED DATA: historical verdict labels are illustrative demo values, not a scientifically validated replay. Ablation scores are fixed demo examples, not computed from archived observations.',
  };
}
