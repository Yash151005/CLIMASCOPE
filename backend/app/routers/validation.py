"""
CLIMASCOPE — Validation Router
GET /api/v1/validation
"""

from fastapi import APIRouter
from ..schemas.validation import ValidationResponse
from ..services.validation import validation_service

router = APIRouter(prefix="/validation", tags=["Validation"])


@router.get("", response_model=ValidationResponse)
def get_validation_report():
    """
    Returns historical disaster replay outcomes, source ablation test results,
    and aggregate false confidence rate.
    """
    return validation_service.get_validation_report()
