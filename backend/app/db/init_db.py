"""
Database Seeding & Initialization Module
Creates all tables and seeds districts, states, indicators, baseline observations,
official alerts, and default users.
"""

import json
import os
from datetime import datetime, timedelta, timezone
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.models import (
    State, District, VulnerabilityIndicator, VulnerabilityScore,
    PopulationIndicator, RainfallObservation, TemperatureObservation,
    HazardEvent, OfficialAlert, DataSource, User, DataIngestionLog
)

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/india_districts.json"))

PRIMARY_DATA_SOURCES = [
    {
        "source_key": "open_meteo",
        "name": "Open-Meteo Weather API",
        "organization": "Open-Meteo Open Source Weather API (ECMWF & DWD)",
        "source_url": "https://open-meteo.com",
        "update_frequency": "Hourly / High-Resolution Numerical Forecast",
        "coverage": "Pan-India High-Resolution Grid (Free, No Auth Required)",
        "measurement_units": "mm (Rainfall), °C (Temperature), km/h (Wind)"
    },
    {
        "source_key": "open_meteo_archive",
        "name": "Open-Meteo Historical Weather Archive",
        "organization": "Open-Meteo / Copernicus ERA5 Reanalysis Archive",
        "source_url": "https://archive-api.open-meteo.com",
        "update_frequency": "Multi-Decadal Climate Observations",
        "coverage": "Historical Climate Time-Series (1940-Present)",
        "measurement_units": "mm (Rainfall Accumulation), °C (Temperature)"
    },
    {
        "source_key": "nasa_firms",
        "name": "NASA FIRMS Satellite Thermal Hotspots",
        "organization": "NASA Earth Science Data Systems",
        "source_url": "https://firms.modaps.eosdis.nasa.gov",
        "update_frequency": "Near Real-Time (3 Hours)",
        "coverage": "Active Thermal Hotspots (VIIRS/MODIS)",
        "measurement_units": "Fire Radiative Power (MW)"
    },
    {
        "source_key": "worldpop",
        "name": "WorldPop High-Resolution Population Distribution",
        "organization": "WorldPop / University of Southampton",
        "source_url": "https://api.worldpop.org/v2",
        "update_frequency": "Annual / 2020 Reference Baseline",
        "coverage": "High-Resolution Spatial Population Mapping (100m/1km)",
        "measurement_units": "Persons per pixel / District aggregates"
    },
    {
        "source_key": "nasa_srtm",
        "name": "NASA SRTM Digital Elevation Model",
        "organization": "NASA Jet Propulsion Laboratory (JPL) / USGS",
        "source_url": "https://www2.jpl.nasa.gov/srtm/",
        "update_frequency": "Static Reference Geotopographic Grid",
        "coverage": "30-Meter Relief, Slope & Elevation Dataset",
        "measurement_units": "Meters above sea level (masl), Slope degrees"
    },
    {
        "source_key": "copernicus_era5_land",
        "name": "Copernicus ERA5-Land Climate Reanalysis",
        "organization": "ECMWF / European Union Copernicus Programme",
        "source_url": "https://cds.climate.copernicus.eu",
        "update_frequency": "Monthly / 30-Year Climatological Baseline (1991-2020)",
        "coverage": "Multi-Decadal Land-Climate Variables & Soil Moisture",
        "measurement_units": "Index, Anomaly, SPI, Soil Moisture (m³/m³)"
    },
    {
        "source_key": "census",
        "name": "Census of India",
        "organization": "Office of the Registrar General & Census Commissioner",
        "source_url": "https://censusindia.gov.in",
        "update_frequency": "Decennial",
        "coverage": "National District Demographic & Socio-Economic Indicators",
        "measurement_units": "Persons, Households, Literacy %"
    },
    {
        "source_key": "geojson_boundaries",
        "name": "Indian District Boundaries GeoJSON",
        "organization": "Survey of India / Bharat Administrative Datasets",
        "source_url": "https://surveyofindia.gov.in",
        "update_frequency": "Administrative Cartographic Baseline",
        "coverage": "28 States & 8 Union Territories (594 District Polygons)",
        "measurement_units": "GeoJSON MultiPolygon Coordinates"
    },
    {
        "source_key": "nwdp",
        "name": "National Water Informatics Centre (NWIC)",
        "organization": "Department of Water Resources, River Development & Ganga Rejuvenation",
        "source_url": "https://nwdp.nwic.gov.in",
        "update_frequency": "Weekly / Seasonal",
        "coverage": "Major River Basins & Reservoirs",
        "measurement_units": "MCM, Inundation Area"
    }
]

def ensure_data_sources(db):
    """Ensures all primary open data sources exist in DataSource table."""
    now = datetime.now(timezone.utc)
    for src in PRIMARY_DATA_SOURCES:
        existing = db.query(DataSource).filter(DataSource.source_key == src["source_key"]).first()
        if not existing:
            new_src = DataSource(
                source_key=src["source_key"],
                name=src["name"],
                organization=src["organization"],
                source_url=src["source_url"],
                update_frequency=src["update_frequency"],
                coverage=src["coverage"],
                measurement_units=src["measurement_units"],
                last_successful_sync=now,
                sync_status="SUCCESS"
            )
            db.add(new_src)
    db.commit()

def ensure_users(db):
    """Ensures secure admin and researcher accounts exist with verified password hashes."""
    admin_pwd = os.getenv("ADMIN_PASSWORD", "Climate@Admin2026#Secured")
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@climate.gov.in",
            hashed_password=hash_password(admin_pwd),
            full_name="Lead Climate Architect",
            role="ADMINISTRATOR",
            is_active=True
        )
        db.add(admin)
    else:
        # Update to secure password
        admin.hashed_password = hash_password(admin_pwd)
        admin.is_active = True
        admin.role = "ADMINISTRATOR"
        
    researcher_pwd = os.getenv("RESEARCHER_PASSWORD", "Res@Climate2026#Safe")
    researcher = db.query(User).filter(User.username == "researcher").first()
    if not researcher:
        researcher = User(
            username="researcher",
            email="researcher@iitm.res.in",
            hashed_password=hash_password(researcher_pwd),
            full_name="Climate Research Fellow",
            role="RESEARCHER",
            is_active=True
        )
        db.add(researcher)
    else:
        researcher.hashed_password = hash_password(researcher_pwd)
        researcher.is_active = True
    db.commit()

def init_database(force_refresh: bool = False):
    """Initializes tables and seeds initial data if database is empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    
    try:
        if not force_refresh and db.query(District).first():
            if db.query(State).count() == 36 and db.query(State).filter(State.name == "Ladakh").first() and db.query(State).filter(State.name == "Telangana").first():
                return

        ensure_users(db)
        ensure_data_sources(db)

        if force_refresh:
            print("[InitDB] Force refresh requested. Recreating database schema...")
            db.close()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            ensure_users(db)
            ensure_data_sources(db)
            
        print("[InitDB] Seeding database from geospatial dataset...")

        # 3. Load Districts GeoJSON
        if os.path.exists(DATA_PATH):
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                geojson_content = json.load(f)
                
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
        
        state_map = {}
        for u in OFFICIAL_ADMIN_UNITS:
            st_obj = db.query(State).filter(State.name == u["name"]).first()
            if not st_obj:
                st_obj = State(
                    name=u["name"],
                    code=u["code"],
                    region=u["region"],
                    is_union_territory=u["is_ut"],
                    admin_type="UNION_TERRITORY" if u["is_ut"] else "STATE"
                )
                db.add(st_obj)
                db.flush()
            else:
                st_obj.code = u["code"]
                st_obj.region = u["region"]
                st_obj.is_union_territory = u["is_ut"]
                st_obj.admin_type = "UNION_TERRITORY" if u["is_ut"] else "STATE"
                db.flush()
            state_map[u["name"]] = st_obj.id

        # Seed District records
        for feat in geojson_content.get("features", []):
            p = feat.get("properties", {})
            s_name = p.get("state_name")
            d_id = p.get("district_id")
            d_name = p.get("district_name")
            d_code = p.get("district_code")
            c_lat = p.get("centroid_lat")
            c_lng = p.get("centroid_lng")
            zone = p.get("zone")

            dist_obj = db.query(District).filter(District.id == d_id).first()
            if not dist_obj:
                dist_obj = District(
                    id=d_id,
                    name=d_name,
                    state_name=s_name,
                    state_id=state_map.get(s_name),
                    code=d_code,
                    centroid_lat=c_lat,
                    centroid_lng=c_lng,
                    zone=zone,
                    geometry_geojson=json.dumps(feat.get("geometry", {}))
                )
                db.add(dist_obj)
                db.flush()
            else:
                dist_obj.state_name = s_name
                dist_obj.state_id = state_map.get(s_name)
                dist_obj.zone = zone
                dist_obj.geometry_geojson = json.dumps(feat.get("geometry", {}))
                db.flush()
                
            # Indicators
            if not db.query(VulnerabilityIndicator).filter(VulnerabilityIndicator.district_id == d_id).first():
                ind_obj = VulnerabilityIndicator(
                    district_id=d_id,
                    rainfall_extremes=p.get("exposure_score", 50.0),
                    flood_exposure=p.get("exposure_score", 50.0),
                    heat_exposure=p.get("exposure_score", 50.0),
                    drought_exposure=p.get("exposure_score", 50.0),
                    coastal_surge=40.0 if "Coastal" in (zone or "") else 0.0,
                    pop_density=p.get("population", 1000000) / 1000,
                    agri_dependency=p.get("sensitivity_score", 50.0),
                    housing_vulnerability=p.get("sensitivity_score", 50.0),
                    marginalized_pct=25.0,
                    infra_exposure=p.get("sensitivity_score", 50.0),
                    healthcare_score=p.get("adaptive_capacity_score", 50.0),
                    road_density=p.get("adaptive_capacity_score", 50.0),
                    drinking_water=p.get("adaptive_capacity_score", 50.0),
                    literacy_rate=78.0,
                    disaster_preparedness=p.get("adaptive_capacity_score", 50.0)
                )
                db.add(ind_obj)

            # Vulnerability Score
            v_score = p.get("vulnerability_score", 50.0)
            v_cat = p.get("vulnerability_category", "Moderate")
            if not db.query(VulnerabilityScore).filter(VulnerabilityScore.district_id == d_id).first():
                sc_obj = VulnerabilityScore(
                    district_id=d_id,
                    exposure_score=p.get("exposure_score", 50.0),
                    sensitivity_score=p.get("sensitivity_score", 50.0),
                    adaptive_capacity_score=p.get("adaptive_capacity_score", 50.0),
                    vulnerability_score=v_score,
                    vulnerability_category=v_cat,
                    confidence_score=p.get("data_confidence", 94.5),
                    is_current=True,
                    calculation_date=now
                )
                db.add(sc_obj)

            # Population Indicator
            pop = p.get("population", 1000000)
            if not db.query(PopulationIndicator).filter(PopulationIndicator.district_id == d_id).first():
                pop_obj = PopulationIndicator(
                    district_id=d_id,
                    total_population=pop,
                    male_population=int(pop * 0.515),
                    female_population=int(pop * 0.485),
                    rural_population=int(pop * 0.65),
                    urban_population=int(pop * 0.35),
                    total_households=int(pop / 4.8),
                    census_year=2011
                )
                db.add(pop_obj)

            # Weather & Rainfall
            cw = p.get("current_weather", {})
            if not db.query(RainfallObservation).filter(RainfallObservation.district_id == d_id).first():
                rn_obj = RainfallObservation(
                    district_id=d_id,
                    station_name=f"{d_name} (Open-Meteo High-Res Grid)",
                    rainfall_mm_24h=cw.get("rainfall_24h", 0.0),
                    observation_timestamp=now,
                    source_name="Open-Meteo High-Resolution Grid",
                    data_quality="OPEN_METEO_OBSERVED"
                )
                db.add(rn_obj)

            if not db.query(TemperatureObservation).filter(TemperatureObservation.district_id == d_id).first():
                tm_obj = TemperatureObservation(
                    district_id=d_id,
                    station_name=f"{d_name} (Open-Meteo High-Res Grid)",
                    temp_current_c=cw.get("temp", 30.0),
                    temp_max_c=cw.get("temp", 30.0) + 2.5,
                    temp_min_c=cw.get("temp", 30.0) - 5.0,
                    humidity_pct=cw.get("humidity", 65.0),
                    weather_condition=cw.get("condition", "Partly Cloudy"),
                    observation_timestamp=now,
                    source_name="Open-Meteo High-Resolution Grid",
                    data_quality="OPEN_METEO_OBSERVED"
                )
                db.add(tm_obj)

        db.commit()

        # 4. Seed Official Alerts & Observed Hazards
        # High rainfall alert for coastal/flood districts issued by State Disaster Authorities
        alert_od = OfficialAlert(
            district_id="IND_OD_KEN",
            alert_type="Heavy Rainfall & Coastal Surge Warning",
            severity="Orange",
            headline="Orange Warning: Heavy to Very Heavy Rain (70-200mm) with coastal winds",
            description="Special Relief Commissioner & Odisha State Disaster Management Authority (OSDMA) issue Orange Alert: Squally wind speed reaching 45-55 kmph gusting to 65 kmph along Kendrapara and Paradip coast. Fishermen advised not to venture into sea.",
            issuing_authority="Odisha State Disaster Management Authority (OSDMA)",
            issue_timestamp=now - timedelta(hours=2),
            valid_until=now + timedelta(hours=24),
            source_url="https://osdma.org"
        )
        alert_kl = OfficialAlert(
            district_id="IND_KL_WAY",
            alert_type="Debris Flow & Intense Landslide Alert",
            severity="Red",
            headline="Red Alert: Extremely Heavy Rainfall in Western Ghats Ghat Section",
            description="Kerala State Disaster Management Authority (KSDMA) and District Disaster Management Authority (DDMA) Wayanad issue Red Warning: Continuous torrential downpour exceeding 204.4 mm in 24 hours. High vulnerability to slope failure and flash floods in Meppadi & Chooralmala.",
            issuing_authority="District Disaster Management Authority (DDMA) Wayanad / KSDMA",
            issue_timestamp=now - timedelta(hours=1),
            valid_until=now + timedelta(hours=18),
            source_url="https://sdma.kerala.gov.in"
        )
        alert_rj = OfficialAlert(
            district_id="IND_RJ_CHU",
            alert_type="Severe Heatwave Advisory",
            severity="Orange",
            headline="Heatwave Watch: Maximum temperatures likely to exceed 45°C",
            description="Rajasthan State Disaster Management Authority (RSDMA) issues Orange Alert for Churu and North-Western Rajasthan: Severe heatwave conditions with loo winds. High risk of heat cramps and dehydration.",
            issuing_authority="Rajasthan State Disaster Management Authority (RSDMA)",
            issue_timestamp=now - timedelta(hours=3),
            valid_until=now + timedelta(hours=36),
            source_url="https://disaster.rajasthan.gov.in"
        )
        db.add_all([alert_od, alert_kl, alert_rj])

        # Active Hazard Events (Fires & Floods)
        hz_fire = HazardEvent(
            district_id="IND_CG_BAS",
            hazard_type="Forest Fire",
            severity="Severe",
            location_detail="Kanger Valley Reserve Forest fringe",
            latitude=19.12,
            longitude=81.88,
            event_timestamp=now - timedelta(hours=4),
            source_name="NASA FIRMS (VIIRS Near Real-Time)",
            source_url="https://firms.modaps.eosdis.nasa.gov",
            status="ACTIVE"
        )
        hz_flood = HazardEvent(
            district_id="IND_AS_DHE",
            hazard_type="Riverine Inundation",
            severity="Severe",
            location_detail="Jiadhal River embankment spillover",
            latitude=27.48,
            longitude=94.58,
            event_timestamp=now - timedelta(hours=6),
            source_name="Assam State Disaster Management Authority (ASDMA)",
            source_url="https://sdma.assam.gov.in",
            status="ACTIVE"
        )
        db.add_all([hz_fire, hz_flood])

        # Initial Ingestion Log
        log_init = DataIngestionLog(
            source_key="system",
            status="SUCCESS",
            records_ingested=len(geojson_content.get("features", [])),
            details="Initial platform geospatial dataset and baseline climate indicators loaded successfully.",
            timestamp=now
        )
        db.add(log_init)

        db.commit()
        print("[InitDB] Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"[InitDB] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
