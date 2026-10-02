/**
 * CLIMASCOPE — Engine Configuration
 * ===================================
 * All weights, thresholds, and consequence multipliers live here.
 * Nothing is hard-coded in components or scoring logic.
 */

/* ─── Audit Dimension Weights ───────────────────────────────── */

export const AUDIT_WEIGHTS: Record<string, number> = {
  freshness: 0.25,
  provenance: 0.15,
  completeness: 0.25,
  'spatial-fit': 0.20,
  'temporal-fit': 0.15,
};

/* ─── Consequence Multipliers ───────────────────────────────── */
// Higher consequence → score is divided by a larger number → harder to be "sufficient"

export const CONSEQUENCE_MULTIPLIERS: Record<string, number> = {
  low: 1.0,
  medium: 1.5,
  high: 2.0,
  critical: 3.0,
};

/* ─── Verdict Thresholds (on 0–100 scale) ───────────────────── */

export const VERDICT_THRESHOLDS = {
  sufficient: 70,    // >= 70 → SUFFICIENT
  needMore: 40,      // >= 40 and < 70 → NEED MORE EVIDENCE
  // < 40 → INSUFFICIENT
};

/* ─── Decision Relevance Defaults ───────────────────────────── */
// Base relevance by domain; can be overridden per-action in the future

export const DOMAIN_RELEVANCE: Record<string, number> = {
  flood: 0.95,
  heat: 0.90,
  drought: 0.85,
  agriculture: 0.80,
  water: 0.85,
  'smart-city': 0.75,
};

/* ─── Time Horizon Decay ────────────────────────────────────── */
// Beyond this many hours, forecast relevance starts decaying

export const TIME_HORIZON_DECAY_START_HOURS = 48;
export const TIME_HORIZON_DECAY_RATE = 0.02; // per hour beyond start

/* ─── Evidence Source Type Labels ────────────────────────────── */

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  'weather-api': 'Weather API',
  satellite: 'Satellite Imagery',
  gis: 'GIS / Geospatial',
  'historical-events': 'Historical Events',
  'forecast-model': 'Forecast Model',
  reports: 'Reports & Advisories',
};

/* ─── Domain Labels ─────────────────────────────────────────── */

export const DOMAIN_LABELS: Record<string, string> = {
  flood: 'Flood',
  heat: 'Heat',
  drought: 'Drought',
  agriculture: 'Agriculture',
  water: 'Water Resources',
  'smart-city': 'Smart City',
};

/* ─── Domain Icons (Lucide icon names) ──────────────────────── */

export const DOMAIN_ICONS: Record<string, string> = {
  flood: 'Waves',
  heat: 'Thermometer',
  drought: 'CloudOff',
  agriculture: 'Wheat',
  water: 'Droplets',
  'smart-city': 'Building2',
};

/* ─── Consequence Level Labels ──────────────────────────────── */

export const CONSEQUENCE_LABELS: Record<string, string> = {
  low: 'Low — Minor inconvenience if wrong',
  medium: 'Medium — Moderate impact, recoverable',
  high: 'High — Significant harm possible',
  critical: 'Critical — Lives or critical infrastructure at risk',
};
