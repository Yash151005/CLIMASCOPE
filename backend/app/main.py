"""
CLIMASCOPE — FastAPI Application Entrypoint
=============================================
AI Evidence Sufficiency Engine for Climate Decisions.
PCCOE International Grand Challenge 2026.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db.init_db import init_db
from .routers import (
    evidence,
    consensus,
    verdict,
    missing_evidence,
    what_if,
    validation,
    history,
)

logger = logging.getLogger("climascope.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database on startup
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "CLIMASCOPE audits whether available observational and model evidence is strong "
        "enough to act before a climate decision is taken. Implements Sufficiency = "
        "(Evidence Quality × Model Agreement × Decision Relevance) ÷ Consequence of Error."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled request error for %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An internal error occurred. Check the server logs for details.",
            "path": request.url.path,
        },
    )

# Include Routers under /api/v1
api_prefix = settings.API_V1_PREFIX
app.include_router(evidence.router, prefix=api_prefix)
app.include_router(consensus.router, prefix=api_prefix)
app.include_router(verdict.router, prefix=api_prefix)
app.include_router(missing_evidence.router, prefix=api_prefix)
app.include_router(what_if.router, prefix=api_prefix)
app.include_router(validation.router, prefix=api_prefix)
app.include_router(history.router, prefix=api_prefix)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CLIMASCOPE Evidence Sufficiency Engine",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to CLIMASCOPE API. Visit /docs for OpenAPI specification.",
        "project": settings.PROJECT_NAME,
        "challenge": "PCCOE International Grand Challenge 2026",
    }
