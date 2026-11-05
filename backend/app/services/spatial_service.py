"""
Spatial GIS Service
Provides point-in-polygon querying, GeoJSON boundary compilation,
and layer payload formatting using Shapely.
"""

import json
import os
from typing import Dict, Any, List, Optional
from shapely.geometry import shape, Point

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
GEOJSON_PATH = os.path.join(DATA_DIR, "india_districts.json")

def find_district_in_db(district_id: str, db):
    """
    Robust district lookup matching by exact ID, code, ILIKE name,
    or substring (e.g. IND_TN_MAD -> Madurai, IND_OD_KEN -> Kendrapara).
    """
    from app.models.models import District
    
    # 1. Exact ID
    d = db.query(District).filter(District.id == district_id).first()
    if d:
        return d
        
    # 2. Exact Code
    d = db.query(District).filter(District.code == district_id).first()
    if d:
        return d
        
    # 3. Exact Name (case-insensitive)
    d = db.query(District).filter(District.name.ilike(district_id)).first()
    if d:
        return d
        
    # 4. Partial ID match
    d = db.query(District).filter(District.id.ilike(f"%{district_id}%")).first()
    if d:
        return d
        
    # 5. Token match from compound IDs (e.g., IND_OD_KEN or IND_MH_NAG)
    if "_" in district_id:
        parts = [p for p in district_id.split("_") if len(p) >= 3 and not p.isdigit()]
        if parts:
            token = parts[-1]
            d = db.query(District).filter(
                (District.code.ilike(f"%{token}%")) | (District.name.ilike(f"{token}%"))
            ).first()
            if d:
                return d
            
def load_districts_geojson() -> Dict[str, Any]:
    """Loads India districts GeoJSON FeatureCollection."""
    if not os.path.exists(GEOJSON_PATH):
        return {"type": "FeatureCollection", "features": []}
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def find_district_by_coordinates(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """
    Performs Point-In-Polygon (PIP) analysis to identify which district contains the coordinates.
    """
    pt = Point(lng, lat)
    geojson_data = load_districts_geojson()
    
    for feat in geojson_data.get("features", []):
        try:
            poly = shape(feat["geometry"])
            if poly.contains(pt):
                return feat["properties"]
        except Exception:
            continue
            
    # Proximity fallback: find closest centroid within 1.0 degree
    closest_dist = float("inf")
    closest_prop = None
    for feat in geojson_data.get("features", []):
        props = feat.get("properties", {})
        c_lat = props.get("centroid_lat")
        c_lng = props.get("centroid_lng")
        if c_lat is not None and c_lng is not None:
            dist = (c_lat - lat)**2 + (c_lng - lng)**2
            if dist < closest_dist and dist < 1.0:
                closest_dist = dist
                closest_prop = props
                
    return closest_prop

def get_layer_geojson(layer_name: str, db_districts_map: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns GeoJSON tailored with properties and color styling for a requested map layer:
    - 'vulnerability': Overall composite vulnerability
    - 'rainfall': 24h rainfall observations
    - 'temperature': Surface temperatures
    - 'drought': Drought exposure index
    - 'flood': Flood exposure index
    - 'active_fires': NASA FIRMS active fire hotspots
    - 'population_exposure': Population density exposure
    """
    raw_geojson = load_districts_geojson()
    features = []
    
    for feat in raw_geojson.get("features", []):
        d_id = feat.get("id")
        props = dict(feat.get("properties", {}))
        
        # Merge latest dynamic DB state if present
        if d_id in db_districts_map:
            props.update(db_districts_map[d_id])
            
        # Add layer-specific styling and value
        if layer_name == "rainfall":
            rain = props.get("rainfall_24h", 0.0)
            props["layer_value"] = rain
            props["layer_unit"] = "mm/24h"
            if rain > 50:
                props["layer_color"] = "#1E3A8A" # Deep Blue
            elif rain > 20:
                props["layer_color"] = "#2563EB" # Blue
            elif rain > 5:
                props["layer_color"] = "#60A5FA" # Light Blue
            else:
                props["layer_color"] = "#CBD5E1" # Pale Slate
                
        elif layer_name == "temperature":
            temp = props.get("temp_c", 30.0)
            props["layer_value"] = temp
            props["layer_unit"] = "°C"
            if temp >= 42:
                props["layer_color"] = "#7F1D1D" # Severe Maroon
            elif temp >= 38:
                props["layer_color"] = "#DC2626" # Red
            elif temp >= 32:
                props["layer_color"] = "#F59E0B" # Amber
            else:
                props["layer_color"] = "#10B981" # Green
                
        elif layer_name == "flood":
            exp = props.get("exposure_score", 50.0)
            props["layer_value"] = exp
            props["layer_unit"] = "/100"
            props["layer_color"] = "#0284C7" if exp > 70 else "#38BDF8" if exp > 40 else "#E0F2FE"
            
        elif layer_name == "drought":
            d_val = props.get("drought_score", 45.0)
            props["layer_value"] = d_val
            props["layer_unit"] = "/100"
            props["layer_color"] = "#B45309" if d_val > 70 else "#F59E0B" if d_val > 40 else "#FEF3C7"
            
        elif layer_name == "population_exposure":
            pop = props.get("population", 1000000)
            props["layer_value"] = pop
            props["layer_unit"] = "persons"
            props["layer_color"] = "#4C1D95" if pop > 5000000 else "#7C3AED" if pop > 2000000 else "#C4B5FD"
            
        else: # Default: 'vulnerability'
            v_score = props.get("vulnerability_score", 50.0)
            props["layer_value"] = v_score
            props["layer_unit"] = "score (0-100)"
            props["layer_color"] = props.get("category_color", "#FBBF24")
            
        features.append({
            "type": "Feature",
            "id": d_id,
            "geometry": feat["geometry"],
            "properties": props
        })
        
    return {
        "type": "FeatureCollection",
        "layer": layer_name,
        "features": features
    }
