import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_database
from app.scheduler.jobs import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("climate_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Climate Vulnerability Intelligence Platform...")
    init_database()
    start_scheduler()
    yield
    # Shutdown
    logger.info("Shutting down Climate Platform...")
    shutdown_scheduler()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-oriented Geospatial Climate Intelligence Platform for India. "
        "Integrates Long-term Climate Vulnerability Assessment (IPCC AR5/AR6 formula) "
        "and Current & Recent Climate Hazard Monitoring (Open-Meteo telemetry, NASA FIRMS active fires, Census demographics, and SDMA official warnings)."
    ),
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for easy local college presentation & testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "api_v1": "/api/v1"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "scheduler": "ACTIVE" if settings.SCHEDULER_ENABLED else "DISABLED"
    }
