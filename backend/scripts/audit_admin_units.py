import sqlite3
import json
import os

DB_PATH = "backend/climate_intelligence.db"
GEOJSON_PATH = "data/india_districts.json"

def audit():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("=== DATABASE STATES TABLE ===")
    states = c.execute("SELECT id, name, code, region FROM states ORDER BY name").fetchall()
    print(f"Total entries in states table: {len(states)}")
    for s in states:
        d_cnt = c.execute("SELECT count(*) FROM districts WHERE state_id = ?", (s[0],)).fetchone()[0]
        print(f"ID: {s[0]} | Name: '{s[1]}' | Code: {s[2]} | Region: {s[3]} | Districts: {d_cnt}")
        
    print("\n=== TOTAL DISTRICTS IN DB ===")
    d_total = c.execute("SELECT count(*) FROM districts").fetchone()[0]
    print(f"Total districts in DB: {d_total}")

    print("\n=== DISTRICTS WITHOUT GEOMETRY OR WITH INVALID COORDS ===")
    invalid_d = c.execute("SELECT id, name, state_name, centroid_lat, centroid_lng FROM districts WHERE centroid_lat IS NULL OR centroid_lng IS NULL OR geometry_geojson IS NULL").fetchall()
    print(f"Districts with null coords or geometry: {len(invalid_d)}")
    
    print("\n=== CHECK GEOJSON ===")
    if os.path.exists(GEOJSON_PATH):
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            gj = json.load(f)
        features = gj.get("features", [])
        print(f"Total features in GeoJSON: {len(features)}")
        gj_states = set(f.get("properties", {}).get("state_name") for f in features)
        print(f"Unique state_names in GeoJSON ({len(gj_states)}):")
        for st in sorted(gj_states):
            cnt = sum(1 for f in features if f.get("properties", {}).get("state_name") == st)
            print(f"  '{st}': {cnt} districts")

if __name__ == "__main__":
    audit()
