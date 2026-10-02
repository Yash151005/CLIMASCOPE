"""
CLIMASCOPE — NASA POWER Climatology Connector
==============================================
Pulls solar, climatological averages, and anomaly trends from NASA POWER.
Public open data, no key required.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict
from .base import BaseConnector


class NasaPowerConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="NASA POWER Climatology",
            provider="NASA Langley Research Center",
            license_info="Open Data (NASA)",
            resolution="0.5° grid, daily",
        )
        self.endpoint = "https://power.larc.nasa.gov/api/temporal/daily/point"

    async def fetch(self, lat: float, lng: float, **kwargs) -> Dict[str, Any]:
        cache_key = f"nasapower_{round(lat, 2)}_{round(lng, 2)}"
        # Query past 7 days for regional baseline
        end_date = datetime.now(timezone.utc) - timedelta(days=2)
        start_date = end_date - timedelta(days=5)

        params = {
            "parameters": "PRECTOTCORR,T2M",
            "community": "RE",
            "longitude": round(lng, 2),
            "latitude": round(lat, 2),
            "start": start_date.strftime("%Y%m%d"),
            "end": end_date.strftime("%Y%m%d"),
            "format": "JSON",
        }

        raw = await self._safe_http_get(self.endpoint, params=params, cache_key=cache_key)
        now_iso = datetime.now(timezone.utc).isoformat()

        if raw and "properties" in raw and "parameter" in raw["properties"]:
            params_data = raw["properties"]["parameter"]
            precip_dict = params_data.get("PRECTOTCORR", {})
            values = [
                value
                for value in precip_dict.values()
                if isinstance(value, (int, float)) and value >= 0
            ]
            avg_precip = sum(values) / len(values) if values else 0.0
            return {
                "status": "live",
                "source": "NASA POWER Live",
                "retrievedAt": now_iso,
                "dataTimestamp": end_date.isoformat(),
                "climatologicalAvgPrecip": avg_precip,
                "summary": f"Observed 5-day antecedent precipitation average: {round(avg_precip, 1)}mm/day.",
                "raw": raw,
            }

        return {
            "status": "simulated_fallback",
            "source": "NASA POWER (Simulated Fallback)",
            "retrievedAt": now_iso,
            "dataTimestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "climatologicalAvgPrecip": 3.8,
            "summary": "[SIMULATED FALLBACK] Climatological baseline: 95mm/month. Current regional soil saturation index 38% above normal.",
            "raw": None,
        }
