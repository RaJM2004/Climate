from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import State, District, VulnerabilityScore
from app.schemas.schemas import StateOut, StateDetailOut

router = APIRouter()

@router.get("", response_model=List[StateOut])
def get_states(
    type: Optional[str] = Query(None, description="Filter by 'STATE' or 'UNION_TERRITORY'"),
    region: Optional[str] = Query(None, description="Filter by geographical region"),
    db: Session = Depends(get_db)
):
    """
    Retrieves Indian administrative units (28 States & 8 Union Territories).
    Supports filtering by type=STATE or type=UNION_TERRITORY.
    """
    query = db.query(State)
    if type:
        norm_type = type.upper().strip()
        if norm_type in ["STATE", "STATES"]:
            query = query.filter(State.is_union_territory == False)
        elif norm_type in ["UNION_TERRITORY", "UT", "UNION_TERRITORIES"]:
            query = query.filter(State.is_union_territory == True)
    if region and region != "ALL":
        query = query.filter(State.region.ilike(f"%{region}%"))

    states = query.order_by(State.name.asc()).all()
    results = []
    for s in states:
        d_count = db.query(District).filter(District.state_id == s.id).count()
        results.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "region": s.region or "General",
            "is_union_territory": s.is_union_territory,
            "admin_type": s.admin_type or ("UNION_TERRITORY" if s.is_union_territory else "STATE"),
            "district_count": d_count
        })
    return results

@router.get("/union-territories", response_model=List[StateOut])
def get_union_territories(db: Session = Depends(get_db)):
    """Retrieves all 8 official Union Territories of India."""
    uts = db.query(State).filter(State.is_union_territory == True).order_by(State.name.asc()).all()
    results = []
    for s in uts:
        d_count = db.query(District).filter(District.state_id == s.id).count()
        results.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "region": s.region or "General",
            "is_union_territory": True,
            "admin_type": "UNION_TERRITORY",
            "district_count": d_count
        })
    return results

@router.get("/{state_id}", response_model=StateDetailOut)
def get_state_detail(state_id: str, db: Session = Depends(get_db)):
    """Retrieves state details, constituent districts, and aggregate vulnerability metrics."""
    # Look up by integer ID, code, or name
    st = None
    if state_id.isdigit():
        st = db.query(State).filter(State.id == int(state_id)).first()
    if not st:
        st = db.query(State).filter(State.code == state_id.upper()).first()
    if not st:
        st = db.query(State).filter(State.name.ilike(state_id)).first()
    if not st:
        raise HTTPException(status_code=404, detail=f"State or Union Territory '{state_id}' not found")

    districts = db.query(District).filter(District.state_id == st.id).all()
    dist_list = []
    total_score = 0.0
    for d in districts:
        sc = db.query(VulnerabilityScore).filter(
            VulnerabilityScore.district_id == d.id,
            VulnerabilityScore.is_current == True
        ).first()
        score = sc.vulnerability_score if sc else 50.0
        total_score += score
        dist_list.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "centroid_lat": d.centroid_lat,
            "centroid_lng": d.centroid_lng,
            "vulnerability_score": score,
            "category": sc.vulnerability_category if sc else "Moderate"
        })

    avg_score = round(total_score / len(districts), 1) if districts else 50.0

    return {
        "id": st.id,
        "name": st.name,
        "code": st.code,
        "region": st.region or "General",
        "is_union_territory": st.is_union_territory,
        "admin_type": st.admin_type or ("UNION_TERRITORY" if st.is_union_territory else "STATE"),
        "district_count": len(districts),
        "average_vulnerability_score": avg_score,
        "districts": dist_list
    }

