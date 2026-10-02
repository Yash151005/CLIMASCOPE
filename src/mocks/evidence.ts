/**
 * CLIMASCOPE — Mock Evidence Data
 * =================================
 * ⚠ SIMULATED DATA — clearly labeled, not real observations.
 */

import type { EvidenceSource, EvidencePanelResponse } from '../api/types';

/** Mock evidence sources for a flood scenario in Mumbai */
export const MOCK_EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    id: 'src-openmeteo-forecast',
    type: 'weather-api',
    name: 'Open-Meteo 7-Day Forecast',
    provider: 'Open-Meteo',
    description: 'Hourly precipitation, temperature, and wind forecast for the target location.',
    retrievedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    dataTimestamp: new Date(Date.now() - 1 * 3600_000).toISOString(),
    license: 'CC BY 4.0',
    resolution: '1 km grid, hourly',
    auditScores: [
      { dimension: 'freshness', score: 0.92, explanation: 'Data retrieved 2 hours ago, well within freshness window.' },
      { dimension: 'provenance', score: 0.85, explanation: 'Open-Meteo aggregates ECMWF/GFS models; provenance chain is documented.' },
      { dimension: 'completeness', score: 0.88, explanation: 'All key variables (precip, temp, wind, humidity) present.' },
      { dimension: 'spatial-fit', score: 0.90, explanation: '1 km resolution covers the decision area adequately.' },
      { dimension: 'temporal-fit', score: 0.95, explanation: 'Hourly granularity matches 48-hour decision horizon.' },
    ],
    overallQuality: 0.90,
    enabled: true,
    rawSummary: '[SIMULATED] Heavy rainfall expected: 120–180mm over 48h, peak intensity 25mm/hr at T+18h.',
  },
  {
    id: 'src-nasa-power',
    type: 'weather-api',
    name: 'NASA POWER Climatology',
    provider: 'NASA',
    description: 'Historical climate averages and anomalies for the region.',
    retrievedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    dataTimestamp: '2026-09-30T00:00:00Z',
    license: 'Open Data',
    resolution: '0.5° grid, daily',
    auditScores: [
      { dimension: 'freshness', score: 0.65, explanation: 'Monthly climatology updated daily; 6h since retrieval.' },
      { dimension: 'provenance', score: 0.95, explanation: 'NASA-curated dataset with full methodology documentation.' },
      { dimension: 'completeness', score: 0.70, explanation: 'Provides averages but lacks extreme event statistics.' },
      { dimension: 'spatial-fit', score: 0.55, explanation: '0.5° resolution (~55km) is coarse for city-level decisions.' },
      { dimension: 'temporal-fit', score: 0.60, explanation: 'Daily averages do not capture sub-daily flood dynamics.' },
    ],
    overallQuality: 0.67,
    enabled: true,
    rawSummary: '[SIMULATED] October climatology: avg. 95mm/month. Current month 40% above normal.',
  },
  {
    id: 'src-sentinel-imagery',
    type: 'satellite',
    name: 'Sentinel-2 Latest Pass',
    provider: 'Copernicus / ESA',
    description: 'Most recent cloud-free optical imagery for land cover and flood extent.',
    retrievedAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
    dataTimestamp: '2026-09-29T10:30:00Z',
    license: 'Open Access',
    resolution: '10m, 5-day revisit',
    auditScores: [
      { dimension: 'freshness', score: 0.45, explanation: 'Last pass was 3 days ago; flood conditions may have changed.' },
      { dimension: 'provenance', score: 0.95, explanation: 'ESA Sentinel programme, well-documented processing chain.' },
      { dimension: 'completeness', score: 0.60, explanation: 'Partial cloud cover (35%) obscures parts of the area of interest.' },
      { dimension: 'spatial-fit', score: 0.92, explanation: '10m resolution is excellent for urban flood mapping.' },
      { dimension: 'temporal-fit', score: 0.40, explanation: '5-day revisit is too infrequent for real-time flood monitoring.' },
    ],
    overallQuality: 0.62,
    enabled: true,
    rawSummary: '[SIMULATED] Pre-event imagery shows saturated soil in low-lying areas. No active flood visible.',
  },
  {
    id: 'src-osm-gis',
    type: 'gis',
    name: 'OpenStreetMap Infrastructure',
    provider: 'OpenStreetMap',
    description: 'Road network, building footprints, drainage systems, and elevation data.',
    retrievedAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
    dataTimestamp: '2026-09-28T00:00:00Z',
    license: 'ODbL',
    resolution: 'Vector, building-level',
    auditScores: [
      { dimension: 'freshness', score: 0.80, explanation: 'OSM data is community-maintained; core infrastructure rarely changes.' },
      { dimension: 'provenance', score: 0.70, explanation: 'Crowdsourced; quality varies by region. Mumbai is well-mapped.' },
      { dimension: 'completeness', score: 0.75, explanation: 'Good road/building coverage. Drainage data is incomplete.' },
      { dimension: 'spatial-fit', score: 0.95, explanation: 'Building-level detail perfectly fits local decision-making.' },
      { dimension: 'temporal-fit', score: 0.85, explanation: 'Static infrastructure data is not time-sensitive.' },
    ],
    overallQuality: 0.81,
    enabled: true,
    rawSummary: '[SIMULATED] 12,400 buildings, 340km road network, 45 drainage outfalls mapped in AOI.',
  },
  {
    id: 'src-historical-floods',
    type: 'historical-events',
    name: 'Historical Flood Events (2005–2025)',
    provider: 'CLIMASCOPE Historical DB',
    description: 'Catalog of past flood events with severity, extent, and impact data.',
    retrievedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    dataTimestamp: '2026-01-01T00:00:00Z',
    license: 'Public Domain',
    resolution: 'Event-level, city-wide',
    auditScores: [
      { dimension: 'freshness', score: 0.50, explanation: 'Historical data is inherently not "fresh" but provides context.' },
      { dimension: 'provenance', score: 0.80, explanation: 'Compiled from government disaster reports and news archives.' },
      { dimension: 'completeness', score: 0.85, explanation: 'Major events well-documented; minor events may be missing.' },
      { dimension: 'spatial-fit', score: 0.70, explanation: 'City-wide granularity; some events lack ward-level detail.' },
      { dimension: 'temporal-fit', score: 0.75, explanation: '20-year record provides good climatological context.' },
    ],
    overallQuality: 0.71,
    enabled: true,
    rawSummary: '[SIMULATED] 8 major floods in 20 years. 2005 event: 944mm in 24h. Avg recurrence: 2.5yr for >100mm/day.',
  },
  {
    id: 'src-ecmwf-forecast',
    type: 'forecast-model',
    name: 'ECMWF IFS Ensemble',
    provider: 'ECMWF (via Open-Meteo)',
    description: '51-member ensemble forecast providing probabilistic precipitation estimates.',
    retrievedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    dataTimestamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
    license: 'CC BY 4.0',
    resolution: '9 km grid, 6-hourly',
    auditScores: [
      { dimension: 'freshness', score: 0.88, explanation: 'Latest model run from 3 hours ago.' },
      { dimension: 'provenance', score: 0.95, explanation: 'ECMWF is the gold standard for medium-range weather prediction.' },
      { dimension: 'completeness', score: 0.92, explanation: 'Full ensemble with spread quantifies forecast uncertainty.' },
      { dimension: 'spatial-fit', score: 0.75, explanation: '9 km resolution captures synoptic patterns; misses local effects.' },
      { dimension: 'temporal-fit', score: 0.85, explanation: '6-hourly output covers 48h horizon well.' },
    ],
    overallQuality: 0.87,
    enabled: true,
    rawSummary: '[SIMULATED] Ensemble mean: 145mm/48h. 10th–90th percentile: 85–210mm. P(>150mm) = 62%.',
  },
];

/** Aggregate evidence panel response */
export function getMockEvidencePanel(enabledIds?: string[]): EvidencePanelResponse {
  const sources = MOCK_EVIDENCE_SOURCES.map((s) => ({
    ...s,
    enabled: enabledIds ? enabledIds.includes(s.id) : s.enabled,
  }));

  const enabled = sources.filter((s) => s.enabled);
  const aggregateQuality =
    enabled.length > 0
      ? enabled.reduce((sum, s) => sum + s.overallQuality, 0) / enabled.length
      : 0;

  return { sources, aggregateQuality };
}
