/**
 * CLIMASCOPE — Typed API Contract
 * ================================
 * These types define the exact shape of every request and response
 * between frontend and backend. The mock layer and real API both
 * conform to this contract.
 */

/* ─── Enums & Literals ──────────────────────────────────────── */

export type DecisionDomain =
  | 'flood'
  | 'heat'
  | 'drought'
  | 'agriculture'
  | 'water'
  | 'smart-city';

export type ConsequenceLevel = 'low' | 'medium' | 'high' | 'critical';

export type VerdictLabel = 'SUFFICIENT' | 'INSUFFICIENT' | 'NEED MORE EVIDENCE';

export type EvidenceSourceType =
  | 'weather-api'
  | 'satellite'
  | 'gis'
  | 'historical-events'
  | 'forecast-model'
  | 'reports';

export type AuditDimension =
  | 'freshness'
  | 'provenance'
  | 'completeness'
  | 'spatial-fit'
  | 'temporal-fit';

/* ─── Geolocation ───────────────────────────────────────────── */

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string; // human-readable place name
}

/* ─── Decision Request ──────────────────────────────────────── */

export interface DecisionRequest {
  location: GeoLocation;
  domain: DecisionDomain;
  action: string; // e.g. "issue evacuation advisory"
  timeHorizonHours: number;
  consequenceLevel: ConsequenceLevel;
}

/* ─── Evidence ──────────────────────────────────────────────── */

export interface AuditScore {
  dimension: AuditDimension;
  score: number; // 0–1
  explanation: string;
  weight?: number; // Configured contribution to overall evidence quality
}

export interface EvidenceSource {
  id: string;
  type: EvidenceSourceType;
  name: string; // e.g. "Open-Meteo Forecast"
  provider: string; // e.g. "Open-Meteo"
  description: string;
  retrievedAt: string; // ISO 8601
  dataTimestamp: string; // ISO 8601 — when the data itself was produced
  license: string;
  resolution: string; // e.g. "1km grid, hourly"
  auditScores: AuditScore[];
  overallQuality: number; // 0–1, weighted mean of audit scores
  enabled: boolean; // user can toggle on/off
  rawSummary: string; // brief textual summary of what this source says
}

export interface EvidencePanelResponse {
  sources: EvidenceSource[];
  aggregateQuality: number; // 0–1
}

/* ─── Consensus & Uncertainty ───────────────────────────────── */

export interface ModelOutput {
  modelId: string;
  modelName: string;
  provider: string;
  value: number; // primary predicted value (e.g. mm rainfall)
  unit: string;
  confidenceLow: number;
  confidenceHigh: number;
  timestamp: string; // ISO 8601
}

export interface ConsensusResponse {
  models: ModelOutput[];
  agreementScore: number; // 0–1
  disagreementBand: {
    min: number;
    max: number;
    unit: string;
  };
  calibrationIndicator: number; // 0–1, how well-calibrated the ensemble is
  calibrationStatus: 'available' | 'unavailable' | 'illustrative';
  explanation: string;
}

/* ─── Verdict ───────────────────────────────────────────────── */

export interface FormulaBreakdown {
  evidenceQuality: number; // 0–1
  modelAgreement: number; // 0–1
  decisionRelevance: number; // 0–1
  consequenceOfError: number; // multiplier
  rawScore: number; // before normalisation
  normalizedScore: number; // 0–100
}

export interface VerdictResponse {
  score: number; // 0–100
  verdict: VerdictLabel;
  explanation: string; // plain-language
  breakdown: FormulaBreakdown;
  thresholds: {
    sufficient: number;
    needMore: number;
  };
}

/* ─── Missing Evidence ──────────────────────────────────────── */

export interface MissingEvidenceItem {
  id: string;
  sourceType: EvidenceSourceType;
  name: string;
  description: string;
  estimatedScoreGain: number; // how many points it would add
  feasibility: 'easy' | 'moderate' | 'hard';
  acquisitionHint: string; // e.g. "available via NASA POWER API"
}

export interface MissingEvidenceResponse {
  items: MissingEvidenceItem[];
  currentScore: number;
  potentialScore: number; // if all missing items were added
  estimateNote: string;
}

/* ─── What-If ───────────────────────────────────────────────── */

export interface WhatIfRequest {
  decision: DecisionRequest;
  enabledSourceIds: string[];
}

export interface WhatIfResponse {
  verdict: VerdictResponse;
  evidence: EvidencePanelResponse;
  consensus: ConsensusResponse;
  missingEvidence: MissingEvidenceResponse;
}

/* ─── Validation Dashboard ──────────────────────────────────── */

export interface HistoricalCase {
  id: string;
  title: string;
  domain: DecisionDomain;
  location: GeoLocation;
  date: string; // ISO 8601
  actualOutcome: string;
  predictedVerdict: VerdictLabel;
  actualVerdictCorrect: boolean;
  sufficiencyScore: number;
}

export interface RobustnessResult {
  caseId: string;
  removedSource: string;
  originalScore: number;
  reducedScore: number;
  verdictChanged: boolean;
}

export interface ValidationResponse {
  cases: HistoricalCase[];
  robustness: RobustnessResult[];
  falseConfidenceRate: number; // 0–1
  overallAccuracy: number; // 0–1
  datasetNote: string;
}

/* ─── History & Compare ─────────────────────────────────────── */

export interface DecisionRecord {
  id: string;
  recordType?: 'seed-demo' | 'user-audit';
  request: DecisionRequest;
  verdict: VerdictResponse;
  evidence: EvidencePanelResponse;
  consensus: ConsensusResponse;
  missingEvidence: MissingEvidenceResponse;
  createdAt: string; // ISO 8601
}

export interface CompareResponse {
  left: DecisionRecord;
  right: DecisionRecord;
  differences: {
    scoreDelta: number;
    verdictChanged: boolean;
    changedDimensions: AuditDimension[];
  };
}
