# System Architecture & Technical Specification
## Community Climate Vulnerability Mapping (India) – Academic & Geospatial Intelligence Platform

---

### 1. Executive Summary & Architectural Philosophy
The Community Climate Vulnerability Mapping platform is an open-access, full-stack geospatial intelligence system designed for local Indian climate resilience planning, academic evaluation, and sub-district disaster vulnerability assessment.

The system's core design philosophy enforces a **strict decoupling** between two fundamental analytical functions:
1. **Subsystem 1: Long-Term Climate Vulnerability Assessment**
   - Evaluates multi-decadal geographic, demographic, socioeconomic, and infrastructural susceptibility using IPCC AR5/AR6 framing:
     $$\text{Vulnerability} = f(\text{Exposure}, \text{Sensitivity}, \text{Adaptive Capacity})$$
   - Anchored on 30-year climatological normals (1991–2020 ERA5/Open-Meteo Archive), Census of India / WorldPop demographics, and NASA SRTM digital elevation baselines.
   - **Critical Rule:** Transient diurnal weather events (e.g., a single monsoon shower or localized hot spell) **never** artificially mutate long-term vulnerability scores.
2. **Subsystem 2: Real-Time & Near-Real-Time Hazard Monitoring**
   - Ingests high-frequency spatial weather telemetry (Open-Meteo High-Resolution Numerical Weather Models) and active satellite thermal anomaly detections (NASA FIRMS MODIS/VIIRS 375m).
   - Ingests statutory official meteorological warnings and disaster alerts (IMD / State Disaster Management Authorities - SDMA / NDMA).
   - Displays short-term environmental anomalies alongside vulnerability baselines to answer: *Where is the environmental hazard occurring today, and how vulnerable is the underlying community?*

---

### 2. High-Level Component Topology

```
+----------------------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER LAYER (SPA)                                      |
|                                                                                                    |
|   React 18 + TypeScript + Vite                                                                     |
|   +-----------------------+  +-----------------------+  +---------------------------------------+  |
|   |  Public User Portal   |  |     GIS Map Engine    |  |  Protected Administration Portal      |  |
|   |  - National Overview  |  |  - Leaflet / GeoJSON  |  |  - Dashboard Stats (28 S / 8 UT)      |  |
|   |  - District Profiles  |  |  - 6 Vector Overlays  |  |  - Geo Data Management & Topology     |  |
|   |  - Climate Monitoring |  |  - CMIP6 Projections  |  |  - Data Sources & Status              |  |
|   |  - Comparative Radar  |  |  - Hot/Cold Days      |  |  - Data Synchronization Scheduler     |  |
|   |  - Alerts & Hazards   |  |  - Interactive Tooltip|  |  - IPCC Weight Governance Engine      |  |
|   |  - PDF/Excel Reports  |  |  - Coordinate Flight  |  |  - Real-time Audit & Ingestion Logs   |  |
|   +-----------------------+  +-----------------------+  +---------------------------------------+  |
|                                         |                                                          |
|                      Axios REST HTTP Client (with JWT Bearer Interceptor)                          |
+-----------------------------------------|----------------------------------------------------------+
                                          | JSON API Requests (/api/v1/*)
+-----------------------------------------v----------------------------------------------------------+
|                                    BACKEND REST SERVICE LAYER                                      |
|                                                                                                    |
|   FastAPI (Asynchronous ASGI) + Pydantic v2 Validation + Python 3.12                               |
|   +---------------------------------------------------------------------------------------------+  |
|   | API Routers (/api/v1):                                                                      |  |
|   |  - /states       : Constitutional 28 States, 8 UTs (36 Units) & Regional Summaries          |  |
|   |  - /districts    : 594 District Profiles, Demographics, Weather, & Vulnerability Indices    |  |
|   |  - /map          : GeoJSON Vector Layers (Vulnerability, Rainfall, Temp, FIRMS Hotspots)    |  |
|   |  - /analytics    : Overview KPIs, Monthly Climatology Trends, Multi-District Radar Analysis |  |
|   |  - /alerts       : Official Statutory Meteorological Alerts & Thermal Anomaly Points        |  |
|   |  - /reports      : ReportLab PDF Generator, OpenPyXL Multi-Sheet Excel, RFC 4180 CSV Export |  |
|   |  - /admin        : DB Statistics, Governance Controls, Manual Ingestion Trigger, Auth       |  |
|   |  - /data-sources : Live Provider Metadata, Freshness Cadence, API Health Records            |  |
|   +---------------------------------------------------------------------------------------------+  |
|                                         |                                                          |
|                  SQLAlchemy 2.0 ORM (Data Access Layer & Query Builder)                            |
+-----------------------------------------|----------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-----------------------------------+   +---------------------------v------------------------+
|       EMBEDDED RELATIONAL STORAGE         |   |          EXTERNAL DATA INTEGRATION ENGINES         |
|                                           |   |                                                    |
|   SQLite Embedded Database                |   |   Open-Meteo High-Resolution Grid Forecast API     |
|   File: backend/climate_intelligence.db   |   |   - Temperature, Precipitation, Relative Humidity  |
|   - Zero Docker / Zero Redis dependency   |   |   - Open-Meteo Historical Archive (1991-2020)      |
|   - Tables:                               |   |                                                    |
|     * states (36 units)                   |   |   NASA FIRMS MODIS/VIIRS Active Fire System        |
|     * districts (594 features)            |   |   - Thermal hotspot anomalies, FRP (MW)            |
|     * vulnerability_scores                |   |                                                    |
|     * vulnerability_indicators            |   |   WorldPop API / Census of India Demographics      |
|     * population_indicators               |   |   - Gridded population density & counts            |
|     * rainfall_observations               |   |                                                    |
|     * temperature_observations            |   |   Copernicus ERA5-Land Reanalysis Engine           |
|     * hazard_events                       |   |   - Documented land-surface soil moisture baseline |
|     * data_sources & ingestion_logs       |   |                                                    |
|     * users & audit_logs                  |   |   NASA SRTM 30m Digital Elevation Model            |
+-------------------------------------------+   |   - Elevation, terrain roughness, slope            |
                                                +----------------------------------------------------+
```

---

### 3. Subsystem Breakdown

#### Subsystem 1: Climate Vulnerability Engine
- **Mathematical Specification:**
  $$V = w_e \cdot E + w_s \cdot S + w_a \cdot (100 - A)$$
  where default IPCC weights are:
  $$w_e = 0.40, \quad w_s = 0.30, \quad w_a = 0.30 \quad (w_e + w_s + w_a = 1.0)$$
- **Adaptive Capacity Deficit:**
  High adaptive capacity reduces vulnerability. Therefore, the term $(100 - A)$ represents the adaptive deficit.
- **Normalization Policy:**
  Every raw metric is normalized to the unit interval $[0, 100]$ using empirical min-max bounds derived across the 594 constitutional districts:
  $$\tilde{x} = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times 100$$
- **Missing Data Policy:**
  Missing raw indicators are **never** filled with zero (which would falsely indicate zero vulnerability). Instead, available indicators in that dimension are weighted dynamically, and an explicit `data_confidence` score is computed:
  $$\text{Confidence} = \frac{\text{Count of Valid Indicators}}{\text{Total Required Indicators}} \times 100\%$$
  Districts with $<75\%$ data completeness are flagged with an amber warning badge.

#### Subsystem 2: Hazard Monitoring & Warning System
- **Provider:** Open-Meteo High-Resolution Numerical Weather Model Grid (`https://api.open-meteo.com/v1/forecast`).
- **Telemetry Ingestion:**
  - `temp_current_c`: Instantaneous dry-bulb temperature (°C).
  - `rainfall_24h`: Cumulative 24-hour precipitation (mm).
  - `relative_humidity`: Percent atmospheric saturation (%).
  - `wind_speed_kmh`: 10-meter wind velocity (km/h).
- **Satellite Hotspot Ingestion:**
  - NASA FIRMS MODIS/VIIRS Active Fire Hotspots (`https://firms.modaps.eosdis.nasa.gov/api/area`).
  - Active sensor thermal anomalies tagged with Brightness Temperature (K), Fire Radiative Power (MW), and acquisition timestamps.
  - **Scientific Disclaimer:** Satellite hotspots denote thermal radiation anomalies and do not constitute confirmed ground wildfire incidents without field verification.

---

### 4. Administrative Data Hierarchy & Territorial Alignment
To ensure rigorous conformity with the Constitution of India and the Jammu and Kashmir Reorganisation Act, the platform enforces:
- **28 States**
- **8 Union Territories**
- **36 Total Administrative Units**
- **594 Constitutional Districts**
- **Zero Invalid Polygons:** All 594 vector geometries in `data/india_districts.json` are validated using the `shapely.geometry.shape(g).is_valid` predicate ($594/594$ valid).

---

### 5. Deployment & Execution Model
- **No Docker / No Redis / No Microservices:** Runs entirely in a lightweight local developer environment:
  - Backend: `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
  - Frontend: `npm run dev` (Vite dev server on `http://127.0.0.1:5173`)
  - Embedded Relational Database: SQLite at `backend/climate_intelligence.db` with WAL mode.
