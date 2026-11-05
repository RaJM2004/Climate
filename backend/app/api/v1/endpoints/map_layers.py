from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import District, VulnerabilityScore, RainfallObservation, TemperatureObservation, HazardEvent
from app.schemas.schemas import MapLayerMetadata
from app.services.spatial_service import get_layer_geojson

router = APIRouter()

@router.get("/layers", response_model=List[MapLayerMetadata])
def get_map_layers_metadata():
    """Returns metadata for all independently switchable map layers."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return [
        {
            "layer_key": "vulnerability",
            "title": "Climate Vulnerability Index",
            "category": "VULNERABILITY",
            "source_name": "IPCC AR5/AR6 Composite Model",
            "source_url": "https://ipcc.ch",
            "observation_timestamp": now_str,
            "update_status": "CURRENT_EVALUATION",
            "geographic_coverage": "All 594 Constitutional Districts (India)",
            "unit": "Score (0-100)"
        },
        {
            "layer_key": "rainfall",
            "title": "24h Rainfall Estimates & Accumulation",
            "category": "HAZARD_MONITORING",
            "source_name": "Open-Meteo High-Resolution Grid (ECMWF/GFS)",
            "source_url": "https://open-meteo.com",
            "observation_timestamp": now_str,
            "update_status": "HOURLY_MODEL_ESTIMATE",
            "geographic_coverage": "High-Resolution Climatological Grid (India)",
            "unit": "mm/24h"
        },
        {
            "layer_key": "temperature",
            "title": "Surface Temperature Telemetry",
            "category": "HAZARD_MONITORING",
            "source_name": "Open-Meteo High-Resolution Grid",
            "source_url": "https://open-meteo.com",
            "observation_timestamp": now_str,
            "update_status": "HOURLY_MODEL_ESTIMATE",
            "geographic_coverage": "Surface Synoptic & Model Grid",
            "unit": "°C"
        },
        {
            "layer_key": "flood",
            "title": "Topographical Flood Basin Susceptibility Index",
            "category": "VULNERABILITY",
            "source_name": "Basin Catchment & Slope Model (NWIC Baseline)",
            "source_url": "https://nwdp.nwic.gov.in",
            "observation_timestamp": now_str,
            "update_status": "TOPOGRAPHICAL_BASELINE",
            "geographic_coverage": "Major River Basins (Susceptibility 0-100)",
            "unit": "Susceptibility Score (0-100)"
        },
        {
            "layer_key": "drought",
            "title": "Climatological Drought Recurrence & SPI Index",
            "category": "VULNERABILITY",
            "source_name": "Standardized Precipitation Deficit (ERA5 Baseline)",
            "source_url": "https://cds.climate.copernicus.eu",
            "observation_timestamp": now_str,
            "update_status": "CLIMATOLOGICAL_BASELINE",
            "geographic_coverage": "Rain-Shadow & Arid Zones (Deficit 0-100)",
            "unit": "SPI Drought Recurrence (0-100)"
        },
        {
            "layer_key": "active_fires",
            "title": "Active Satellite Thermal Detections (VIIRS/MODIS)",
            "category": "HAZARD_MONITORING",
            "source_name": "NASA FIRMS (Near Real-Time)",
            "source_url": "https://firms.modaps.eosdis.nasa.gov",
            "observation_timestamp": now_str,
            "update_status": "NEAR_REAL_TIME",
            "geographic_coverage": "Live Thermal Hotspots across India",
            "unit": "Fire Radiative Power (MW)"
        },
        {
            "layer_key": "population_exposure",
            "title": "Demographic & Population Exposure",
            "category": "VULNERABILITY",
            "source_name": "Census of India",
            "source_url": "https://censusindia.gov.in",
            "observation_timestamp": "Census Baseline",
            "update_status": "STATIC_CENSUS",
            "geographic_coverage": "All Districts",
            "unit": "Total Population"
        }
    ]

def _build_db_districts_map(db: Session) -> Dict[str, Any]:
    db_districts = db.query(District).all()
    res = {}
    for d in db_districts:
        sc = db.query(VulnerabilityScore).filter(VulnerabilityScore.district_id == d.id, VulnerabilityScore.is_current == True).first()
        rn = db.query(RainfallObservation).filter(RainfallObservation.district_id == d.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
        tm = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()
        res[d.id] = {
            "vulnerability_score": sc.vulnerability_score if sc else 50.0,
            "vulnerability_category": sc.vulnerability_category if sc else "Moderate",
            "exposure_score": sc.exposure_score if sc else 50.0,
            "sensitivity_score": sc.sensitivity_score if sc else 50.0,
            "adaptive_capacity_score": sc.adaptive_capacity_score if sc else 50.0,
            "rainfall_24h": rn.rainfall_mm_24h if rn else 0.0,
            "temp_c": tm.temp_current_c if tm else 30.0
        }
    return res

@router.get("/vulnerability")
def get_vulnerability_layer(db: Session = Depends(get_db)):
    """Returns GeoJSON FeatureCollection styled by Vulnerability Score."""
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("vulnerability", db_map)

@router.get("/rainfall")
def get_rainfall_layer(db: Session = Depends(get_db)):
    """Returns GeoJSON FeatureCollection styled by 24h Rainfall."""
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("rainfall", db_map)

@router.get("/temperature")
def get_temperature_layer(db: Session = Depends(get_db)):
    """Returns GeoJSON FeatureCollection styled by Surface Temperature."""
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("temperature", db_map)

@router.get("/flood")
def get_flood_layer(db: Session = Depends(get_db)):
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("flood", db_map)

@router.get("/drought")
def get_drought_layer(db: Session = Depends(get_db)):
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("drought", db_map)

@router.get("/population_exposure")
def get_population_layer(db: Session = Depends(get_db)):
    db_map = _build_db_districts_map(db)
    return get_layer_geojson("population_exposure", db_map)

@router.get("/hazards")
def get_hazards_layer(db: Session = Depends(get_db)):
    """Returns point features for active hazard events across India."""
    hazards = db.query(HazardEvent).filter(HazardEvent.status == "ACTIVE").all()
    features = []
    for h in hazards:
        is_satellite = "FIRMS" in (h.source_name or "") or "VIIRS" in (h.source_name or "")
        features.append({
            "type": "Feature",
            "id": h.id,
            "geometry": {
                "type": "Point",
                "coordinates": [h.longitude, h.latitude]
            },
            "properties": {
                "hazard_id": h.id,
                "district_id": h.district_id,
                "hazard_type": h.hazard_type,
                "severity": h.severity,
                "location_detail": h.location_detail,
                "timestamp": h.event_timestamp.isoformat(),
                "source": h.source_name,
                "status": h.status,
                "is_live_satellite_detection": is_satellite,
                "hazard_category": "LIVE_SATELLITE_DETECTION" if is_satellite else "SEEDED_BENCHMARK_EVENT",
                "verification_label": "Live Satellite Detection (NASA FIRMS)" if is_satellite else "Benchmark Disaster Scenario"
            }
        })
    return {"type": "FeatureCollection", "features": features}
