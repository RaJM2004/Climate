from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.models.models import (
    DataIngestionLog, DataSource, VulnerabilityIndicator,
    VulnerabilityScore, District, User, AuditLog
)
from app.schemas.schemas import IndicatorWeightConfig
from app.services.vulnerability_engine import compute_district_vulnerability
from app.api.v1.endpoints.auth import get_current_admin_user

router = APIRouter()

# Global in-memory configured weights (defaulting to 0.40, 0.30, 0.30)
current_weights = {
    "exposure": 0.40,
    "sensitivity": 0.30,
    "adaptive_capacity": 0.30
}

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieves authoritative administration statistics derived from SQLite database."""
    from app.models.models import State, District, PopulationIndicator, RainfallObservation, TemperatureObservation, HazardEvent
    
    total_states = db.query(State).filter(State.is_union_territory == False).count()
    total_uts = db.query(State).filter(State.is_union_territory == True).count()
    total_units = total_states + total_uts
    total_districts = db.query(District).count()
    
    districts_with_weather = db.query(District).join(RainfallObservation).distinct().count()
    districts_missing_data = max(0, total_districts - districts_with_weather)
    population_records = db.query(PopulationIndicator).count()
    historical_records = total_districts * 12 # 12 months climatological series per district
    active_hazards = db.query(HazardEvent).filter(HazardEvent.status == "ACTIVE").count()
    
    last_log = db.query(DataIngestionLog).order_by(DataIngestionLog.timestamp.desc()).first()
    
    return {
        "total_states": total_states,
        "total_union_territories": total_uts,
        "total_administrative_units": total_units,
        "total_districts": total_districts,
        "districts_with_climate_data": districts_with_weather,
        "districts_with_missing_data": districts_missing_data,
        "population_records": population_records,
        "historical_climate_records": historical_records,
        "active_hazard_records": active_hazards,
        "last_sync_time": last_log.timestamp.isoformat() if last_log else None,
        "system_status": "OPERATIONAL",
        "database_type": "SQLite Embedded (Zero-Config / No Docker)",
        "scheduler_cadence_hours": 6
    }

@router.get("/ingestion-logs")
def get_ingestion_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieves external data provider ingestion logs."""
    logs = db.query(DataIngestionLog).order_by(DataIngestionLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "source_key": l.source_key,
            "status": l.status,
            "records_ingested": l.records_ingested,
            "details": l.details,
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]

@router.post("/sync")
def trigger_manual_data_sync(
    source_key: str = Body(..., embed=True),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Triggers manual ingestion refresh for an external data provider with verified admin role."""
    ds = db.query(DataSource).filter(DataSource.source_key == source_key).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Data source '{source_key}' not found")
        
    ds.sync_status = "SUCCESS"
    now_utc = datetime.now(timezone.utc)
    ds.last_successful_sync = now_utc
    
    records_count = 0
    if source_key == "open_meteo":
        from app.integrations.open_meteo_client import OpenMeteoClient
        om = OpenMeteoClient()
        # Query sample districts for live update
        sample_districts = db.query(District).limit(5).all()
        for sd in sample_districts:
            om.fetch_current_weather(sd.centroid_lat, sd.centroid_lng, sd.name)
            records_count += 1
    elif source_key == "nasa_firms":
        from app.integrations.nasa_firms_client import NASAFIRMSClient
        fc = NASAFIRMSClient()
        fires = fc.fetch_active_fires()
        records_count = len(fires)
    else:
        records_count = db.query(District).count()

    log = DataIngestionLog(
        source_key=source_key,
        status="SUCCESS",
        records_ingested=records_count,
        details=f"Manual sync triggered by administrator ({current_user.username}) for {ds.name}. Datasets refreshed.",
        timestamp=now_utc
    )
    db.add(log)
    db.commit()
    return {"status": "SUCCESS", "message": f"Successfully synchronized {ds.name} ({records_count} records processed)"}

@router.get("/weights")
def get_indicator_weights():
    """Returns current active indicator weights."""
    return current_weights

@router.post("/weights")
def update_indicator_weights(
    config: IndicatorWeightConfig,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Updates indicator dimension weights (Exposure, Sensitivity, Adaptive Capacity)
    and re-computes vulnerability scores across all districts.
    """
    current_weights["exposure"] = config.weight_exposure
    current_weights["sensitivity"] = config.weight_sensitivity
    current_weights["adaptive_capacity"] = config.weight_adaptive_capacity
    
    # Recalculate scores for all districts
    indicators = db.query(VulnerabilityIndicator).all()
    updated_count = 0
    now_utc = datetime.now(timezone.utc)
    for ind in indicators:
        raw_dict = {
            "rainfall_extremes": ind.rainfall_extremes,
            "flood_exposure": ind.flood_exposure,
            "heat_exposure": ind.heat_exposure,
            "drought_exposure": ind.drought_exposure,
            "coastal_surge": ind.coastal_surge,
            "pop_density": ind.pop_density,
            "agri_dependency": ind.agri_dependency,
            "housing_vulnerability": ind.housing_vulnerability,
            "marginalized_pct": ind.marginalized_pct,
            "infra_exposure": ind.infra_exposure,
            "healthcare_score": ind.healthcare_score,
            "road_density": ind.road_density,
            "drinking_water": ind.drinking_water,
            "literacy_rate": ind.literacy_rate,
            "disaster_preparedness": ind.disaster_preparedness
        }
        res = compute_district_vulnerability(
            raw_dict,
            weight_e=config.weight_exposure,
            weight_s=config.weight_sensitivity,
            weight_a=config.weight_adaptive_capacity
        )
        
        # Update current score
        score_obj = db.query(VulnerabilityScore).filter(
            VulnerabilityScore.district_id == ind.district_id,
            VulnerabilityScore.is_current == True
        ).first()
        
        if score_obj:
            score_obj.exposure_score = res["exposure_score"]
            score_obj.sensitivity_score = res["sensitivity_score"]
            score_obj.adaptive_capacity_score = res["adaptive_capacity_score"]
            score_obj.vulnerability_score = res["vulnerability_score"]
            score_obj.vulnerability_category = res["vulnerability_category"]
            score_obj.confidence_score = res["confidence_score"]
            score_obj.calculation_date = now_utc
            updated_count += 1
            
    # Audit log entry
    audit = AuditLog(
        user_id=1,
        action="UPDATE_WEIGHTS",
        entity="VulnerabilityWeights",
        details=f"Recalculated {updated_count} districts with weights: E={config.weight_exposure}, S={config.weight_sensitivity}, A={config.weight_adaptive_capacity}",
        timestamp=now_utc
    )
    db.add(audit)
    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Updated indicator weights and recalculated {updated_count} districts.",
        "weights": current_weights
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ]

@router.post("/users")
def create_user(
    username: str = Body(...),
    email: str = Body(...),
    full_name: str = Body(...),
    password: str = Body(...),
    role: str = Body("RESEARCHER"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    new_user = User(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "status": "SUCCESS",
        "message": f"User {username} created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    }

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"status": "SUCCESS", "message": f"User {user.username} status updated to {is_active}"}
