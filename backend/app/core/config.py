import os
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Community Climate Vulnerability Mapping Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True
    
    # Database (SQLite zero-configuration out-of-the-box or PostgreSQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./climate_intelligence.db")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ZfBoAzx8KnTW_TzNjOP5ixUtlgItpvK1-sdMYgtgHVo")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Scheduler
    SCHEDULER_ENABLED: bool = True
    DATA_SYNC_INTERVAL_HOURS: int = 6
    
    # Open-Meteo APIs (Free & Open, No API keys required)
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast")
    OPEN_METEO_HISTORICAL_URL: str = os.getenv("OPEN_METEO_HISTORICAL_URL", "https://archive-api.open-meteo.com/v1/archive")
    
    # NASA FIRMS (Active Satellite Thermal Detections)
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "27991400c79ff20579cb89bc91324b12")
    NASA_FIRMS_BASE_URL: str = os.getenv("NASA_FIRMS_BASE_URL", "https://firms.modaps.eosdis.nasa.gov/api/area")
    
    # Copernicus ERA5 & Demographic Baselines
    COPERNICUS_CDS_API_KEY: str = os.getenv("COPERNICUS_CDS_API_KEY", "")
    CENSUS_PORTAL_URL: str = os.getenv("CENSUS_PORTAL_URL", "https://censusindia.gov.in")
    NWIC_PORTAL_URL: str = os.getenv("NWIC_PORTAL_URL", "https://nwdp.nwic.gov.in")
    
    # Optional IMD Credentials (Not required; falls back automatically to Open-Meteo)
    IMD_API_KEY: str = os.getenv("IMD_API_KEY", "")
    IMD_BASE_URL: str = os.getenv("IMD_BASE_URL", "https://api.imd.gov.in/public")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = ConfigDict(env_file=".env", extra="allow")

settings = Settings()
