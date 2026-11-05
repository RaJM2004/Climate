from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import District, VulnerabilityScore, VulnerabilityIndicator, PopulationIndicator, RainfallObservation, TemperatureObservation, OfficialAlert, HazardEvent
from app.services.reporting_service import generate_district_pdf_report
from app.services.export_service import export_districts_to_csv, export_districts_to_excel

router = APIRouter()

def _gather_district_full_context(district_id: str, db: Session) -> dict:
    from app.services.spatial_service import find_district_in_db
    d = find_district_in_db(district_id, db)
    if not d:
        raise HTTPException(status_code=404, detail="District not found")
        
    sc = db.query(VulnerabilityScore).filter(VulnerabilityScore.district_id == d.id, VulnerabilityScore.is_current == True).first()
    pop = db.query(PopulationIndicator).filter(PopulationIndicator.district_id == d.id).first()
    rn = db.query(RainfallObservation).filter(RainfallObservation.district_id == d.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
    tm = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()
    alerts = db.query(OfficialAlert).filter(OfficialAlert.district_id == d.id, OfficialAlert.is_active == True).all()
    
    return {
        "id": d.id,
        "name": d.name,
        "state_name": d.state_name,
        "code": d.code,
        "zone": d.zone,
        "population": pop.total_population if pop else 1000000,
        "data_confidence": sc.confidence_score if sc else 95.0,
        "vulnerability": {
            "vulnerability_score": sc.vulnerability_score if sc else 50.0,
            "vulnerability_category": sc.vulnerability_category if sc else "Moderate",
            "exposure_score": sc.exposure_score if sc else 50.0,
            "sensitivity_score": sc.sensitivity_score if sc else 50.0,
            "adaptive_capacity_score": sc.adaptive_capacity_score if sc else 50.0,
        },
        "current_weather": {
            "temp_current_c": tm.temp_current_c if tm else 30.0,
            "rainfall_mm_24h": rn.rainfall_mm_24h if rn else 0.0,
            "weather_condition": tm.weather_condition if tm else "Fair",
            "station_name": tm.station_name if tm else f"{d.name} Station"
        },
        "active_alerts": [
            {
                "alert_type": a.alert_type,
                "severity": a.severity,
                "headline": a.headline,
                "issuing_authority": a.issuing_authority
            }
            for a in alerts
        ]
    }

@router.get("/pdf/{district_id}")
def download_district_pdf(district_id: str, db: Session = Depends(get_db)):
    """Generates and serves a formatted PDF assessment brief."""
    data = _gather_district_full_context(district_id, db)
    pdf_bytes = generate_district_pdf_report(data)
    
    filename = f"Climate_Brief_{data['name']}_{data['state_name']}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/csv")
def download_all_districts_csv(db: Session = Depends(get_db)):
    """Exports all districts and climate metrics to CSV."""
    districts = db.query(District).all()
    records = []
    for d in districts:
        sc = db.query(VulnerabilityScore).filter(VulnerabilityScore.district_id == d.id, VulnerabilityScore.is_current == True).first()
        pop = db.query(PopulationIndicator).filter(PopulationIndicator.district_id == d.id).first()
        rn = db.query(RainfallObservation).filter(RainfallObservation.district_id == d.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
        tm = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()
        
        records.append({
            "District ID": d.id,
            "District Name": d.name,
            "State": d.state_name,
            "Code": d.code,
            "Ecological Zone": d.zone,
            "Vulnerability Score (0-100)": sc.vulnerability_score if sc else None,
            "Vulnerability Tier": sc.vulnerability_category if sc else None,
            "Exposure Score": sc.exposure_score if sc else None,
            "Sensitivity Score": sc.sensitivity_score if sc else None,
            "Adaptive Capacity Score": sc.adaptive_capacity_score if sc else None,
            "Adaptive Deficit (100 - A)": round(100.0 - sc.adaptive_capacity_score, 1) if sc else None,
            "Population (Census)": pop.total_population if pop else None,
            "Current Temp (C)": tm.temp_current_c if tm else None,
            "24h Rainfall (mm)": rn.rainfall_mm_24h if rn else None,
            "Data Confidence (%)": sc.confidence_score if sc else None
        })
        
    csv_bytes = export_districts_to_csv(records)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="India_Climate_Vulnerability_Data.csv"'}
    )

@router.get("/export/excel")
def download_all_districts_excel(db: Session = Depends(get_db)):
    """Exports all districts and climate metrics to Excel (.xlsx)."""
    districts = db.query(District).all()
    records = []
    for d in districts:
        sc = db.query(VulnerabilityScore).filter(VulnerabilityScore.district_id == d.id, VulnerabilityScore.is_current == True).first()
        pop = db.query(PopulationIndicator).filter(PopulationIndicator.district_id == d.id).first()
        rn = db.query(RainfallObservation).filter(RainfallObservation.district_id == d.id).order_by(RainfallObservation.observation_timestamp.desc()).first()
        tm = db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d.id).order_by(TemperatureObservation.observation_timestamp.desc()).first()
        
        records.append({
            "District ID": d.id,
            "District Name": d.name,
            "State": d.state_name,
            "Code": d.code,
            "Ecological Zone": d.zone,
            "Vulnerability Score (0-100)": sc.vulnerability_score if sc else None,
            "Vulnerability Tier": sc.vulnerability_category if sc else None,
            "Exposure Score": sc.exposure_score if sc else None,
            "Sensitivity Score": sc.sensitivity_score if sc else None,
            "Adaptive Capacity Score": sc.adaptive_capacity_score if sc else None,
            "Adaptive Deficit (100 - A)": round(100.0 - sc.adaptive_capacity_score, 1) if sc else None,
            "Population (Census)": pop.total_population if pop else None,
            "Current Temp (C)": tm.temp_current_c if tm else None,
            "24h Rainfall (mm)": rn.rainfall_mm_24h if rn else None,
            "Data Confidence (%)": sc.confidence_score if sc else None
        })
        
    excel_bytes = export_districts_to_excel(records)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="India_Climate_Vulnerability_Report.xlsx"'}
    )
