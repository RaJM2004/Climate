import sys
import os
import sqlite3
import requests

sys.path.insert(0, os.path.abspath("backend"))
from app.core.config import settings
from app.integrations.nasa_firms_client import NASAFIRMSClient

def main():
    print("=== NASA FIRMS LIVE API VERIFICATION ===")
    print(f"Base URL : {settings.NASA_FIRMS_BASE_URL}")
    print(f"Map Key  : {settings.NASA_FIRMS_MAP_KEY[:8]}... (Authenticated Free Key)")
    
    # 1. Raw API HTTP probe to NASA EOSDIS servers
    # URL format: https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/VIIRS_SNPP_NRT/68,6,97,37/1
    url = f"{settings.NASA_FIRMS_BASE_URL}/csv/{settings.NASA_FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/68,6,97,37/1"
    print(f"\nQuerying NASA EOSDIS endpoint: {url[:60]}...[KEY].../1")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"HTTP Status Code : {resp.status_code} ({'SUCCESS' if resp.status_code == 200 else 'FAILED'})")
        lines = resp.text.strip().split("\n")
        print(f"Total CSV Lines  : {len(lines)}")
        print("CSV Header Schema:")
        print("  ", lines[0] if len(lines) > 0 else "Empty")
        if len(lines) > 1:
            print("First Raw Detection Record:")
            print("  ", lines[1])
    except Exception as e:
        print(f"API Error: {e}")

    # 2. Test NASAFIRMSClient parsing
    client = NASAFIRMSClient()
    fires = client.fetch_active_fires()
    print(f"\nParsed Detections: {len(fires)} hotspots processed")
    if fires:
        sample = fires[0]
        print("Sample Detection Object:")
        for k, v in sample.items():
            print(f"  - {k}: {v}")

    # 3. Check SQLite database ingestion logs
    con = sqlite3.connect("backend/climate_intelligence.db")
    cur = con.cursor()
    cur.execute("SELECT id, source_key, status, records_ingested, details, timestamp FROM data_ingestion_logs WHERE source_key = 'nasa_firms' ORDER BY timestamp DESC LIMIT 3")
    rows = cur.fetchall()
    print("\nSQLite Data Ingestion Logs (nasa_firms):")
    for r in rows:
        print(f"  [Log #{r[0]}] Status: {r[2]} | Records: {r[3]} | Time: {r[5]} | Details: {r[4]}")
        
    # 4. Confirm separation of live detections vs seeded benchmark hazard records
    cur.execute("SELECT id, district_id, hazard_type, severity, source_name, status FROM hazard_events")
    hazards = cur.fetchall()
    print("\nHazard Records in Database:")
    for h in hazards:
        is_sat = "FIRMS" in h[4] or "VIIRS" in h[4]
        cat = "LIVE_SATELLITE_DETECTION" if is_sat else "SEEDED_BENCHMARK_EVENT"
        print(f"  [ID #{h[0]}] District: {h[1]} | Type: {h[2]} ({h[3]}) | Source: {h[4]} | Category: {cat}")

    con.close()

if __name__ == "__main__":
    main()

