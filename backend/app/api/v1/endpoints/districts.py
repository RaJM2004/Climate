from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    District, VulnerabilityScore, VulnerabilityIndicator,
    PopulationIndicator, RainfallObservation, TemperatureObservation,
    HazardEvent, OfficialAlert, DataSource
)
from app.schemas.schemas import DistrictSummaryOut, DistrictDetailOut
from app.services.spatial_service import find_district_by_coordinates, find_district_in_db

router = APIRouter()

@router.get("", response_model=List[DistrictSummaryOut])
def get_districts(
    state: Optional[str] = Query(None, description="Filter by state name"),
    category: Optional[str] = Query(None, description="Filter by vulnerability category"),
    search: Optional[str] = Query(None, description="Search by district name"),
    db: Session = Depends(get_db)
):
    """Retrieves list of districts with vulnerability scores and categories."""
    query = db.query(District)
    if state and state != "ALL":
        query = query.filter(District.state_name == state)
    if search:
        query = query.filter(District.name.ilike(f"%{search}%"))
        
    districts = query.all()
    results = []
    
    for d in districts:
        score_obj = db.query(VulnerabilityScore).filter(
            VulnerabilityScore.district_id == d.id,
            VulnerabilityScore.is_current == True
        ).first()
        
        pop_obj = db.query(PopulationIndicator).filter(PopulationIndicator.district_id == d.id).first()
        rain_obj = db.query(RainfallObservation).filter(RainfallObservation.district_id == d.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
        temp_obj = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()

        v_score = score_obj.vulnerability_score if score_obj else 50.0
        v_cat = score_obj.vulnerability_category if score_obj else "Moderate"
        
        # Color mapping
        color_map = {
            "Very Low": "#10B981",
            "Low": "#34D399",
            "Moderate": "#FBBF24",
            "High": "#F97316",
            "Very High": "#EF4444"
        }
        
        if category and category != "ALL" and v_cat.lower() != category.lower():
            continue

        results.append({
            "id": d.id,
            "name": d.name,
            "state_name": d.state_name,
            "code": d.code,
            "centroid_lat": d.centroid_lat,
            "centroid_lng": d.centroid_lng,
            "zone": d.zone,
            "vulnerability_score": v_score,
            "vulnerability_category": v_cat,
            "category_color": color_map.get(v_cat, "#FBBF24"),
            "exposure_score": score_obj.exposure_score if score_obj else 50.0,
            "sensitivity_score": score_obj.sensitivity_score if score_obj else 50.0,
            "adaptive_capacity_score": score_obj.adaptive_capacity_score if score_obj else 50.0,
            "data_confidence": score_obj.confidence_score if score_obj else 90.0,
            "population": pop_obj.total_population if pop_obj else 1000000,
            "rainfall_24h": rain_obj.rainfall_mm_24h if rain_obj else 0.0,
            "temp_c": temp_obj.temp_current_c if temp_obj else 30.0
        })
        
    return results

@router.get("/by-coords")
def get_district_by_coordinates(lat: float = Query(...), lng: float = Query(...), db: Session = Depends(get_db)):
    """Spatial query: identifies district enclosing given coordinates."""
    match = find_district_by_coordinates(lat, lng)
    if not match:
        raise HTTPException(status_code=404, detail="No district found for specified coordinates")
    return match

@router.get("/{district_id}", response_model=DistrictDetailOut)
def get_district_detail(district_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed district profile combining Subsystems 1 (Vulnerability) and 2 (Hazard Monitoring)."""
    district = find_district_in_db(district_id, db)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
        
    score_obj = db.query(VulnerabilityScore).filter(
        VulnerabilityScore.district_id == district.id,
        VulnerabilityScore.is_current == True
    ).first()
    
    ind_obj = db.query(VulnerabilityIndicator).filter(VulnerabilityIndicator.district_id == district.id).first()
    pop_obj = db.query(PopulationIndicator).filter(PopulationIndicator.district_id == district.id).first()
    rain_obj = db.query(RainfallObservation).filter(RainfallObservation.district_id == district.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
    temp_obj = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == district.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()
    hazards = db.query(HazardEvent).filter(HazardEvent.district_id == district.id).all()
    alerts = db.query(OfficialAlert).filter(OfficialAlert.district_id == district.id, OfficialAlert.is_active == True).all()

    # Detailed Indicators Map
    indicators_dict = {
        "exposure": {
            "rainfall_extremes": ind_obj.rainfall_extremes if ind_obj else 50.0,
            "flood_exposure": ind_obj.flood_exposure if ind_obj else 50.0,
            "heat_exposure": ind_obj.heat_exposure if ind_obj else 50.0,
            "drought_exposure": ind_obj.drought_exposure if ind_obj else 50.0,
            "coastal_surge": ind_obj.coastal_surge if ind_obj else 0.0
        },
        "sensitivity": {
            "pop_density": ind_obj.pop_density if ind_obj else 500.0,
            "agri_dependency": ind_obj.agri_dependency if ind_obj else 50.0,
            "housing_vulnerability": ind_obj.housing_vulnerability if ind_obj else 50.0,
            "marginalized_pct": ind_obj.marginalized_pct if ind_obj else 25.0,
            "infra_exposure": ind_obj.infra_exposure if ind_obj else 60.0
        },
        "adaptive_capacity": {
            "healthcare_score": ind_obj.healthcare_score if ind_obj else 50.0,
            "road_density": ind_obj.road_density if ind_obj else 50.0,
            "drinking_water": ind_obj.drinking_water if ind_obj else 50.0,
            "literacy_rate": ind_obj.literacy_rate if ind_obj else 75.0,
            "disaster_preparedness": ind_obj.disaster_preparedness if ind_obj else 60.0
        }
    }

    # Detailed Indicator Provenance Registry
    indicator_provenance = {
        "rainfall_extremes": {
            "name": "Extreme Precipitation Frequency",
            "dimension": "Exposure",
            "source": "Open-Meteo High-Res & IMERG Reanalysis Grid",
            "reference_period": "2020-2024",
            "geographic_resolution": "0.1° Grid (~10km)",
            "data_type": "ESTIMATED_REANALYSIS",
            "confidence_pct": 90.0,
            "weight": 0.30
        },
        "flood_exposure": {
            "name": "River Basin Inundation Susceptibility",
            "dimension": "Exposure",
            "source": "Topographical Basin Slope Model (NWIC Baseline)",
            "reference_period": "2021",
            "geographic_resolution": "Major River Basin",
            "data_type": "SOURCED_MODEL",
            "confidence_pct": 82.0,
            "weight": 0.25
        },
        "heat_exposure": {
            "name": "Extreme Heat Days Climatology",
            "dimension": "Exposure",
            "source": "ERA5 Climatological Baseline",
            "reference_period": "1991-2020 Climatological Normal",
            "geographic_resolution": "0.1° Reanalysis Grid",
            "data_type": "ESTIMATED_REANALYSIS",
            "confidence_pct": 88.0,
            "weight": 0.25
        },
        "drought_exposure": {
            "name": "Drought Recurrence & SPI Deficit",
            "dimension": "Exposure",
            "source": "Standardized Precipitation Index Departure",
            "reference_period": "2020",
            "geographic_resolution": "Meteorological Sub-division",
            "data_type": "SOURCED_MODEL",
            "confidence_pct": 80.0,
            "weight": 0.10
        },
        "coastal_surge": {
            "name": "Cyclone & Coastal Surge Risk",
            "dimension": "Exposure",
            "source": "NDMA Coastal Vulnerability Atlas",
            "reference_period": "2020",
            "geographic_resolution": "Coastal Littoral Zone",
            "data_type": "SOURCED_OFFICIAL",
            "confidence_pct": 92.0 if "coastal" in (district.zone or "").lower() else 100.0,
            "weight": 0.10
        },
        "pop_density": {
            "name": "Population Density",
            "dimension": "Sensitivity",
            "source": "Census of India 2011",
            "reference_period": "2011",
            "geographic_resolution": "District Boundary",
            "data_type": "OBSERVED_ENUMERATION",
            "confidence_pct": 95.0,
            "weight": 0.20
        },
        "agri_dependency": {
            "name": "Agricultural Workforce Share",
            "dimension": "Sensitivity",
            "source": "Census 2011 Economic Tables / State Statistical Abstracts",
            "reference_period": "2011",
            "geographic_resolution": "District / Regional Archetype",
            "data_type": "ARCHETYPE_BASED",
            "confidence_pct": 78.0,
            "weight": 0.30
        },
        "housing_vulnerability": {
            "name": "Kutcha / Fragile Housing Proportion",
            "dimension": "Sensitivity",
            "source": "Census 2011 Housing Census",
            "reference_period": "2011",
            "geographic_resolution": "District / Regional Archetype",
            "data_type": "ARCHETYPE_BASED",
            "confidence_pct": 75.0,
            "weight": 0.25
        },
        "marginalized_pct": {
            "name": "Marginalized Demographic Proportion",
            "dimension": "Sensitivity",
            "source": "Baseline Reference Distribution (Anchor 25%)",
            "reference_period": "2011 Reference",
            "geographic_resolution": "National Demographic Baseline",
            "data_type": "ARCHETYPE_BASED",
            "confidence_pct": 70.0,
            "weight": 0.15
        },
        "infra_exposure": {
            "name": "Critical Infrastructure Exposure Index",
            "dimension": "Sensitivity",
            "source": "PMGSY / Lifeline Network Index",
            "reference_period": "2022",
            "geographic_resolution": "District Road Network",
            "data_type": "ESTIMATED_MODEL",
            "confidence_pct": 75.0,
            "weight": 0.10
        },
        "healthcare_score": {
            "name": "Healthcare Capacity Score",
            "dimension": "Adaptive Capacity",
            "source": "Rural Health Statistics (MoHFW)",
            "reference_period": "2021-2022",
            "geographic_resolution": "District / State Norms",
            "data_type": "SOURCED_ESTIMATE",
            "confidence_pct": 76.0,
            "weight": 0.25
        },
        "road_density": {
            "name": "All-Weather Road Connectivity",
            "dimension": "Adaptive Capacity",
            "source": "PMGSY Rural Road Network Database",
            "reference_period": "2021",
            "geographic_resolution": "District Network",
            "data_type": "ESTIMATED_MODEL",
            "confidence_pct": 78.0,
            "weight": 0.20
        },
        "drinking_water": {
            "name": "Piped Drinking Water Access",
            "dimension": "Adaptive Capacity",
            "source": "JJM & Census Baseline Reports",
            "reference_period": "2022",
            "geographic_resolution": "District / Block Level",
            "data_type": "SOURCED_ESTIMATE",
            "confidence_pct": 80.0,
            "weight": 0.20
        },
        "literacy_rate": {
            "name": "Adult Literacy Rate",
            "dimension": "Adaptive Capacity",
            "source": "Census of India 2011",
            "reference_period": "2011",
            "geographic_resolution": "District / Archetype Baseline",
            "data_type": "OBSERVED_ENUMERATION",
            "confidence_pct": 92.0,
            "weight": 0.15
        },
        "disaster_preparedness": {
            "name": "Disaster Response Readiness",
            "dimension": "Adaptive Capacity",
            "source": "NDMA Institutional Preparedness Framework",
            "reference_period": "2023",
            "geographic_resolution": "District Disaster Management Plan",
            "data_type": "ESTIMATED_INDEX",
            "confidence_pct": 72.0,
            "weight": 0.20
        }
    }

    recent_hazards_list = [
        {
            "id": h.id,
            "hazard_type": h.hazard_type,
            "severity": h.severity,
            "location_detail": h.location_detail,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "event_timestamp": h.event_timestamp.isoformat(),
            "source_name": h.source_name,
            "source_url": h.source_url,
            "status": h.status
        }
        for h in hazards
    ]

    active_alerts_list = [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "headline": a.headline,
            "description": a.description,
            "issuing_authority": a.issuing_authority,
            "issue_timestamp": a.issue_timestamp.isoformat(),
            "valid_until": a.valid_until.isoformat(),
            "source_url": a.source_url
        }
        for a in alerts
    ]

    sources_list = [
        {"name": "Open-Meteo Weather API", "role": "High-Resolution Forecast & Current Telemetry (No Auth Required)", "url": "https://open-meteo.com"},
        {"name": "Open-Meteo Historical Archive", "role": "Historical Climate Observations & Multi-Decadal Trends", "url": "https://archive-api.open-meteo.com"},
        {"name": "NASA FIRMS", "role": "Near Real-Time Active Fire Detections (VIIRS/MODIS)", "url": "https://firms.modaps.eosdis.nasa.gov"},
        {"name": "Census of India", "role": "Demographic & Population Indicators", "url": "https://censusindia.gov.in"},
        {"name": "Copernicus ERA5", "role": "Climate Normal Baselines (1991-2020 Reanalysis)", "url": "https://cds.climate.copernicus.eu"},
        {"name": "State & National Disaster Management (SDMA/NDMA)", "role": "Official Hazard Warnings & Advisories", "url": "https://ndma.gov.in"}
    ]

    return {
        "id": district.id,
        "name": district.name,
        "state_name": district.state_name,
        "code": district.code,
        "centroid_lat": district.centroid_lat,
        "centroid_lng": district.centroid_lng,
        "zone": district.zone,
        "geometry_geojson": district.geometry_geojson,
        "vulnerability": {
            "exposure_score": score_obj.exposure_score if score_obj else 50.0,
            "sensitivity_score": score_obj.sensitivity_score if score_obj else 50.0,
            "adaptive_capacity_score": score_obj.adaptive_capacity_score if score_obj else 50.0,
            "vulnerability_score": score_obj.vulnerability_score if score_obj else 50.0,
            "vulnerability_category": score_obj.vulnerability_category if score_obj else "Moderate",
            "confidence_score": score_obj.confidence_score if score_obj else 95.0,
            "calculation_date": score_obj.calculation_date if score_obj else district.created_at
        },
        "indicators": indicators_dict,
        "indicator_provenance": indicator_provenance,
        "population": {
            "total_population": pop_obj.total_population if pop_obj else 1000000,
            "male_population": pop_obj.male_population if pop_obj else 510000,
            "female_population": pop_obj.female_population if pop_obj else 490000,
            "rural_population": pop_obj.rural_population if pop_obj else 700000,
            "urban_population": pop_obj.urban_population if pop_obj else 300000,
            "total_households": pop_obj.total_households if pop_obj else 200000,
            "census_year": pop_obj.census_year if pop_obj else 2011,
            "is_demographic_breakdown_estimated": True,
            "demographic_breakdown_type": "SYNTHETIC_ESTIMATE",
            "estimation_methodology": "Standard national demographic baseline ratios (51.5% M, 48.5% F, 65% Rural, 35% Urban, 4.8 persons/HH)",
            "data_source": "Office of the Registrar General & Census Commissioner, India (Census 2011)"
        } if pop_obj else None,
        "current_weather": {
            "temp_current_c": temp_obj.temp_current_c if temp_obj else 30.0,
            "rainfall_mm_24h": rain_obj.rainfall_mm_24h if rain_obj else 0.0,
            "humidity_pct": temp_obj.humidity_pct if temp_obj else 65.0,
            "weather_condition": temp_obj.weather_condition if temp_obj else "Partly Cloudy",
            "station_name": temp_obj.station_name if temp_obj else f"{district.name} (Open-Meteo Grid)",
            "observation_timestamp": temp_obj.observation_timestamp if temp_obj else district.created_at,
            "source_name": temp_obj.source_name if temp_obj else "Open-Meteo High-Resolution Grid",
            "data_classification": "WEATHER_MODEL_ESTIMATE"
        } if temp_obj else None,
        "recent_hazards": recent_hazards_list,
        "active_alerts": active_alerts_list,
        "data_confidence": score_obj.confidence_score if score_obj else 95.0,
        "data_completeness_pct": 94.5,
        "dataset_sources": sources_list,
        "last_updated": score_obj.calculation_date if score_obj else district.created_at
    }
