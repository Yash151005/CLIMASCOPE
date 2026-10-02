"""
CLIMASCOPE — Base Ingestion Connector
=======================================
Provides asynchronous HTTP fetching, caching with TTL, exponential retries,
and provenance metadata tracking.
"""

import time
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import httpx
from ...config import settings

logger = logging.getLogger("climascope.ingestion")
_UNAVAILABLE = object()


class IngestionCache:
    """Simple in-memory thread-safe TTL cache"""

    def __init__(self, default_ttl: int = settings.CACHE_TTL_SECONDS):
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            timestamp, data = self._cache[key]
            if time.time() - timestamp < self._default_ttl:
                return data
            del self._cache[key]
        return None

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        self._cache[key] = (time.time(), data)
        if ttl is not None:
            self._cache[key] = (time.time() - self._default_ttl + ttl, data)


global_cache = IngestionCache()


class BaseConnector(ABC):
    """Abstract base class for public climate data ingestion connectors"""

    def __init__(self, name: str, provider: str, license_info: str, resolution: str):
        self.name = name
        self.provider = provider
        self.license = license_info
        self.resolution = resolution

    @abstractmethod
    async def fetch(self, lat: float, lng: float, **kwargs) -> Dict[str, Any]:
        """Fetch raw data for coordinates"""
        pass

    async def _safe_http_get(
        self, url: str, params: Optional[Dict[str, Any]] = None, cache_key: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Executes GET request with caching, timeout, and retry logic"""
        if cache_key:
            cached = global_cache.get(cache_key)
            if cached is not None:
                if cached is _UNAVAILABLE:
                    logger.info("[%s] Reusing recent unavailable-source result.", self.name)
                    return None
                logger.info(f"[{self.name}] Returning cached response for {cache_key}")
                return cached

        headers = {
            "User-Agent": "CLIMASCOPE-Engine/1.0 (academic-climate-research; climascope@pccoe)",
            "Accept": "application/json",
        }

        timeout = settings.INGESTION_TIMEOUT_SECONDS
        retries = settings.INGESTION_MAX_RETRIES

        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            for attempt in range(retries + 1):
                try:
                    response = await client.get(url, params=params)
                    if response.status_code == 200:
                        data = response.json()
                        if cache_key:
                            global_cache.set(cache_key, data)
                        return data
                    else:
                        logger.warning(
                            f"[{self.name}] HTTP {response.status_code} on attempt {attempt + 1}"
                        )
                except (httpx.HTTPError, ValueError) as e:
                    logger.warning(
                        f"[{self.name}] Request error on attempt {attempt + 1}: {str(e)}"
                    )
                if attempt < retries:
                    await asyncio.sleep(
                        settings.INGESTION_RETRY_BACKOFF_SECONDS * (2**attempt)
                    )
        logger.error("[%s] Exhausted retries; source unavailable.", self.name)
        if cache_key:
            global_cache.set(
                cache_key,
                _UNAVAILABLE,
                ttl=settings.INGESTION_NEGATIVE_CACHE_SECONDS,
            )
        return None
