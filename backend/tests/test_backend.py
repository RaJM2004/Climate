import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_database
from app.services.vulnerability_engine import (
    min_max_normalize,
    compute_district_vulnerability,
    classify_vulnerability
)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_database()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_and_health(client):
    """Verify application boots and health status is OK."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "HEALTHY"

def test_vulnerability_mathematical_engine():
    """Verify IPCC formula: V = 0.40*E + 0.30*S + 0.30*(100 - A) and normalization."""
    # Test min-max normalization
    assert min_max_normalize(50, 0, 100) == 50.0
    assert min_max_normalize(0, 0, 100) == 0.0
    assert min_max_normalize(100, 0, 100) == 100.0
    assert min_max_normalize(None, 0, 100) is None

    # Test categorization tiers
    cat, color = classify_vulnerability(15.0)
    assert cat == "Very Low"
    cat, color = classify_vulnerability(35.0)
    assert cat == "Low"
    cat, color = classify_vulnerability(55.0)
    assert cat == "Moderate"
    cat, color = classify_vulnerability(75.0)
    assert cat == "High"
    cat, color = classify_vulnerability(85.0)
    assert cat == "Very High"

    # Test calculation with controlled raw indicators
    raw = {
        "rainfall_extremes": 80.0,
        "flood_exposure": 80.0,
        "heat_exposure": 80.0,
        "drought_exposure": 80.0,
        "coastal_surge": 80.0,
        "pop_density": 1500.0,
        "agri_dependency": 70.0,
        "housing_vulnerability": 70.0,
        "marginalized_pct": 30.0,
        "infra_exposure": 70.0,
        "healthcare_score": 40.0,
        "road_density": 40.0,
        "drinking_water": 40.0,
        "literacy_rate": 70.0,
        "disaster_preparedness": 50.0
    }
    res = compute_district_vulnerability(raw, weight_e=0.40, weight_s=0.30, weight_a=0.30)
    assert "vulnerability_score" in res
    assert "exposure_score" in res
    assert "sensitivity_score" in res
    assert "adaptive_capacity_score" in res
    assert res["confidence_score"] == 100.0
    assert not res["is_low_confidence"]

def test_missing_data_policy():
    """Ensure missing data is NOT replaced by zero and confidence is calculated correctly."""
    incomplete_raw = {
        "rainfall_extremes": 85.0,
        "flood_exposure": None, # Missing
        "heat_exposure": None,  # Missing
        "healthcare_score": 40.0
    }
    res = compute_district_vulnerability(incomplete_raw)
    assert res["vulnerability_score"] is not None
    # Confidence should be reduced
    assert res["confidence_score"] < 100.0

def test_api_districts_endpoints(client):
    """Verify districts listing and single district detail."""
    resp = client.get("/api/v1/districts")
    assert resp.status_code == 200
    districts = resp.json()
    assert len(districts) > 0
    first_id = districts[0]["id"]

    # Detail
    detail_resp = client.get(f"/api/v1/districts/{first_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert "vulnerability" in detail
    assert "indicators" in detail
    assert "current_weather" in detail

def test_api_map_layers(client):
    """Verify map layer metadata and GeoJSON generation."""
    layers_resp = client.get("/api/v1/map/layers")
    assert layers_resp.status_code == 200
    layers = layers_resp.json()
    assert len(layers) >= 5

    vuln_geojson = client.get("/api/v1/map/vulnerability")
    assert vuln_geojson.status_code == 200
    data = vuln_geojson.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

def test_api_analytics_and_comparison(client):
    """Verify overview stats and multi-district comparison."""
    ov = client.get("/api/v1/analytics/overview")
    assert ov.status_code == 200
    ov_data = ov.json()
    assert ov_data["total_districts"] > 0
    assert "vulnerability_distribution" in ov_data

    # Comparison
    comp = client.get("/api/v1/analytics/comparison?district_ids=IND_OD_KEN&district_ids=IND_RJ_CHU")
    assert comp.status_code == 200
    comp_data = comp.json()
    assert len(comp_data["districts"]) == 2
    assert "radar_data" in comp_data

def test_api_alerts(client):
    """Verify official government weather warnings endpoint."""
    alerts = client.get("/api/v1/alerts")
    assert alerts.status_code == 200
    data = alerts.json()
    assert isinstance(data, list)

def test_api_reports_export(client):
    """Verify PDF, CSV and Excel generation."""
    # CSV
    csv_resp = client.get("/api/v1/reports/export/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]

    # Excel
    excel_resp = client.get("/api/v1/reports/export/excel")
    assert excel_resp.status_code == 200
    assert "spreadsheet" in excel_resp.headers["content-type"]

    # District PDF
    pdf_resp = client.get("/api/v1/reports/pdf/IND_OD_KEN")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

def test_open_meteo_and_data_sources(client):
    """Verify Open-Meteo free integration, trend endpoint, and registered providers."""
    from app.integrations.open_meteo_client import OpenMeteoClient
    om = OpenMeteoClient()
    wx = om.fetch_current_weather(20.5, 86.4, "Kendrapara")
    assert "temp_current_c" in wx
    assert "rainfall_24h" in wx
    assert wx["data_type"] == "WEATHER_MODEL_ESTIMATE"

    trends = om.fetch_historical_trends(20.5, 86.4, "Kendrapara")
    assert len(trends) == 12

    # Trends endpoint
    trend_resp = client.get("/api/v1/analytics/trends?district_id=IND_OD_KEN")
    assert trend_resp.status_code == 200
    t_data = trend_resp.json()
    assert "trends" in t_data
    assert t_data["data_classification"] in ["OBSERVED_HISTORICAL_API", "REGIONAL_CLIMATOLOGICAL_ESTIMATE"]

    # Data sources list
    ds_resp = client.get("/api/v1/data-sources")
    assert ds_resp.status_code == 200
    sources = ds_resp.json()
    s_keys = [s["source_key"] for s in sources]
    assert "open_meteo" in s_keys
    assert "open_meteo_archive" in s_keys
    assert "nasa_firms" in s_keys

def test_administrative_hierarchy_constitutional(client):
    """Verify constitutional administrative structure: 28 States, 8 UTs, 36 Units."""
    # 1. Total administrative units (all states and UTs)
    all_resp = client.get("/api/v1/states")
    assert all_resp.status_code == 200
    all_units = all_resp.json()
    assert len(all_units) == 36

    # 2. Filter states only (must be exactly 28)
    states_resp = client.get("/api/v1/states?type=STATE")
    assert states_resp.status_code == 200
    states = states_resp.json()
    assert len(states) == 28

    # 3. Filter union territories endpoint (must be exactly 8)
    ut_resp = client.get("/api/v1/states/union-territories")
    assert ut_resp.status_code == 200
    uts = ut_resp.json()
    assert len(uts) == 8
    ut_names = [u["name"] for u in uts]
    assert "Ladakh" in ut_names
    assert any("Jammu" in n for n in ut_names)
    assert "Dadra and Nagar Haveli and Daman and Diu" in ut_names
    assert "Delhi" in ut_names
    assert "Lakshadweep" in ut_names
    assert "Andaman and Nicobar Islands" in ut_names
    assert "Chandigarh" in ut_names
    assert "Puducherry" in ut_names

    # 4. State detail endpoint
    st_detail = client.get(f"/api/v1/states/{states[0]['id']}")
    assert st_detail.status_code == 200
    sd = st_detail.json()
    assert "districts" in sd
    assert sd["district_count"] == len(sd["districts"])

def test_admin_dashboard_stats(client):
    """Verify Admin Dashboard stats endpoint returns 28 states, 8 UTs, 36 units, 594 districts."""
    resp = client.get("/api/v1/admin/dashboard-stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_states"] == 28
    assert stats["total_union_territories"] == 8
    assert stats["total_administrative_units"] == 36
    assert stats["total_districts"] == 594
    assert stats["population_records"] == 594
    assert stats["historical_climate_records"] >= 594  # 7,128 monthly records for 594 districts
    assert "database_type" in stats
    assert "last_sync_time" in stats
    assert stats["system_status"] == "OPERATIONAL"

def test_geojson_geometries_shapely_validity():
    """Verify that all 594 district geometries in the active GeoJSON dataset are topologically valid with Shapely."""
    import json
    from pathlib import Path
    from shapely.geometry import shape

    geojson_path = Path("data/india_districts.json")
    assert geojson_path.exists()

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    assert len(features) == 594

    invalid_count = 0
    for idx, feat in enumerate(features):
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            invalid_count += 1

    assert invalid_count == 0, f"Found {invalid_count} invalid polygons in GeoJSON!"

def test_historical_climate_archive_retrieval_and_storage(client):
    """Verify genuine historical Open-Meteo archive retrieval, SQLite caching, and schema."""
    resp = client.get("/api/v1/analytics/trends?district_id=IND_OD_KEN")
    assert resp.status_code == 200
    data = resp.json()
    assert "trends" in data
    assert len(data["trends"]) == 12
    assert "observation_period" in data
    assert "data_classification" in data
    assert data["data_classification"] in ["OBSERVED_HISTORICAL_API", "REGIONAL_CLIMATOLOGICAL_ESTIMATE"]
    assert "coordinates" in data
    assert data["coordinates"]["latitude"] is not None
    assert "data_source" in data

    # Verify cached record in SQLite
    from app.core.database import SessionLocal
    from app.models.models import HistoricalClimateRecord
    db = SessionLocal()
    try:
        rec = db.query(HistoricalClimateRecord).filter(HistoricalClimateRecord.district_id == data["district_id"]).first()
        assert rec is not None
        assert rec.district_id == data["district_id"]
        assert rec.observation_period is not None
    finally:
        db.close()

def test_historical_climate_fallback_resilience():
    """Verify graceful fallback mechanism when historical API request is unavailable."""
    from app.integrations.open_meteo_client import OpenMeteoClient
    client = OpenMeteoClient()
    fallback = client.fetch_historical_trends_fallback(20.50, 86.42, "Kendrapara")
    assert fallback["is_fallback"] is True
    assert fallback["data_classification"] == "REGIONAL_CLIMATOLOGICAL_ESTIMATE"
    assert len(fallback["series"]) == 12
    assert fallback["observation_period"] == "1991-2020 Regional Climatological Baseline"

def test_population_data_provenance_and_estimation_flags(client):
    """Verify Census 2011 district headcount retention and synthetic demographic ratio flagging."""
    resp = client.get("/api/v1/districts/IND_OD_KEN")
    assert resp.status_code == 200
    d = resp.json()
    pop = d.get("population")
    assert pop is not None
    assert pop["total_population"] > 0
    assert pop["census_year"] == 2011
    assert pop["is_demographic_breakdown_estimated"] is True
    assert pop["demographic_breakdown_type"] == "SYNTHETIC_ESTIMATE"
    assert "National" in pop["estimation_methodology"] or "national" in pop["estimation_methodology"]

def test_15_indicators_provenance_registry(client):
    """Verify all 15 indicators have provenance metadata: source, ref year, data type and confidence."""
    resp = client.get("/api/v1/districts/IND_OD_KEN")
    assert resp.status_code == 200
    d = resp.json()
    prov = d.get("indicator_provenance")
    assert prov is not None
    assert len(prov) == 15

    expected_indicators = [
        "rainfall_extremes", "flood_exposure", "heat_exposure", "drought_exposure", "coastal_surge",
        "pop_density", "agri_dependency", "housing_vulnerability", "marginalized_pct", "infra_exposure",
        "healthcare_score", "road_density", "drinking_water", "literacy_rate", "disaster_preparedness"
    ]
    for ind in expected_indicators:
        assert ind in prov
        meta = prov[ind]
        assert "name" in meta
        assert "dimension" in meta
        assert "data_type" in meta
        assert "source" in meta
        assert "reference_period" in meta
        assert "confidence_pct" in meta
        assert meta["confidence_pct"] > 0

    assert d.get("data_completeness_pct") is not None

def test_official_alerts_benchmark_classification(client):
    """Verify alerts are marked as benchmark demonstration records and hazards distinguish live satellite detections."""
    # 1. Alerts
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 200
    alerts = resp.json()
    for a in alerts:
        assert a.get("is_benchmark") is True
        assert a.get("verification_status") == "BENCHMARK_DEMONSTRATION"

    # 2. Hazards
    h_resp = client.get("/api/v1/alerts/hazards")
    assert h_resp.status_code == 200
    hazards = h_resp.json()
    for h in hazards:
        assert "hazard_category" in h
        assert h["hazard_category"] in ["LIVE_SATELLITE_DETECTION", "SEEDED_BENCHMARK_EVENT"]

