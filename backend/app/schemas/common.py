"""
CLIMASCOPE — Common Schemas & Enums
"""

from enum import Enum
from pydantic import BaseModel, Field


class DecisionDomain(str, Enum):
    FLOOD = "flood"
    HEAT = "heat"
    DROUGHT = "drought"
    AGRICULTURE = "agriculture"
    WATER = "water"
    SMART_CITY = "smart-city"


class ConsequenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VerdictLabel(str, Enum):
    SUFFICIENT = "SUFFICIENT"
    INSUFFICIENT = "INSUFFICIENT"
    NEED_MORE_EVIDENCE = "NEED MORE EVIDENCE"


class EvidenceSourceType(str, Enum):
    WEATHER_API = "weather-api"
    SATELLITE = "satellite"
    GIS = "gis"
    HISTORICAL_EVENTS = "historical-events"
    FORECAST_MODEL = "forecast-model"
    REPORTS = "reports"


class AuditDimension(str, Enum):
    FRESHNESS = "freshness"
    PROVENANCE = "provenance"
    COMPLETENESS = "completeness"
    SPATIAL_FIT = "spatial-fit"
    TEMPORAL_FIT = "temporal-fit"


class GeoLocation(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude")
    label: str = Field(..., description="Human-readable location label")
