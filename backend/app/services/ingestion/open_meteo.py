"""
CLIMASCOPE — Open-Meteo Weather & Ensemble Connector
======================================================
Connects to Open-Meteo's open public API for high-resolution
forecasts and ensemble model comparison. Free, no key required.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from .base import BaseConnector


class OpenMeteoConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="Open-Meteo Forecast & Ensembles",
            provider="Open-Meteo / ECMWF / DWD / NOAA",
            license_info="CC BY 4.0",
            resolution="Model-dependent grid, hourly",
        )
        self.endpoint = "https://api.open-meteo.com/v1/forecast"

    async def fetch(
        self,
        lat: float,
        lng: float,
        *,
        horizon_hours: int = 48,
        **kwargs,
    ) -> Dict[str, Any]:
        forecast_days = min(16, max(1, (horizon_hours + 23) // 24))
        cache_key = f"openmeteo_{round(lat, 3)}_{round(lng, 3)}_{forecast_days}"
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": "precipitation,precipitation_probability,temperature_2m,wind_speed_10m",
            "forecast_days": forecast_days,
            "timezone": "auto",
        }

        raw = await self._safe_http_get(self.endpoint, params=params, cache_key=cache_key)
        now_iso = datetime.now(timezone.utc).isoformat()

        if raw and "hourly" in raw:
            precip = raw["hourly"].get("precipitation", [])
            selected_precip = precip[:horizon_hours]
            total_precip = sum(selected_precip) if selected_precip else 0.0
            max_hourly = max(selected_precip) if selected_precip else 0.0
            summary = (
                f"Live forecast: {round(total_precip, 1)}mm precipitation "
                f"over the next {horizon_hours}h (peak {round(max_hourly, 1)}mm/hr)."
            )
            return {
                "status": "live",
                "source": "Open-Meteo Live API",
                "retrievedAt": now_iso,
                "dataTimestamp": now_iso,
                "totalPrecip": total_precip,
                "maxHourlyPrecip": max_hourly,
                "summary": summary,
                "raw": raw,
            }

        # Resilient fallback with explicit simulated tag
        return {
            "status": "simulated_fallback",
            "source": "Open-Meteo (Simulated Fallback)",
            "retrievedAt": now_iso,
            "dataTimestamp": now_iso,
            "totalPrecip": 142.5,
            "maxHourlyPrecip": 24.0,
            "summary": "[SIMULATED FALLBACK] Expected 120–160mm precipitation over next 48h, peak intensity 24mm/hr.",
            "raw": None,
        }
