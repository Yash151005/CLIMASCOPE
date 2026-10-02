"""
CLIMASCOPE — Ingestion Service Registry
=========================================
Orchestrates live connectors and synthesizes structured EvidenceSource objects
with full provenance, licensing, spatial/temporal metadata, and audit records.
"""

import asyncio
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from ...config import settings
from ...schemas.common import EvidenceSourceType, AuditDimension
from ...schemas.evidence import EvidenceSource, AuditScore, EvidencePanelResponse
from ...schemas.decision import DecisionRequest
from .open_meteo import OpenMeteoConnector
from .nasa_power import NasaPowerConnector
from .osm_gis import OsmGisConnector
from .model_forecast import OpenMeteoModelConnector


class IngestionService:
    def __init__(self):
        self.open_meteo = OpenMeteoConnector()
        self.nasa_power = NasaPowerConnector()
        self.osm_gis = OsmGisConnector()
        self.model_forecast = OpenMeteoModelConnector()

    async def ingest_evidence(
        self, decision: DecisionRequest, enabled_ids: Optional[List[str]] = None
    ) -> List[EvidenceSource]:
        lat = decision.location.lat
        lng = decision.location.lng
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        # Ingest from public connectors
        om_data, nasa_data, osm_data, model_data = await asyncio.gather(
            self.open_meteo.fetch(
                lat, lng, horizon_hours=decision.timeHorizonHours
            ),
            self.nasa_power.fetch(lat, lng),
            self.osm_gis.fetch(lat, lng),
            self.model_forecast.fetch(
                lat,
                lng,
                domain=decision.domain,
                horizon_hours=decision.timeHorizonHours,
            ),
        )

        sources: List[EvidenceSource] = []

        # 1. Open-Meteo Weather Forecast
        sources.append(
            EvidenceSource(
                id="src-openmeteo-forecast",
                type=EvidenceSourceType.WEATHER_API,
                name="Open-Meteo High-Res Forecast",
                provider="Open-Meteo (default model selection)",
                description="Hourly precipitation, temperature, and wind forecast for the target location.",
                retrievedAt=om_data.get("retrievedAt", now_iso),
                dataTimestamp=om_data.get("dataTimestamp", now_iso),
                license="CC BY 4.0",
                resolution="Model-dependent grid, hourly",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.92,
                        explanation="Data retrieved within past 2 hours; latency well within acceptable window.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.88,
                        explanation="Derived from operational ECMWF IFS and GFS blends; verifiable chain.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.90,
                        explanation="All key hydrological variables (precipitation, humidity, wind) present.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.90,
                        explanation="1 km grid adequately captures municipal decision perimeter.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.95,
                        explanation=f"Hourly resolution tightly matches {decision.timeHorizonHours}h action horizon.",
                    ),
                ],
                overallQuality=0.91,
                enabled=True,
                rawSummary=om_data.get("summary", "[UNAVAILABLE] No weather forecast returned."),
            )
        )

        # 2. NASA POWER Climatology
        sources.append(
            EvidenceSource(
                id="src-nasa-power",
                type=EvidenceSourceType.WEATHER_API,
                name="NASA POWER Climatology Baseline",
                provider="NASA Langley Research Center",
                description="Long-term regional solar, temperature, and precipitation baseline.",
                retrievedAt=nasa_data.get("retrievedAt", now_iso),
                dataTimestamp=nasa_data.get("dataTimestamp", now_iso),
                license="Open Data (NASA)",
                resolution="0.5° grid, daily",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.68,
                        explanation="Climatological baseline updated daily; reflects 48h latency.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.96,
                        explanation="Curated NASA mission dataset with comprehensive peer-reviewed documentation.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.72,
                        explanation="Supplies anomaly baselines but lacks micro-scale convective event data.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.55,
                        explanation="0.5° (~55km) resolution is coarse for localized municipal actions.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.62,
                        explanation="Daily resolution cannot resolve flash-flood hydrographs.",
                    ),
                ],
                overallQuality=0.70,
                enabled=True,
                rawSummary=nasa_data.get("summary", "Antecedent soil moisture 38% above normal."),
            )
        )

        # 3. Sentinel-2 Optical / SAR Imagery Metadata
        sources.append(
            EvidenceSource(
                id="src-sentinel-imagery",
                type=EvidenceSourceType.SATELLITE,
                name="Satellite Imagery (not connected)",
                provider="No satellite feed configured",
                description="Satellite imagery connector is not configured; no observation is supplied.",
                retrievedAt=now_iso,
                dataTimestamp=(now - timedelta(days=2)).isoformat(),
                license="CC BY-SA 3.0 IGO",
                resolution="10m pixel, 5-day revisit",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.52,
                        explanation="Latest satellite overpass occurred 48h ago; moisture may have evolved.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.95,
                        explanation="European Space Agency operational constellation with full radiometric calibration.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.65,
                        explanation="Cloud cover estimated at 28%, partially obstructing optical channels.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.94,
                        explanation="10m optical/SAR resolution resolves ward-level terrain and embankments.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.45,
                        explanation="5-day revisit cadence is too slow for dynamic flood progression.",
                    ),
                ],
                overallQuality=0.68,
                enabled=True,
                rawSummary="[SIMULATED PLACEHOLDER] No Sentinel/Landsat scene was queried.",
            )
        )

        # 4. OpenStreetMap Infrastructure GIS
        sources.append(
            EvidenceSource(
                id="src-osm-gis",
                type=EvidenceSourceType.GIS,
                name="OpenStreetMap Urban Drainage & Assets",
                provider="OpenStreetMap Contributors",
                description="Road network, building footprints, emergency facilities, and stormwater canals.",
                retrievedAt=osm_data.get("retrievedAt", now_iso),
                dataTimestamp=osm_data.get("dataTimestamp", now_iso),
                license="ODbL",
                resolution="Vector (sub-meter)",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.82,
                        explanation="Community updates active within past 30 days; infrastructure static.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.74,
                        explanation="Crowdsourced GIS data; road network validated, subterranean drains partially unmapped.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.76,
                        explanation="Urban roads and critical buildings mapped; secondary culverts incomplete.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.96,
                        explanation="Building-level vector geometry precisely matches municipal jurisdiction.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.86,
                        explanation="Topological asset layers are temporally invariant over decision horizons.",
                    ),
                ],
                overallQuality=0.82,
                enabled=True,
                rawSummary=osm_data.get("summary", "Vector network mapped in AOI."),
            )
        )

        # 5. Historical Disaster Replay Catalog
        sources.append(
            EvidenceSource(
                id="src-historical-catalog",
                type=EvidenceSourceType.HISTORICAL_EVENTS,
                name="Seeded historical case catalog",
                provider="CLIMASCOPE demo seed data",
                description="Illustrative demo records only; not a validated climatology or forecast source.",
                retrievedAt=now_iso,
                dataTimestamp="2026-01-01T00:00:00Z",
                license="Mixed; verify case-level citations before reuse",
                resolution="City/event-level demo records",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.55,
                        explanation="Catalog represents historical archive; not real-time.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.84,
                        explanation="Seeded demo records have not been independently validated.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.88,
                        explanation="Small illustrative dataset; does not represent a complete event record.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.72,
                        explanation="Municipal level; some historical events lack street-level granularity.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.78,
                        explanation="Historical analogue establishes probability baseline for current event.",
                    ),
                ],
                overallQuality=0.75,
                enabled=True,
                rawSummary="[SIMULATED SEED DATA] Example case records only; no return period is inferred.",
            )
        )

        # 6. ECMWF IFS Global Ensemble Forecast
        sources.append(
            EvidenceSource(
                id="src-ecmwf-ensemble",
                type=EvidenceSourceType.FORECAST_MODEL,
                name="Open-Meteo multi-model forecast comparison",
                provider=(
                    "Open-Meteo multi-model API"
                    if model_data.get("status") == "live"
                    else "No live model comparison available"
                ),
                description="Model-specific hourly forecast data; see Consensus for model spread.",
                retrievedAt=now_iso,
                dataTimestamp=now_iso,
                license="CC BY 4.0",
                resolution="Model-dependent, hourly",
                auditScores=[
                    AuditScore(
                        dimension=AuditDimension.FRESHNESS,
                        score=0.90,
                        explanation="Availability and model run timestamps depend on live API response.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.PROVENANCE,
                        score=0.97,
                        explanation="The data is attributed to Open-Meteo and its listed model providers.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.COMPLETENESS,
                        score=0.94,
                        explanation="Agreement is only assessed when at least two separate model outputs are available.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.SPATIAL_FIT,
                        score=0.78,
                        explanation="Model grid varies by provider; verify resolution before local operational use.",
                    ),
                    AuditScore(
                        dimension=AuditDimension.TEMPORAL_FIT,
                        score=0.88,
                        explanation=f"Hourly data is compared over the requested {decision.timeHorizonHours}h horizon.",
                    ),
                ],
                overallQuality=0.89,
                enabled=True,
                rawSummary=(
                    f"{len(model_data.get('models', []))} live model output(s) are available."
                    if model_data.get("status") == "live"
                    else "[SIMULATED FALLBACK] Live model-specific forecast data unavailable."
                ),
            )
        )

        # Unsupported optional feeds remain visible but are never represented as observations.
        sources.append(
            EvidenceSource(
                id="src-reports",
                type=EvidenceSourceType.REPORTS,
                name="Official reports and advisories",
                provider="No report connector configured",
                description="No government bulletin feed is configured in this build.",
                retrievedAt=now_iso,
                dataTimestamp=now_iso,
                license="Not applicable",
                resolution="Not available",
                auditScores=[
                    AuditScore(dimension=dimension, score=0.0, explanation="No report feed is connected.")
                    for dimension in AuditDimension
                ],
                overallQuality=0.0,
                enabled=True,
                rawSummary="[UNAVAILABLE] No external reports were queried.",
            )
        )

        # Apply user enable/disable toggles if specified
        source_inputs = {
            "src-openmeteo-forecast": om_data,
            "src-nasa-power": nasa_data,
            "src-osm-gis": osm_data,
            "src-ecmwf-ensemble": model_data,
        }
        simulated_ids = {
            source_id
            for source_id, result in source_inputs.items()
            if result.get("status") != "live"
        } | {"src-sentinel-imagery", "src-historical-catalog"}

        for source in sources:
            source.auditScores = _contextual_audit_scores(
                source,
                source_inputs.get(source.id, {}),
                decision.timeHorizonHours,
                now,
            )
            if source.id in simulated_ids:
                source.auditScores = [
                    score.model_copy(
                        update={
                            "score": round(score.score * 0.35, 2),
                            "explanation": (
                                "[SIMULATED / UNVERIFIED INPUT; discounted] "
                                + score.explanation
                            ),
                        }
                    )
                    for score in source.auditScores
                ]
                source.rawSummary = "[SIMULATED / UNVERIFIED] " + source.rawSummary

        if enabled_ids is not None:
            for s in sources:
                s.enabled = s.id in enabled_ids

        return sources


def _contextual_audit_scores(
    source: EvidenceSource,
    source_data: dict,
    horizon_hours: int,
    now: datetime,
) -> list[AuditScore]:
    """Recalculate auditable dimensions from observed metadata and requested horizon."""
    raw = source_data.get("raw")
    live = source_data.get("status") == "live"
    raw_scores: dict[AuditDimension, tuple[float, str]] = {}

    try:
        timestamp = datetime.fromisoformat(source.dataTimestamp.replace("Z", "+00:00"))
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        age_hours = max(0.0, (now - timestamp.astimezone(timezone.utc)).total_seconds() / 3600)
        max_age = settings.FRESHNESS_MAX_AGE_HOURS.get(source.id, 24.0)
        freshness = math.exp(-age_hours / max(max_age, 1.0))
        freshness_explanation = (
            f"Data timestamp is {age_hours:.1f} hours old; configured freshness "
            f"reference is {max_age:g} hours."
        )
    except (TypeError, ValueError):
        freshness = 0.0
        freshness_explanation = "Source data timestamp is missing or invalid."
    raw_scores[AuditDimension.FRESHNESS] = (freshness, freshness_explanation)

    if source.id == "src-openmeteo-forecast":
        hourly = raw.get("hourly", {}) if isinstance(raw, dict) else {}
        expected = ("precipitation", "temperature_2m", "wind_speed_10m")
        available = sum(
            1 for key in expected if isinstance(hourly.get(key), list) and hourly[key]
        )
        completeness = available / len(expected) if live else 0.0
        completeness_explanation = (
            f"{available} of {len(expected)} requested hourly variable arrays are present."
        )
    elif source.id == "src-nasa-power":
        parameters = (
            raw.get("properties", {}).get("parameter", {})
            if isinstance(raw, dict)
            else {}
        )
        expected = ("PRECTOTCORR", "T2M")
        available = sum(
            1 for key in expected if isinstance(parameters.get(key), dict) and parameters[key]
        )
        completeness = available / len(expected) if live else 0.0
        completeness_explanation = (
            f"{available} of {len(expected)} requested NASA POWER parameters are present."
        )
    elif source.id == "src-osm-gis":
        completeness = 0.6 if live and isinstance(raw, dict) else 0.0
        completeness_explanation = (
            "The query covers waterways and hospitals only; drainage, elevation, "
            "and jurisdictional completeness were not established."
        )
    elif source.id == "src-ecmwf-ensemble":
        count = len(source_data.get("models", [])) if live else 0
        completeness = count / len(OpenMeteoModelConnector.MODEL_IDS)
        completeness_explanation = (
            f"{count} of {len(OpenMeteoModelConnector.MODEL_IDS)} configured model "
            "outputs were returned."
        )
    elif source.id == "src-historical-catalog":
        completeness = 0.25
        completeness_explanation = "The small seeded catalog is illustrative and incomplete."
    else:
        completeness = 0.0
        completeness_explanation = "No source observation or data payload is available."
    raw_scores[AuditDimension.COMPLETENESS] = (
        completeness,
        completeness_explanation,
    )

    if source.id == "src-openmeteo-forecast":
        temporal_fit = min(1.0, (16 * 24) / max(horizon_hours, 1))
        temporal_explanation = (
            f"Hourly forecast horizon covers up to 384 hours; requested horizon is "
            f"{horizon_hours} hours."
        )
    elif source.id == "src-nasa-power":
        temporal_fit = min(1.0, max(horizon_hours, 1) / 24)
        temporal_explanation = (
            f"Daily observation cadence compared with the {horizon_hours}-hour decision horizon."
        )
    elif source.id == "src-sentinel-imagery":
        temporal_fit = min(1.0, max(horizon_hours, 1) / 120)
        temporal_explanation = "Nominal five-day revisit interval; no scene was queried."
    elif source.id == "src-osm-gis":
        temporal_fit = 0.85
        temporal_explanation = "Infrastructure features are relatively static; update cadence is unknown."
    elif source.id == "src-historical-catalog":
        temporal_fit = 0.5
        temporal_explanation = "Historical cases provide context, not a current event forecast."
    else:
        temporal_fit = 0.0
        temporal_explanation = "No current temporal evidence is available."
    raw_scores[AuditDimension.TEMPORAL_FIT] = (
        temporal_fit,
        temporal_explanation,
    )

    if source.id == "src-osm-gis" and live:
        spatial_fit, spatial_explanation = (
            0.65,
            "A point-centered query area was used; no target-area polygon was supplied.",
        )
    elif source.id == "src-historical-catalog":
        spatial_fit, spatial_explanation = (
            0.35,
            "Seed cases are city-level examples and do not resolve a target-area boundary.",
        )
    else:
        spatial_fit, spatial_explanation = (
            0.5,
            "The request supplies a point, not an area-of-interest polygon; resolution fit is unverified.",
        )
    raw_scores[AuditDimension.SPATIAL_FIT] = (spatial_fit, spatial_explanation)

    for dimension in (AuditDimension.PROVENANCE,):
        existing = next(
            (score for score in source.auditScores if score.dimension == dimension),
            None,
        )
        if source.id == "src-reports":
            value, explanation = 0.0, "No report provider or license is configured."
        elif source.id in {"src-sentinel-imagery", "src-historical-catalog"}:
            value, explanation = 0.25, "Demo metadata is not an independently verified provenance chain."
        elif live and existing:
            value = existing.score
            explanation = (
                f"Provider: {source.provider}; license: {source.license}. "
                "The source identifies its provider, but this prototype does not independently audit it."
            )
        else:
            value, explanation = 0.0, "No live source response was available to verify provenance."
        raw_scores[dimension] = (value, explanation)

    return [
        AuditScore(
            dimension=dimension,
            score=round(max(0.0, min(1.0, value)), 3),
            explanation=explanation,
            weight=settings.AUDIT_WEIGHTS[dimension.value],
        )
        for dimension, (value, explanation) in raw_scores.items()
    ]
