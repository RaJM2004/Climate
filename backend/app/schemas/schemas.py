from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "RESEARCHER"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- State & District Schemas ---
class StateOut(BaseModel):
    id: int
    name: str
    code: str
    region: Optional[str] = "General"
    is_union_territory: bool = False
    admin_type: str = "STATE" # "STATE" or "UNION_TERRITORY"
    district_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class StateDetailOut(BaseModel):
    id: int
    name: str
    code: str
    region: Optional[str] = "General"
    is_union_territory: bool = False
    admin_type: str = "STATE"
    district_count: int
    average_vulnerability_score: float
    districts: List[Dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)

class VulnerabilityScoreOut(BaseModel):
    exposure_score: float
    sensitivity_score: float
    adaptive_capacity_score: float
    vulnerability_score: float
    vulnerability_category: str
    confidence_score: float
    calculation_date: datetime

    model_config = ConfigDict(from_attributes=True)

class PopulationOut(BaseModel):
    total_population: int
    male_population: Optional[int] = None
    female_population: Optional[int] = None
    rural_population: Optional[int] = None
    urban_population: Optional[int] = None
    total_households: Optional[int] = None
    census_year: int = 2011
    is_demographic_breakdown_estimated: Optional[bool] = True
    demographic_breakdown_type: Optional[str] = "SYNTHETIC_ESTIMATE"
    estimation_methodology: Optional[str] = "Standard national demographic baseline ratios (51.5% M, 48.5% F, 65% Rural, 35% Urban, 4.8 persons/HH)"
    data_source: Optional[str] = "Office of the Registrar General & Census Commissioner, India (Census 2011)"

    model_config = ConfigDict(from_attributes=True)

class CurrentWeatherOut(BaseModel):
    temp_current_c: float
    rainfall_mm_24h: float
    humidity_pct: Optional[float]
    weather_condition: Optional[str]
    station_name: str
    observation_timestamp: datetime
    source_name: str

class DistrictSummaryOut(BaseModel):
    id: str
    name: str
    state_name: str
    code: str
    centroid_lat: float
    centroid_lng: float
    zone: Optional[str]
    vulnerability_score: float
    vulnerability_category: str
    category_color: str
    exposure_score: float
    sensitivity_score: float
    adaptive_capacity_score: float
    data_confidence: float
    population: int
    rainfall_24h: float
    temp_c: float

class DistrictDetailOut(BaseModel):
    id: str
    name: str
    state_name: str
    code: str
    centroid_lat: float
    centroid_lng: float
    zone: Optional[str]
    geometry_geojson: Optional[str]
    
    # Subsystem 1: Long-term Vulnerability
    vulnerability: VulnerabilityScoreOut
    indicators: Dict[str, Any]
    indicator_provenance: Optional[Dict[str, Any]] = None
    population: Optional[PopulationOut]
    
    # Subsystem 2: Current & Recent Hazard Monitoring
    current_weather: Optional[CurrentWeatherOut]
    recent_hazards: List[Dict[str, Any]]
    active_alerts: List[Dict[str, Any]]
    
    data_confidence: float
    data_completeness_pct: Optional[float] = 94.5
    dataset_sources: List[Dict[str, str]]
    last_updated: datetime

# --- Map Layer Schemas ---
class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class MapLayerMetadata(BaseModel):
    layer_key: str
    title: str
    category: str # "VULNERABILITY" or "HAZARD_MONITORING"
    source_name: str
    source_url: str
    observation_timestamp: str
    update_status: str
    geographic_coverage: str
    unit: str

# --- Analytics Schemas ---
class OverviewAnalyticsOut(BaseModel):
    total_states: int
    total_union_territories: Optional[int] = 8
    total_administrative_units: Optional[int] = 36
    total_districts: int
    high_vulnerability_districts: int
    average_vulnerability_score: float
    active_hazards_count: int
    active_official_warnings_count: int
    vulnerability_distribution: Dict[str, int]
    top_vulnerable_districts: List[DistrictSummaryOut]
    recent_official_alerts: List[Dict[str, Any]]
    latest_rainfall_extremes: List[Dict[str, Any]]

class ComparisonItem(BaseModel):
    id: str
    district_id: str
    name: str
    district_name: str
    state_name: str
    entity_type: str = "DISTRICT" # "DISTRICT" or "STATE_AGGREGATE"
    is_state_aggregate: bool = False
    climate_zone: Optional[str] = None
    zone: Optional[str] = None
    centroid_lat: Optional[float] = None
    centroid_lng: Optional[float] = None
    elevation_m: Optional[float] = None
    elevation_source: Optional[str] = None
    soil_moisture_m3m3: Optional[float] = None
    soil_moisture_status: Optional[str] = "Unavailable"
    population: Optional[int] = None
    population_density: Optional[float] = None
    vulnerability_score: Optional[float] = None
    exposure_score: Optional[float] = None
    sensitivity_score: Optional[float] = None
    adaptive_capacity_score: Optional[float] = None
    adaptive_deficit: Optional[float] = None
    vulnerability_category: Optional[str] = None
    category_color: Optional[str] = None
    recent_rainfall_24h: Optional[float] = None
    current_temp_c: Optional[float] = None
    weather_timestamp: Optional[str] = None
    weather_source: Optional[str] = None
    weather_quality: Optional[str] = None
    active_hazards_count: int = 0
    data_confidence: Optional[float] = None
    data_completeness_pct: Optional[float] = None
    empirical_coverage_pct: Optional[float] = None
    model_derived_share_pct: Optional[float] = None
    estimated_share_pct: Optional[float] = None
    confidence_methodology: Optional[str] = None
    vulnerability: Optional[Dict[str, Any]] = None
    indicators: Optional[Dict[str, Any]] = None
    current_weather: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")

class DistrictComparisonOut(BaseModel):
    districts: List[ComparisonItem]
    radar_data: List[Dict[str, Any]]
    radar_available: bool = True
    unresolved_ids: List[str] = []
    aggregation_note: Optional[str] = None

    model_config = ConfigDict(extra="allow")

# --- Admin Indicator Weight Configuration ---
class IndicatorWeightConfig(BaseModel):
    weight_exposure: float = Field(0.40, ge=0.0, le=1.0)
    weight_sensitivity: float = Field(0.30, ge=0.0, le=1.0)
    weight_adaptive_capacity: float = Field(0.30, ge=0.0, le=1.0)

# --- Alert Schemas ---
class AlertOut(BaseModel):
    id: int
    district_id: str
    district_name: str
    state_name: str
    alert_type: str
    severity: str
    headline: str
    description: str
    issuing_authority: str
    issue_timestamp: datetime
    valid_until: datetime
    source_url: str
    is_benchmark: Optional[bool] = True
    verification_status: Optional[str] = "BENCHMARK_DEMONSTRATION"

# --- Data Source Schemas ---
class DataSourceOut(BaseModel):
    id: int
    source_key: str
    name: str
    organization: str
    source_url: str
    update_frequency: str
    coverage: str
    measurement_units: Optional[str]
    last_successful_sync: Optional[datetime]
    sync_status: str
    error_message: Optional[str]

    model_config = ConfigDict(from_attributes=True)
