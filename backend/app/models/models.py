import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class State(Base):
    __tablename__ = "states"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(10), unique=True, nullable=False)
    region = Column(String(50), nullable=True) # Northern, Southern, Eastern, Western, Central, North-Eastern
    is_union_territory = Column(Boolean, default=False, nullable=False)
    admin_type = Column(String(20), default="STATE", nullable=False) # STATE or UNION_TERRITORY
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    districts = relationship("District", back_populates="state_rel")

class District(Base):
    __tablename__ = "districts"
    
    id = Column(String(50), primary_key=True, index=True) # e.g. IND_OD_KEN
    name = Column(String(100), nullable=False, index=True)
    state_name = Column(String(100), nullable=False, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=True)
    code = Column(String(20), nullable=False, index=True)
    centroid_lat = Column(Float, nullable=False)
    centroid_lng = Column(Float, nullable=False)
    zone = Column(String(150), nullable=True)
    geometry_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    state_rel = relationship("State", back_populates="districts")
    indicators = relationship("VulnerabilityIndicator", back_populates="district", uselist=False)
    scores = relationship("VulnerabilityScore", back_populates="district")
    population = relationship("PopulationIndicator", back_populates="district", uselist=False)
    rainfall_records = relationship("RainfallObservation", back_populates="district")
    temperature_records = relationship("TemperatureObservation", back_populates="district")
    hazards = relationship("HazardEvent", back_populates="district")
    alerts = relationship("OfficialAlert", back_populates="district")

class VulnerabilityIndicator(Base):
    __tablename__ = "vulnerability_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), unique=True, nullable=False)
    
    # Exposure (E) raw indicators
    rainfall_extremes = Column(Float, default=0.0) # 95th percentile daily rain
    flood_exposure = Column(Float, default=0.0)    # Flood basin exposure %
    heat_exposure = Column(Float, default=0.0)     # Days above 40C
    drought_exposure = Column(Float, default=0.0)  # Drought frequency / SPI
    coastal_surge = Column(Float, default=0.0)     # Surge/cyclone vulnerability
    
    # Sensitivity (S) raw indicators
    pop_density = Column(Float, default=0.0)
    agri_dependency = Column(Float, default=0.0)
    housing_vulnerability = Column(Float, default=0.0)
    marginalized_pct = Column(Float, default=0.0)
    infra_exposure = Column(Float, default=0.0)
    
    # Adaptive Capacity (A) raw indicators
    healthcare_score = Column(Float, default=0.0)
    road_density = Column(Float, default=0.0)
    drinking_water = Column(Float, default=0.0)
    literacy_rate = Column(Float, default=0.0)
    disaster_preparedness = Column(Float, default=0.0)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    district = relationship("District", back_populates="indicators")

class VulnerabilityScore(Base):
    __tablename__ = "vulnerability_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    
    exposure_score = Column(Float, nullable=False) # 0-100
    sensitivity_score = Column(Float, nullable=False) # 0-100
    adaptive_capacity_score = Column(Float, nullable=False) # 0-100
    vulnerability_score = Column(Float, nullable=False) # 0-100
    vulnerability_category = Column(String(20), nullable=False) # Very Low, Low, Moderate, High, Very High
    
    confidence_score = Column(Float, default=95.0) # Data completeness %
    is_current = Column(Boolean, default=True)
    calculation_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    district = relationship("District", back_populates="scores")

class PopulationIndicator(Base):
    __tablename__ = "population_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), unique=True, nullable=False)
    
    total_population = Column(Integer, nullable=False)
    male_population = Column(Integer, nullable=True)
    female_population = Column(Integer, nullable=True)
    rural_population = Column(Integer, nullable=True)
    urban_population = Column(Integer, nullable=True)
    total_households = Column(Integer, nullable=True)
    census_year = Column(Integer, default=2011)
    is_demographic_breakdown_estimated = Column(Boolean, default=True)
    data_source = Column(String(100), default="Census of India 2011")
    
    district = relationship("District", back_populates="population")

class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    station_name = Column(String(100), nullable=False)
    rainfall_mm_24h = Column(Float, nullable=False)
    observation_timestamp = Column(DateTime, nullable=False)
    ingestion_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source_name = Column(String(100), default="India Meteorological Department (IMD)")
    data_quality = Column(String(20), default="VALIDATED") # VALIDATED, PROVISIONAL, DEMO
    
    district = relationship("District", back_populates="rainfall_records")

class TemperatureObservation(Base):
    __tablename__ = "temperature_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    station_name = Column(String(100), nullable=False)
    temp_current_c = Column(Float, nullable=False)
    temp_max_c = Column(Float, nullable=True)
    temp_min_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    weather_condition = Column(String(100), nullable=True)
    observation_timestamp = Column(DateTime, nullable=False)
    ingestion_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source_name = Column(String(100), default="India Meteorological Department (IMD)")
    data_quality = Column(String(20), default="VALIDATED")
    
    district = relationship("District", back_populates="temperature_records")

class HazardEvent(Base):
    __tablename__ = "hazard_events"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    hazard_type = Column(String(50), nullable=False) # Flood, Heatwave, Drought, Fire, Cyclone
    severity = Column(String(20), nullable=False) # Minor, Moderate, Severe, Extreme
    location_detail = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    event_timestamp = Column(DateTime, nullable=False)
    ingestion_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source_name = Column(String(100), nullable=False)
    source_url = Column(String(255), nullable=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, RESOLVED, MONITORED
    
    district = relationship("District", back_populates="hazards")

class OfficialAlert(Base):
    __tablename__ = "official_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False) # Heavy Rainfall, Heatwave, Cyclone Warning, Flood Advisory
    severity = Column(String(20), nullable=False) # Green, Yellow, Orange, Red
    headline = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    issuing_authority = Column(String(100), default="India Meteorological Department (IMD)")
    issue_timestamp = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    source_url = Column(String(255), default="https://mausam.imd.gov.in")
    is_active = Column(Boolean, default=True)
    is_benchmark = Column(Boolean, default=True)
    verification_status = Column(String(50), default="BENCHMARK_DEMONSTRATION")
    
    district = relationship("District", back_populates="alerts")

class HistoricalClimateRecord(Base):
    __tablename__ = "historical_climate_records"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    observation_period = Column(String(50), nullable=False) # e.g. "2023-01-01 to 2023-12-31"
    monthly_data_json = Column(Text, nullable=False) # JSON array of 12 months with rainfall_mm, temp_c, etc.
    source_name = Column(String(100), default="Open-Meteo Historical Archive (ECMWF ERA5)")
    data_classification = Column(String(50), default="OBSERVED_HISTORICAL_API") # OBSERVED_HISTORICAL_API or REGIONAL_ESTIMATE
    retrieval_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    district = relationship("District", backref="historical_climate_records")

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    source_key = Column(String(50), unique=True, nullable=False) # imd, nasa_gpm, copernicus, nasa_firms, census, nwdp
    name = Column(String(100), nullable=False)
    organization = Column(String(150), nullable=False)
    source_url = Column(String(255), nullable=False)
    update_frequency = Column(String(50), nullable=False)
    coverage = Column(String(100), nullable=False)
    measurement_units = Column(String(100), nullable=True)
    last_successful_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(20), default="IDLE") # IDLE, RUNNING, SUCCESS, FAILED
    error_message = Column(Text, nullable=True)

class DataIngestionLog(Base):
    __tablename__ = "data_ingestion_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    source_key = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False) # SUCCESS, FAILED, WARNING
    records_ingested = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="RESEARCHER") # ADMIN, RESEARCHER, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "UPDATE_INDICATOR_WEIGHTS", "MANUAL_SYNC"
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class GeneratedReport(Base):
    __tablename__ = "generated_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    district_id = Column(String(50), nullable=True)
    report_type = Column(String(20), nullable=False) # PDF, CSV, EXCEL
    file_path = Column(String(255), nullable=False)
    generated_by = Column(String(100), default="Academic Platform")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
