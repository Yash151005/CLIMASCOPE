"""
CLIMASCOPE — OpenStreetMap Infrastructure & GIS Connector
===========================================================
Queries OpenStreetMap geospatial metadata for target decision areas.
Free, open data under ODbL license.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from .base import BaseConnector


class OsmGisConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="OpenStreetMap Infrastructure & Drainage",
            provider="OpenStreetMap Contributors",
            license_info="ODbL",
            resolution="Vector, building & road level",
        )
        self.endpoint = "https://overpass-api.de/api/interpreter"

    async def fetch(self, lat: float, lng: float, **kwargs) -> Dict[str, Any]:
        cache_key = f"osm_{round(lat, 2)}_{round(lng, 2)}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Query a bounded area around the target point; the box is about 8km wide.
        delta = 0.04
        bbox = f"{lat - delta},{lng - delta},{lat + delta},{lng + delta}"
        query = f"[out:json][timeout:5];(way[waterway]({bbox});node[amenity=hospital]({bbox}););out count;"

        raw = await self._safe_http_get(self.endpoint, params={"data": query}, cache_key=cache_key)

        if raw and "elements" in raw:
            return {
                "status": "live",
                "source": "OpenStreetMap Live",
                "retrievedAt": now_iso,
                "dataTimestamp": now_iso,
                "summary": "Live OpenStreetMap response returned mapped waterways and nearby hospitals in the query area.",
                "raw": raw,
            }

        return {
            "status": "simulated_fallback",
            "source": "OpenStreetMap (Simulated Fallback)",
            "retrievedAt": now_iso,
            "dataTimestamp": now_iso,
            "summary": "[SIMULATED FALLBACK] AOI vector layer: 12,400 structures, 340km road network, 45 stormwater outfalls mapped.",
            "raw": None,
        }
