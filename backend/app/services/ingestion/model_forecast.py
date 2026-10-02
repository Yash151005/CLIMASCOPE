"""Fetch model-separated Open-Meteo forecasts for a consensus comparison."""

from datetime import datetime, timezone
from typing import Any

from .base import BaseConnector
from ...schemas.common import DecisionDomain


class OpenMeteoModelConnector(BaseConnector):
    MODEL_IDS = {
        "ecmwf_ifs025": ("ecmwf-ifs", "ECMWF IFS", "ECMWF"),
        "gfs_seamless": ("gfs-ncep", "GFS", "NOAA"),
        "icon_seamless": ("icon-dwd", "ICON", "DWD"),
        "gem_seamless": ("gem-cmc", "GEM", "CMC"),
    }

    def __init__(self):
        super().__init__(
            name="Open-Meteo Multi-Model Forecast",
            provider="Open-Meteo / ECMWF / NOAA / DWD / CMC",
            license_info="CC BY 4.0",
            resolution="Model-dependent, hourly",
        )
        self.endpoint = "https://api.open-meteo.com/v1/forecast"

    async def fetch(
        self,
        lat: float,
        lng: float,
        *,
        domain: DecisionDomain,
        horizon_hours: int,
        **kwargs: Any,
    ) -> dict[str, Any]:
        heat_domain = domain == DecisionDomain.HEAT
        variable = "temperature_2m" if heat_domain else "precipitation"
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": variable,
            "forecast_days": min(16, max(1, (horizon_hours + 23) // 24)),
            "timezone": "UTC",
            "models": ",".join(self.MODEL_IDS),
        }
        cache_key = f"openmeteo_models_{round(lat, 3)}_{round(lng, 3)}_{variable}_{horizon_hours}"
        raw = await self._safe_http_get(self.endpoint, params=params, cache_key=cache_key)
        if not raw or not isinstance(raw.get("hourly"), dict):
            return {"status": "unavailable", "models": []}

        hourly = raw["hourly"]
        unit = "°C" if heat_domain else f"mm/{horizon_hours}h"
        outputs = []
        for api_id, (model_id, model_name, provider) in self.MODEL_IDS.items():
            values = hourly.get(f"{variable}_{api_id}")
            if not isinstance(values, list):
                continue
            values = [value for value in values[:horizon_hours] if isinstance(value, (int, float))]
            if not values:
                continue
            value = max(values) if heat_domain else sum(values)
            outputs.append(
                {
                    "modelId": model_id,
                    "modelName": model_name,
                    "provider": provider,
                    "value": round(value, 1),
                    "unit": unit,
                    "confidenceLow": round(value, 1),
                    "confidenceHigh": round(value, 1),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

        if len(outputs) < 2:
            return {"status": "unavailable", "models": []}
        return {"status": "live", "models": outputs}
