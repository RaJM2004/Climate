from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import OfficialAlert, District, HazardEvent
from app.schemas.schemas import AlertOut

router = APIRouter()

@router.get("", response_model=List[AlertOut])
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: Yellow, Orange, Red"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    db: Session = Depends(get_db)
):
    """
    Retrieves official government meteorological and disaster warnings.
    Architecture rule: Never displays model estimates as official government alerts.
    """
    query = db.query(OfficialAlert).filter(OfficialAlert.is_active == True)
    if severity and severity != "ALL":
        query = query.filter(OfficialAlert.severity.ilike(severity))
    if alert_type and alert_type != "ALL":
        query = query.filter(OfficialAlert.alert_type.ilike(f"%{alert_type}%"))
        
    alerts = query.order_by(OfficialAlert.issue_timestamp.desc()).all()
    results = []
    
    for a in alerts:
        d = db.query(District).filter(District.id == a.district_id).first()
        results.append({
            "id": a.id,
            "district_id": a.district_id,
            "district_name": d.name if d else a.district_id,
            "state_name": d.state_name if d else "India",
            "alert_type": a.alert_type,
            "severity": a.severity,
            "headline": a.headline,
            "description": a.description,
            "issuing_authority": a.issuing_authority,
            "issue_timestamp": a.issue_timestamp,
            "valid_until": a.valid_until,
            "source_url": a.source_url,
            "is_benchmark": getattr(a, "is_benchmark", True),
            "verification_status": getattr(a, "verification_status", "BENCHMARK_DEMONSTRATION")
        })
    return results

@router.get("/hazards")
def get_recent_hazards(
    hazard_type: Optional[str] = Query(None),
    status: Optional[str] = Query("ACTIVE"),
    db: Session = Depends(get_db)
):
    """Retrieves observed environmental hazards (Floods, Fires, Heatwaves)."""
    query = db.query(HazardEvent)
    if status and status != "ALL":
        query = query.filter(HazardEvent.status == status)
    if hazard_type and hazard_type != "ALL":
        query = query.filter(HazardEvent.hazard_type.ilike(f"%{hazard_type}%"))
        
    hazards = query.order_by(HazardEvent.event_timestamp.desc()).all()
    res = []
    for h in hazards:
        d = db.query(District).filter(District.id == h.district_id).first()
        is_satellite = "FIRMS" in (h.source_name or "") or "VIIRS" in (h.source_name or "")
        res.append({
            "id": h.id,
            "district_id": h.district_id,
            "district_name": d.name if d else h.district_id,
            "state_name": d.state_name if d else "",
            "hazard_type": h.hazard_type,
            "severity": h.severity,
            "location_detail": h.location_detail,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "event_timestamp": h.event_timestamp,
            "source_name": h.source_name,
            "source_url": h.source_url,
            "status": h.status,
            "is_live_satellite_detection": is_satellite,
            "hazard_category": "LIVE_SATELLITE_DETECTION" if is_satellite else "SEEDED_BENCHMARK_EVENT"
        })
    return res
