# Data Source Documentation & Provenance Ledger
## Community Climate Vulnerability Mapping (India) – Academic Platform

---

### 1. Authoritative Data Sources Overview

| Data Source | Provider / Agency | Ingestion Protocol | Update Cadence | Data Classification |
|---|---|---|---|---|
| **Open-Meteo High-Res Forecast** | Open-Meteo / DWD ICON / ECMWF | REST API (JSON) | 6 Hours / On-Demand | `WEATHER_MODEL_ESTIMATE` (Live Modelled) |
| **Open-Meteo Historical Archive** | Open-Meteo / ECMWF ERA5 Reanalysis | REST API (JSON) | Multi-Decadal Baseline | `HISTORICAL_CLIMATE_DATA` (1991–2020) |
| **NASA FIRMS Active Fire Hotspots** | NASA Earthdata / EOSDIS | REST API (CSV / JSON) | Near-Real-Time (NRT) | `SATELLITE_HOTSPOT_DETECTION` |
| **Census of India / WorldPop** | Registrar General of India / WorldPop | Direct Ingestion / REST | Static Reference Dataset | `REFERENCE_POPULATION_ESTIMATE` |
| **NASA SRTM Digital Elevation** | NASA / USGS Earth Resources | Local GeoTIFF & DEM | Static Reference Dataset | `GEOSPATIAL_ELEVATION_BASELINE` |
| **Copernicus ERA5-Land** | ECMWF / Copernicus CDS | CDS API (NetCDF / GRIB) | Historical Baseline | `REANALYSIS_LAND_SURFACE_BASELINE` |
| **India Administrative GIS** | Survey of India / Local GeoJSON | GeoJSON / WGS84 (EPSG:4326) | Administrative Dataset | `OFFICIAL_ADMINISTRATIVE_BOUNDARIES` |

---

### 2. Detailed Source Integration Specifications

#### A. Open-Meteo Weather Model Forecast
- **Endpoint URL:** `https://api.open-meteo.com/v1/forecast`
- **Method:** `GET`
- **Spatial Resolution:** 0.1° (~11 km grid resolution)
- **Ingested Telemetry:**
  - `temperature_2m` (°C)
  - `precipitation` (mm)
  - `relative_humidity_2m` (%)
  - `wind_speed_10m` (km/h)
  - `weather_code` (WMO weather code interpretation)
- **Scientific Classification:** `WEATHER_MODEL_ESTIMATE`
  - *Academic Disclaimer:* Data represents high-resolution numerical weather prediction (NWP) model outputs, not direct physical ground stations. It is distinct from statutory ground observations.

#### B. Open-Meteo Historical Archive
- **Endpoint URL:** `https://archive-api.open-meteo.com/v1/archive`
- **Method:** `GET`
- **Reference Climatological Period:** 1991–2020 (30-year WMO climate normal baseline)
- **Ingested Parameters:**
  - Monthly mean temperature (°C)
  - Monthly cumulative precipitation (mm)
  - Long-term diurnal temperature extremes (°C)
- **Scientific Classification:** `HISTORICAL_CLIMATE_DATA`
  - *Academic Disclaimer:* Reanalysis datasets provide historical baselines for identifying drought spells and thermal anomalies.

#### C. NASA FIRMS (Fire Information for Resource Management System)
- **Endpoint URL:** `https://firms.modaps.eosdis.nasa.gov/api/area`
- **Sensors:** MODIS (Terra/Aqua) and VIIRS (Suomi-NPP / NOAA-20) 375m active fire detection
- **Ingested Fields:**
  - `latitude`, `longitude` (WGS84)
  - `brightness` / `bright_ti4` (Kelvin)
  - `scan`, `track` (Pixel geometry)
  - `acq_date`, `acq_time` (UTC timestamp)
  - `satellite` (Terra, Aqua, Suomi-NPP, NOAA-20)
  - `confidence` (Low, Nominal, High)
  - `frp` (Fire Radiative Power in Megawatts - MW)
- **Scientific Classification:** `SATELLITE_HOTSPOT_DETECTION`
  - *Mandatory User Notice:* Satellite fire detections identify mid-infrared thermal anomalies at the sensor footprint and do not automatically prove an active ground wildfire without field corroboration.

#### D. Demographic Data (WorldPop & Census of India)
- **Source:** Office of the Registrar General & Census Commissioner, India (2011) projected to 2024 using WorldPop UN-adjusted subnational growth factors.
- **Attributes:**
  - `total_population`: Absolute headcount estimate.
  - `population_density_sqkm`: Persons per square kilometer.
  - `urban_population_pct`: Urbanization ratio.
  - `marginalized_population_pct`: Demographic sensitivity indicator.
- **Scientific Classification:** `REFERENCE_POPULATION_ESTIMATE`
  - *Academic Note:* Population counts are documented as demographic estimates rather than real-time headcount sensors.

#### E. NASA SRTM 30m Digital Elevation Model
- **Source:** Shuttle Radar Topography Mission (SRTM GL1, 1 arc-second ~30m resolution).
- **Extracted Indices:**
  - Mean district elevation (meters above sea level).
  - Maximum & minimum elevation range.
  - Terrain roughness / slope index (%) used in flood and landslide susceptibility calculations.
- **Scientific Classification:** `GEOSPATIAL_ELEVATION_BASELINE`
  - *Integrity Rule:* Elevation values are derived directly from verified spatial bounds; no synthetic or fabricated elevation figures are introduced.

#### F. Copernicus ERA5-Land (Soil Moisture & Land Surface)
- **Service:** Copernicus Climate Change Service (C3S) Climate Data Store (CDS).
- **Status:** Integrated via architectural abstraction (`backend/app/integrations/copernicus_client.py`).
- **Configuration Verification:**
  - When API key credentials (`CDSAPI_URL` and `CDSAPI_KEY`) are present, downloads ERA5-Land volumetric soil water layers (Layer 1: 0–7 cm, Layer 2: 7–28 cm).
  - When credentials are not provided, the platform transparently reports `CONFIGURATION_UNAVAILABLE` rather than simulating false API connectivity.

---

### 3. Data Freshness, Caching & Ingestion Auditing
1. **Audit Ledger:** Every external request is logged in the `data_ingestion_logs` table with:
   - `provider_name` (e.g., `open_meteo`, `nasa_firms`)
   - `endpoint`
   - `records_retrieved`
   - `duration_ms`
   - `status` (`SUCCESS`, `FAILED`, `TIMEOUT`)
   - `error_message` (if any)
2. **Freshness Cadence:**
   - Weather Telemetry: Refreshed every 6 hours via background scheduler.
   - Hotspot Detections: Updated on-demand or 6-hour cycle.
   - Vulnerability Baselines: Recomputed only when administrative boundaries or indicator weights are updated.
