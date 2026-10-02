"""
CLIMASCOPE — Backend Configuration
====================================
All weights, thresholds, consequence multipliers, and external service
settings live here via Pydantic Settings. Nothing is hard-coded.
"""

from typing import Dict
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "CLIMASCOPE AI Evidence Sufficiency Engine"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # SQLite is convenient locally; production/dev-compose uses PostgreSQL + PostGIS.
    DATABASE_URL: str = "sqlite:///./climascope.db"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Ingestion Cache TTL in seconds (10 minutes)
    CACHE_TTL_SECONDS: int = 600

    # HTTP Client timeouts & retries
    INGESTION_TIMEOUT_SECONDS: float = 4.0
    INGESTION_MAX_RETRIES: int = 1
    INGESTION_RETRY_BACKOFF_SECONDS: float = 0.25
    INGESTION_NEGATIVE_CACHE_SECONDS: int = 60

    # ─── Audit Dimension Weights (Sum = 1.0) ───────────────────────────
    AUDIT_WEIGHTS: Dict[str, float] = {
        "freshness": 0.25,
        "provenance": 0.15,
        "completeness": 0.25,
        "spatial-fit": 0.20,
        "temporal-fit": 0.15,
    }

    # ─── Consequence Multipliers (Divides Sufficiency) ─────────────────
    # Higher consequence -> larger denominator -> harder to act
    CONSEQUENCE_MULTIPLIERS: Dict[str, float] = {
        "low": 1.0,
        "medium": 1.5,
        "high": 2.0,
        "critical": 3.0,
    }

    # ─── Verdict Thresholds (0–100 Scale) ──────────────────────────────
    VERDICT_THRESHOLD_SUFFICIENT: float = 70.0
    VERDICT_THRESHOLD_NEED_MORE: float = 40.0

    # ─── Domain Base Relevance Multipliers ──────────────────────────────
    DOMAIN_RELEVANCE: Dict[str, float] = {
        "flood": 0.95,
        "heat": 0.90,
        "drought": 0.85,
        "agriculture": 0.80,
        "water": 0.85,
        "smart-city": 0.75,
    }

    # Assumed quality for recommendation what-if calculations; not source measurements.
    CANDIDATE_EVIDENCE_QUALITY: Dict[str, float] = {
        "missing-river-gauge": 0.91,
        "missing-urban-drainage": 0.82,
        "missing-radar": 0.88,
        "missing-soil-moisture": 0.78,
        "missing-crowdsource": 0.66,
    }

    FRESHNESS_MAX_AGE_HOURS: Dict[str, float] = {
        "src-openmeteo-forecast": 6.0,
        "src-nasa-power": 168.0,
        "src-sentinel-imagery": 240.0,
        "src-osm-gis": 720.0,
        "src-historical-catalog": 8760.0,
        "src-ecmwf-ensemble": 6.0,
        "src-reports": 24.0,
    }
    SOURCE_TEMPORAL_RESOLUTION_HOURS: Dict[str, float] = {
        "src-openmeteo-forecast": 1.0,
        "src-nasa-power": 24.0,
        "src-sentinel-imagery": 120.0,
        "src-osm-gis": 0.0,
        "src-historical-catalog": 0.0,
        "src-ecmwf-ensemble": 1.0,
        "src-reports": 1.0,
    }
    MODEL_SPREAD_SCALE_BY_DOMAIN: Dict[str, float] = {
        "flood": 10.0,
        "heat": 5.0,
        "drought": 10.0,
        "agriculture": 5.0,
        "water": 10.0,
        "smart-city": 10.0,
    }

    # Time Horizon Decay
    TIME_HORIZON_DECAY_START_HOURS: int = 48
    TIME_HORIZON_DECAY_RATE: float = 0.02

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
