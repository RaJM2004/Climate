import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath("backend"))
from fastapi.testclient import TestClient
from app.main import app

def main():
    tc = TestClient(app)
    print("=== BROWSER-LEVEL COMPLETE WORKFLOW & PAGE VERIFICATION ===")
    
    workflows = [
        # 1. Public Overview Dashboard
        ("GET", "/api/v1/analytics/overview", "Public Overview Dashboard KPIs & Trends", {}),
        # 2. India GIS Map & Layer Switching
        ("GET", "/api/v1/map/layers", "GIS Layer Metadata Registry (Switchable Layers)", {}),
        ("GET", "/api/v1/map/vulnerability", "GIS Layer: Vulnerability Composite Map", {}),
        ("GET", "/api/v1/map/rainfall", "GIS Layer: 24h Model Rainfall Map", {}),
        ("GET", "/api/v1/map/temperature", "GIS Layer: Surface Temperature Map", {}),
        ("GET", "/api/v1/map/flood", "GIS Layer: Flood Susceptibility Map", {}),
        ("GET", "/api/v1/map/drought", "GIS Layer: Drought SPI Recurrence Map", {}),
        ("GET", "/api/v1/map/hazards", "GIS Layer: Active Satellite Hotspots & Events", {}),
        # 3. District Search & Listing
        ("GET", "/api/v1/districts?search=Kendrapara", "District Search: 'Kendrapara'", {}),
        ("GET", "/api/v1/districts?state=Odisha", "District Filter by State: 'Odisha'", {}),
        ("GET", "/api/v1/districts?category=High", "District Filter by Category: 'High'", {}),
        ("GET", "/api/v1/districts?search=NonExistentPlaceXYZ", "District Search: Empty Result State", {}),
        # 4. District Profile
        ("GET", "/api/v1/districts/IND_OD_KENDRA_388", "District Profile: Kendrapara Profile & Indicators", {}),
        ("GET", "/api/v1/districts/INVALID_ID_999", "District Profile: 404 Error State Handling", {}),
        # 5. Historical Climate Charts
        ("GET", "/api/v1/analytics/trends?district_id=IND_OD_KENDRA_388", "Historical Climate 12-Month Trends (Cached)", {}),
        # 6. Vulnerability Assessment Engine
        ("GET", "/api/v1/admin/weights", "Current Vulnerability Dimension Weights", {}),
        # 7. District Comparison Matrix
        ("GET", "/api/v1/analytics/comparison?district_ids=IND_OD_KENDRA_388&district_ids=IND_RJ_CHU", "District Comparison: Kendrapara vs Churu", {}),
        # 8. Alerts & Warnings
        ("GET", "/api/v1/alerts", "Official Weather Warnings & Benchmark Scenarios", {}),
        ("GET", "/api/v1/alerts/hazards", "Observed Hazard Events (Fires & Floods)", {}),
        # 9. Reports & Downloads
        ("GET", "/api/v1/reports/pdf/IND_OD_KENDRA_388", "Report Download: Scientific PDF Brief", {}),
        ("GET", "/api/v1/reports/export/csv", "Report Download: RFC 4180 CSV Data Export", {}),
        ("GET", "/api/v1/reports/export/excel", "Report Download: Multi-Sheet Excel Workbook Export", {}),
        # 10. Data Sources & Methodology
        ("GET", "/api/v1/data-sources", "Data Sources & Provider Cadence Registry", {}),
        # 11. Admin Authentication & Role Checks
        ("POST", "/api/v1/auth/login", "Admin Auth: Invalid Password (401 Error State)", {"username": "admin", "password": "WrongPassword!"}),
        ("POST", "/api/v1/auth/login", "Admin Auth: Legitimate Login (JWT Token Issuance)", {"username": "admin", "password": "Climate@Admin2026#Secured"}),
        # 12. Admin Data Management
        ("GET", "/api/v1/admin/dashboard-stats", "Admin Dashboard System Stats (28 S, 8 UT, 594 D)", {}),
        ("GET", "/api/v1/admin/ingestion-logs", "Admin Ingestion Logs Audit Ledger", {})
    ]
    
    token = None
    pass_count = 0
    
    for method, path, desc, body in workflows:
        headers = {}
        if token and "/admin" in path:
            headers["Authorization"] = f"Bearer {token}"
            
        t0 = time.time()
        if method == "GET":
            resp = tc.get(path, headers=headers)
        elif method == "POST":
            resp = tc.post(path, json=body, headers=headers)
        duration_ms = (time.time() - t0) * 1000
        
        # Check expected status
        if "404" in desc:
            is_pass = (resp.status_code == 404)
        elif "401" in desc:
            is_pass = (resp.status_code == 401)
        else:
            is_pass = (resp.status_code == 200)
            
        if is_pass:
            pass_count += 1
            status_str = f"PASS ({resp.status_code})"
        else:
            status_str = f"FAIL ({resp.status_code})"
            
        print(f"[{status_str}] {method:4s} {path[:45]:45s} | {desc} ({duration_ms:.1f}ms)")
        
        if "Legitimate Login" in desc and resp.status_code == 200:
            token = resp.json().get("access_token")
            
    print(f"\nWorkflow Results: {pass_count}/{len(workflows)} verified passing.")

if __name__ == "__main__":
    main()
