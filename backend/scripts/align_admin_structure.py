import json
import sqlite3
import os
from shapely.geometry import shape

DATA_PATH = "data/india_districts.json"
DB_PATH = "backend/climate_intelligence.db"

TELANGANA_DISTRICTS = {
    "Adilabad", "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar",
    "Medak", "Nalgonda", "Nizamabad", "Rangareddi", "Warangal"
}

LADAKH_DISTRICTS = {
    "Kargil", "Ladakh (Leh)"
}

DNHDD_DISTRICTS = {
    "Dadra and Nagar Haveli", "Daman", "Diu"
}

OFFICIAL_ADMIN_UNITS = [
    # 28 States
    {"name": "Andhra Pradesh", "code": "AP", "region": "Southern", "is_ut": False},
    {"name": "Arunachal Pradesh", "code": "AR", "region": "North-Eastern", "is_ut": False},
    {"name": "Assam", "code": "AS", "region": "North-Eastern", "is_ut": False},
    {"name": "Bihar", "code": "BR", "region": "Eastern", "is_ut": False},
    {"name": "Chhattisgarh", "code": "CG", "region": "Central", "is_ut": False},
    {"name": "Goa", "code": "GA", "region": "Western", "is_ut": False},
    {"name": "Gujarat", "code": "GJ", "region": "Western", "is_ut": False},
    {"name": "Haryana", "code": "HR", "region": "Northern", "is_ut": False},
    {"name": "Himachal Pradesh", "code": "HP", "region": "Northern", "is_ut": False},
    {"name": "Jharkhand", "code": "JH", "region": "Eastern", "is_ut": False},
    {"name": "Karnataka", "code": "KA", "region": "Southern", "is_ut": False},
    {"name": "Kerala", "code": "KL", "region": "Southern", "is_ut": False},
    {"name": "Madhya Pradesh", "code": "MP", "region": "Central", "is_ut": False},
    {"name": "Maharashtra", "code": "MH", "region": "Western", "is_ut": False},
    {"name": "Manipur", "code": "MN", "region": "North-Eastern", "is_ut": False},
    {"name": "Meghalaya", "code": "ML", "region": "North-Eastern", "is_ut": False},
    {"name": "Mizoram", "code": "MZ", "region": "North-Eastern", "is_ut": False},
    {"name": "Nagaland", "code": "NL", "region": "North-Eastern", "is_ut": False},
    {"name": "Odisha", "code": "OD", "region": "Eastern", "is_ut": False},
    {"name": "Punjab", "code": "PB", "region": "Northern", "is_ut": False},
    {"name": "Rajasthan", "code": "RJ", "region": "Northern", "is_ut": False},
    {"name": "Sikkim", "code": "SK", "region": "North-Eastern", "is_ut": False},
    {"name": "Tamil Nadu", "code": "TN", "region": "Southern", "is_ut": False},
    {"name": "Telangana", "code": "TG", "region": "Southern", "is_ut": False},
    {"name": "Tripura", "code": "TR", "region": "North-Eastern", "is_ut": False},
    {"name": "Uttar Pradesh", "code": "UP", "region": "Northern", "is_ut": False},
    {"name": "Uttarakhand", "code": "UK", "region": "Northern", "is_ut": False},
    {"name": "West Bengal", "code": "WB", "region": "Eastern", "is_ut": False},
    # 8 Union Territories
    {"name": "Andaman and Nicobar Islands", "code": "AN", "region": "Islands", "is_ut": True},
    {"name": "Chandigarh", "code": "CH", "region": "Northern", "is_ut": True},
    {"name": "Dadra and Nagar Haveli and Daman and Diu", "code": "DH", "region": "Western", "is_ut": True},
    {"name": "Delhi", "code": "DL", "region": "Northern", "is_ut": True},
    {"name": "Jammu & Kashmir", "code": "JK", "region": "Northern", "is_ut": True},
    {"name": "Ladakh", "code": "LA", "region": "Northern", "is_ut": True},
    {"name": "Lakshadweep", "code": "LD", "region": "Islands", "is_ut": True},
    {"name": "Puducherry", "code": "PY", "region": "Southern", "is_ut": True},
]

def migrate_and_align():
    print("Aligning india_districts.json with official 28 States and 8 UTs...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        gj = json.load(f)
        
    updated_features = []
    geom_valid_count = 0
    geom_invalid_count = 0
    
    for feat in gj.get("features", []):
        props = dict(feat.get("properties", {}))
        d_name = props.get("district_name", "")
        curr_state = props.get("state_name", "")
        
        # Validate geometry
        try:
            poly = shape(feat["geometry"])
            if poly.is_valid:
                geom_valid_count += 1
            else:
                geom_invalid_count += 1
        except Exception:
            geom_invalid_count += 1
            
        # Reclassify to constitutional units
        if d_name in TELANGANA_DISTRICTS:
            props["state_name"] = "Telangana"
            props["zone"] = "Southern Deccan"
        elif d_name in LADAKH_DISTRICTS:
            props["state_name"] = "Ladakh"
            props["zone"] = "Trans-Himalayan Cold Desert"
        elif d_name in DNHDD_DISTRICTS or curr_state in ["Dadra and Nagar Haveli", "Daman and Diu"]:
            props["state_name"] = "Dadra and Nagar Haveli and Daman and Diu"
            props["zone"] = "Western Coastal"
        elif curr_state in ["Jammu and Kashmir", "Jammu & Kashmir"]:
            props["state_name"] = "Jammu & Kashmir"
            props["zone"] = "Western Himalayan"
            
        feat["properties"] = props
        updated_features.append(feat)
        
    gj["features"] = updated_features
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(gj, f, indent=2)
        
    print(f"Updated {len(updated_features)} GeoJSON features. Valid geometries: {geom_valid_count}, Invalid: {geom_invalid_count}")
    
    # Check states in updated GeoJSON
    final_states = set(f["properties"]["state_name"] for f in updated_features)
    print(f"Total distinct state_name in GeoJSON: {len(final_states)}")
    expected_names = set(u["name"] for u in OFFICIAL_ADMIN_UNITS)
    missing = expected_names - final_states
    extra = final_states - expected_names
    print(f"Missing from official: {missing}")
    print(f"Extra not in official: {extra}")

if __name__ == "__main__":
    migrate_and_align()
