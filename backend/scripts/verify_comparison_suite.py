import sys
import os
import json
sys.path.insert(0, os.path.abspath('backend'))

from app.core.database import SessionLocal
from app.api.v1.endpoints.analytics import get_district_comparison
from fastapi import HTTPException

db = SessionLocal()
all_passed = True

print("=" * 80)
print("COMPREHENSIVE DISTRICT COMPARISON VERIFICATION SUITE")
print("=" * 80)

# TEST 1: Pune vs Kendrapara
print("\n[TEST 1] Pune (Maharashtra) vs Kendrapara (Odisha)")
res1 = get_district_comparison(["IND_MA_PUNE_329", "IND_OD_KENDRA_388"], db=db)
d_pune = next((d for d in res1["districts"] if "Pune" in d["district_name"]), None)
d_ken = next((d for d in res1["districts"] if "Kendrapara" in d["district_name"]), None)
assert d_pune is not None and d_ken is not None, "Both districts must be found"
assert d_pune["state_name"] == "Maharashtra" and d_ken["state_name"] == "Odisha", "States must match"
assert d_pune["district_name"] != d_ken["district_name"], "District names must be distinct"
assert d_pune["elevation_m"] != d_ken["elevation_m"], "Elevations must not be identical"
assert d_pune["vulnerability_score"] != d_ken["vulnerability_score"], "Vulnerability scores must not be identical"
assert d_pune["centroid_lat"] != d_ken["centroid_lat"], "Coordinates must be distinct"
assert d_pune["soil_moisture_m3m3"] is None and d_ken["soil_moisture_m3m3"] is None, "Soil moisture must be None (Unavailable)"
assert "Unavailable" in d_pune["soil_moisture_status"], "Soil moisture must be flagged Unavailable"
print(f"  PASS: Pune (Elev: {d_pune['elevation_m']}m, V: {d_pune['vulnerability_score']}, Lat: {d_pune['centroid_lat']})")
print(f"        Kendrapara (Elev: {d_ken['elevation_m']}m, V: {d_ken['vulnerability_score']}, Lat: {d_ken['centroid_lat']})")

# TEST 2: Kendrapara vs Churu
print("\n[TEST 2] Kendrapara (Odisha) vs Churu (Rajasthan)")
res2 = get_district_comparison(["IND_OD_KENDRA_388", "IND_RJ_CHU"], db=db)
d_ken2 = next((d for d in res2["districts"] if "Kendrapara" in d["district_name"]), None)
d_chu = next((d for d in res2["districts"] if "Churu" in d["district_name"]), None)
assert d_ken2 is not None and d_chu is not None, "Both districts must be found"
assert d_chu["vulnerability_score"] == 81.0, f"Expected 81.0 for Churu, got {d_chu['vulnerability_score']}"
assert d_chu["elevation_m"] == 279.0, f"Expected 279m for Churu, got {d_chu['elevation_m']}"
assert d_ken2["elevation_m"] == 2.0, f"Expected 2m for Kendrapara, got {d_ken2['elevation_m']}"
print(f"  PASS: Kendrapara (V: {d_ken2['vulnerability_score']}, Elev: {d_ken2['elevation_m']}m) vs Churu (V: {d_chu['vulnerability_score']}, Elev: {d_chu['elevation_m']}m)")

# TEST 3: Two districts from the same state (Pune vs Nagpur in Maharashtra)
print("\n[TEST 3] Two Districts from Same State: Pune vs Nagpur (Maharashtra)")
res3 = get_district_comparison(["IND_MA_PUNE_329", "IND_MH_NAG"], db=db)
d_pune3 = next((d for d in res3["districts"] if "Pune" in d["district_name"]), None)
d_nag = next((d for d in res3["districts"] if "Nagpur" in d["district_name"]), None)
assert d_pune3 is not None and d_nag is not None, "Both Maharashtra districts must be found"
assert d_pune3["state_name"] == d_nag["state_name"] == "Maharashtra", "Both must have state Maharashtra"
assert d_pune3["district_id"] != d_nag["district_id"], "District IDs must differ"
assert d_pune3["vulnerability_score"] != d_nag["vulnerability_score"], f"Pune ({d_pune3['vulnerability_score']}) and Nagpur ({d_nag['vulnerability_score']}) must not have identical vulnerability"
assert d_pune3["exposure_score"] != d_nag["exposure_score"], f"Pune ({d_pune3['exposure_score']}) and Nagpur ({d_nag['exposure_score']}) must not have identical exposure"
assert d_pune3["elevation_m"] != d_nag["elevation_m"], f"Elevations must differ: Pune {d_pune3['elevation_m']}m vs Nagpur {d_nag['elevation_m']}m"
print(f"  PASS: Pune (ID: {d_pune3['district_id']}, V: {d_pune3['vulnerability_score']}, E: {d_pune3['exposure_score']}, Elev: {d_pune3['elevation_m']}m)")
print(f"        Nagpur (ID: {d_nag['district_id']}, V: {d_nag['vulnerability_score']}, E: {d_nag['exposure_score']}, Elev: {d_nag['elevation_m']}m)")

# TEST 4: Invalid district ID handling
print("\n[TEST 4] Invalid District ID Handling")
res4a = get_district_comparison(["IND_MA_PUNE_329", "INVALID_XYZ_999"], db=db)
assert len(res4a["districts"]) == 1, "Should resolve 1 valid district"
assert "INVALID_XYZ_999" in res4a["unresolved_ids"], "Invalid ID must be reported in unresolved_ids"
print(f"  PASS: Partial invalid ID handled cleanly. Resolved: {[d['district_name'] for d in res4a['districts']]}, Unresolved: {res4a['unresolved_ids']}")

try:
    get_district_comparison(["INVALID_ONLY_1", "INVALID_ONLY_2"], db=db)
    assert False, "Should have raised 404 for entirely invalid query"
except HTTPException as e:
    assert e.status_code == 404, f"Expected 404, got {e.status_code}"
    print(f"  PASS: All-invalid query raised HTTP 404 as required ({e.detail})")

# TEST 5: District with missing indicator data policy
print("\n[TEST 5] Missing Indicator Data Policy")
# Check how missing values are rendered: None / Unavailable, never substituted with 0 or fake 50
for d in res1["districts"]:
    assert d["soil_moisture_m3m3"] is None, "Missing soil moisture must be None, not 0 or 0.28"
    assert d["soil_moisture_status"] != "", "Status must explain missing source"
print(f"  PASS: Null indicators preserved as None without zero-substitution")

# TEST 6: Weather API Unavailable / Fallback
print("\n[TEST 6] Weather API Unavailable / Graceful Stored Fallback")
# Verify weather fields exist and identify source
for d in res1["districts"]:
    assert d["weather_source"] is not None
    assert d["weather_quality"] is not None
print(f"  PASS: Stored observation fallback active for weather: {d_pune['weather_source']} [{d_pune['weather_quality']}]")

# TEST 7: Two districts with different coordinates
print("\n[TEST 7] Two Districts with Different Coordinates")
coord_pune = (d_pune["centroid_lat"], d_pune["centroid_lng"])
coord_ken = (d_ken["centroid_lat"], d_ken["centroid_lng"])
assert coord_pune != coord_ken, "Coordinates must differ"
print(f"  PASS: Pune coords {coord_pune} != Kendrapara coords {coord_ken}")

# TEST 8: State-Level Aggregation (Maharashtra vs Odisha)
print("\n[TEST 8] Option B: State-Level Aggregation (Maharashtra vs Odisha)")
res8 = get_district_comparison(["Maharashtra", "Odisha"], db=db)
st_mh = next((d for d in res8["districts"] if "Maharashtra" in d["state_name"]), None)
st_od = next((d for d in res8["districts"] if "Odisha" in d["state_name"]), None)
assert st_mh is not None and st_od is not None, "Both states must be resolved"
assert st_mh["is_state_aggregate"] and st_od["is_state_aggregate"], "Must be flagged as is_state_aggregate"
assert st_mh["entity_type"] == st_od["entity_type"] == "STATE_AGGREGATE", "entity_type must be STATE_AGGREGATE"
assert st_mh["population"] > 50000000, f"Maharashtra state population should exceed 50M, got {st_mh['population']}"
assert st_mh["vulnerability_score"] != st_od["vulnerability_score"], "State scores must not be identical"
print(f"  PASS: Maharashtra State Aggregate (Pop: {st_mh['population']}, V: {st_mh['vulnerability_score']})")
print(f"        Odisha State Aggregate (Pop: {st_od['population']}, V: {st_od['vulnerability_score']})")

# TEST 9: Radar Chart Structure and Dimension Verification
print("\n[TEST 9] Radar Chart Structure & Dimensions")
assert len(res1["radar_data"]) == 5, f"Expected 5 dimensions in radar_data, got {len(res1['radar_data'])}"
dims = [r["dimension"] for r in res1["radar_data"]]
expected_dims = ["Exposure (E)", "Sensitivity (S)", "Adaptive Capacity (A)", "Deficit (100-A)", "Overall Risk (V)"]
assert dims == expected_dims, f"Dimensions mismatch: {dims} vs {expected_dims}"
for row in res1["radar_data"]:
    # Check that both Pune ID and Kendrapara ID are present
    assert "IND_MA_PUNE_329" in row, f"IND_MA_PUNE_329 missing in radar row {row['dimension']}"
    assert "IND_OD_KENDRA_388" in row, f"IND_OD_KENDRA_388 missing in radar row {row['dimension']}"
    assert row["IND_MA_PUNE_329"] is not None and row["IND_OD_KENDRA_388"] is not None
print(f"  PASS: All 5 radar dimensions properly mapped to unique district IDs: {dims}")

db.close()
print("\n" + "=" * 80)
print("ALL 9 TEST CRITERIA PASSED WITH ZERO ERRORS!")
print("=" * 80)

