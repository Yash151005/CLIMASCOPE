"""
CLIMASCOPE — Consensus & Uncertainty Service
==============================================
Compares model-separated live Open-Meteo forecasts when available; offline values are illustrative.
Quantifies model spread and agreement while reporting calibration as unavailable.
Uncertainty and disagreement are NEVER averaged away — they are preserved as first-class inputs.
"""

from datetime import datetime, timezone, timedelta
from typing import List
from ..schemas.consensus import ModelOutput, DisagreementBand, ConsensusResponse
from ..schemas.decision import DecisionRequest
from ..schemas.common import DecisionDomain
from ..config import settings
from .ingestion.model_forecast import OpenMeteoModelConnector


class ConsensusService:
    def get_consensus(self, decision: DecisionRequest) -> ConsensusResponse:
        """Return explicitly illustrative outputs for offline tests and fallback."""
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        # Domain-calibrated baseline models
        if decision.domain == DecisionDomain.HEAT:
            models = [
                ModelOutput(
                    modelId="ecmwf-ifs",
                    modelName="ECMWF IFS",
                    provider="ECMWF",
                    value=46.2,
                    unit="°C",
                    confidenceLow=43.5,
                    confidenceHigh=48.0,
                    timestamp=(now - timedelta(hours=3)).isoformat(),
                ),
                ModelOutput(
                    modelId="gfs-ncep",
                    modelName="GFS (NCEP)",
                    provider="NOAA",
                    value=47.1,
                    unit="°C",
                    confidenceLow=44.0,
                    confidenceHigh=49.2,
                    timestamp=(now - timedelta(hours=4)).isoformat(),
                ),
                ModelOutput(
                    modelId="icon-dwd",
                    modelName="ICON",
                    provider="DWD",
                    value=45.8,
                    unit="°C",
                    confidenceLow=43.0,
                    confidenceHigh=47.5,
                    timestamp=(now - timedelta(hours=3)).isoformat(),
                ),
                ModelOutput(
                    modelId="gem-cmc",
                    modelName="GEM",
                    provider="CMC",
                    value=46.5,
                    unit="°C",
                    confidenceLow=43.8,
                    confidenceHigh=48.5,
                    timestamp=(now - timedelta(hours=5)).isoformat(),
                ),
                ModelOutput(
                    modelId="metoffice-ukv",
                    modelName="Met Office",
                    provider="UK Met Office",
                    value=46.9,
                    unit="°C",
                    confidenceLow=44.2,
                    confidenceHigh=48.8,
                    timestamp=(now - timedelta(hours=4)).isoformat(),
                ),
            ]
        else:
            # Default / Flood precipitation models
            models = [
                ModelOutput(
                    modelId="ecmwf-ifs",
                    modelName="ECMWF IFS",
                    provider="ECMWF",
                    value=145.0,
                    unit="mm/48h",
                    confidenceLow=95.0,
                    confidenceHigh=210.0,
                    timestamp=(now - timedelta(hours=3)).isoformat(),
                ),
                ModelOutput(
                    modelId="gfs-ncep",
                    modelName="GFS (NCEP)",
                    provider="NOAA",
                    value=132.0,
                    unit="mm/48h",
                    confidenceLow=80.0,
                    confidenceHigh=190.0,
                    timestamp=(now - timedelta(hours=4)).isoformat(),
                ),
                ModelOutput(
                    modelId="icon-dwd",
                    modelName="ICON",
                    provider="DWD",
                    value=162.0,
                    unit="mm/48h",
                    confidenceLow=110.0,
                    confidenceHigh=235.0,
                    timestamp=(now - timedelta(hours=3)).isoformat(),
                ),
                ModelOutput(
                    modelId="gem-cmc",
                    modelName="GEM",
                    provider="CMC",
                    value=118.0,
                    unit="mm/48h",
                    confidenceLow=70.0,
                    confidenceHigh=175.0,
                    timestamp=(now - timedelta(hours=5)).isoformat(),
                ),
                ModelOutput(
                    modelId="metoffice-ukv",
                    modelName="Met Office",
                    provider="UK Met Office",
                    value=154.0,
                    unit="mm/48h",
                    confidenceLow=105.0,
                    confidenceHigh=218.0,
                    timestamp=(now - timedelta(hours=4)).isoformat(),
                ),
            ]

        models = [
            model.model_copy(
                update={
                    "modelName": f"Scenario {index}",
                    "provider": "Simulated example (not a live feed)",
                }
            )
            for index, model in enumerate(models, start=1)
        ]
        values = [m.value for m in models]
        mean_val = sum(values) / len(values) if values else 1.0
        min_val = min(values)
        max_val = max(values)
        spread = max_val - min_val

        # Agreement score: normalized relative to mean
        # spread / mean_val gives relative variance
        rel_spread = spread / mean_val if mean_val > 0 else 1.0
        agreement_score = max(0.0, min(1.0, 1.0 - (rel_spread * 0.85)))

        all_lows = [m.confidenceLow for m in models]
        all_highs = [m.confidenceHigh for m in models]
        disagreement_band = DisagreementBand(
            min=round(min(all_lows), 1),
            max=round(max(all_highs), 1),
            unit=models[0].unit,
        )

        calibration_indicator = 0.0

        explanation = (
            "[SIMULATED FALLBACK — NOT OBSERVED OR LIVE MODEL DATA] Five illustrative "
            f"scenario outputs ({', '.join(m.modelName for m in models)}). "
            f"Ensemble mean: {round(mean_val, 1)}{models[0].unit} with total spread of {round(spread, 1)}{models[0].unit}. "
            f"Illustrative agreement: {round(agreement_score * 100)}%. "
            "These values demonstrate uncertainty presentation and must not guide real decisions."
        )

        return ConsensusResponse(
            models=models,
            agreementScore=round(agreement_score, 2),
            disagreementBand=disagreement_band,
            calibrationIndicator=calibration_indicator,
            calibrationStatus="illustrative",
            explanation=explanation,
        )

    async def get_consensus_for_decision(
        self, decision: DecisionRequest
    ) -> ConsensusResponse:
        """Prefer live, model-separated Open-Meteo output; label fallback explicitly."""
        connector = OpenMeteoModelConnector()
        forecast = await connector.fetch(
            decision.location.lat,
            decision.location.lng,
            domain=decision.domain,
            horizon_hours=decision.timeHorizonHours,
        )
        models = forecast.get("models", [])
        if len(models) < 2:
            return self.get_consensus(decision)

        values = [model["value"] for model in models]
        mean_value = sum(values) / len(values)
        spread = max(values) - min(values)
        domain_key = (
            decision.domain.value
            if hasattr(decision.domain, "value")
            else str(decision.domain)
        )
        normalization = max(
            mean_value,
            settings.MODEL_SPREAD_SCALE_BY_DOMAIN.get(domain_key, 10.0),
        )
        agreement = max(0.0, min(1.0, 1 - spread / normalization))
        unit = models[0]["unit"]
        outputs = [ModelOutput(**model) for model in models]
        return ConsensusResponse(
            models=outputs,
            agreementScore=round(agreement, 2),
            disagreementBand=DisagreementBand(
                min=round(min(values), 1),
                max=round(max(values), 1),
                unit=unit,
            ),
            # A truth-set calibration statistic is not available from this free feed.
            calibrationIndicator=0.0,
            calibrationStatus="unavailable",
            explanation=(
                f"Live Open-Meteo forecast outputs from {len(outputs)} separate model runs. "
                f"The inter-model range is {round(min(values), 1)}–{round(max(values), 1)} {unit}; "
                "the spread is preserved, not averaged away. Calibration is unavailable; "
                "per-model intervals are not provided by this endpoint."
            ),
        )


consensus_service = ConsensusService()
