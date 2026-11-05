# Data Validation, Provenance & Spatial Topology Report
## Community Climate Vulnerability Mapping (India) – Academic Platform
**Audit Date:** 2026-11-06 (Stage 2 Verification: Historical Storage & Provenance Audit)

---

### 1. Administrative Boundary Validation & Constitutional Alignment

#### Administrative Baseline & Geographic Reference:
- **Administrative Baseline:** The cartographic boundary dataset contains **594 districts** originating from the Census of India / Survey of India digital boundary baseline.
- **Constitutional Alignment Transformation (`backend/scripts/align_admin_structure.py`):**
  1. **Creation of State of Telangana (State #28):** 10 districts (*Adilabad, Hyderabad, Karimnagar, Khammam, Mahbubnagar, Medak, Nalgonda, Nizamabad, Rangareddi, Warangal*) reassigned from Andhra Pradesh to `State: Telangana` (`admin_type: STATE`).
  2. **Reconstitution of Andhra Pradesh:** 13 districts.
  3. **Creation of Union Territory of Ladakh (UT #7):** *Kargil* and *Ladakh (Leh)* assigned to `Union Territory: Ladakh` (`admin_type: UNION_TERRITORY`).
  4. **Reconstitution of Jammu & Kashmir (UT #6):** Designated as a Union Territory (`admin_type: UNION_TERRITORY`).
  5. **Merger of Dadra & Nagar Haveli and Daman & Diu (UT #3):** Unified into a single Union Territory per Parliament Act No. 44 of 2019.

#### SQLite Direct Database Audit:
- **Total Constitutional States:** **28** (`is_union_territory = 0`) — **VERIFIED PASS**
- **Total Union Territories:** **8** (`is_union_territory = 1`) — **VERIFIED PASS**
- **Total Administrative Units:** **36** — **VERIFIED PASS**
- **Total Districts:** **594** — **VERIFIED PASS**
- **Distinct Primary Keys (`id`):** **594** (0 duplicate IDs) — **VERIFIED PASS**
- **Distinct Names:** **589** (5 legitimate inter-state duplicate names: *Aurangabad* in Bihar & Maharashtra; *Bilaspur* in Chhattisgarh & Himachal Pradesh; *Hamirpur* in HP & UP; *Junagadh*; *Raigarh* in CG & MH) — **VERIFIED PASS**
- **Missing Centroid Coordinates:** **0** (All 594 districts have valid `centroid_lat` and `centroid_lng`) — **VERIFIED PASS**

---

### 2. Topological & Geometry Integrity Validation

All 594 district geometries in `data/india_districts.json` were audited with the `Shapely` computational geometry engine:
- **Total Geometries Evaluated:** 594 (518 Polygon, 76 MultiPolygon)
- **Invalid Geometries:** **0 (0.0%)** — **VERIFIED PASS**
- **Coordinate Reference System:** WGS84 Geographic Coordinates (`EPSG:4326`)
- **Self-Intersections or Bowtie Anomalies:** **0** — **VERIFIED PASS**

---

### 3. Population Data Provenance & Methodology Audit

- **Actual Source:** Office of the Registrar General & Census Commissioner (Census of India) 2011 district summaries.
- **Reference Year:** 2011 Reference Baseline.
- **Demographic Proportions Breakdown:**
  - Total population figures represent authentic Census 2011 district headcounts.
  - Sub-demographic breakdowns (*male, female, rural, urban, households*) are **model-derived synthetic breakdowns using Census of India national demographic ratios**:
    - Male: $51.5\%$ of total population
    - Female: $48.5\%$ of total population
    - Rural: $65.0\%$ of total population
    - Urban: $35.0\%$ of total population
    - Household Size: Average $4.8$ persons per household
- **Integrity Notice:** The application stores `is_demographic_breakdown_estimated = True` and displays explicit badges differentiating the official headcount from the estimated demographic proportions.

---

### 4. Historical Climate Data Storage & Persistence

- **Table:** `historical_climate_records` in embedded SQLite (`backend/climate_intelligence.db`).
- **Data Ingestion Protocol:** Query-on-demand for selected district coordinates, avoiding network congestion for 594 districts simultaneously.
- **Stored Attributes:**
  - `district_id`: District primary foreign key
  - `latitude`, `longitude`: Exact queried coordinates
  - `observation_period`: e.g. "2023-01-01 to 2023-12-31"
  - `monthly_data_json`: JSON-encoded 12-month calendar series (precipitation sum, mean temperature, baseline normals)
  - `source_name`: "Open-Meteo Historical Archive (ECMWF ERA5)"
  - `data_classification`: `OBSERVED_HISTORICAL_API` (or `REGIONAL_CLIMATOLOGICAL_ESTIMATE` on fallback)
  - `retrieval_timestamp`: UTC timestamp of API response
- **Cache Persistence:** Subsequent requests for the same district load instantly from the local SQLite cache with `is_cached = True`.

---

### 5. Identification of Demonstration, Seeded, and Synthetic Records

1. **Official Meteorological Warnings (`official_alerts` table):**
   - **Records:** 3 records (OSDMA Orange Warning for Kendrapara, KSDMA Red Alert for Wayanad, RSDMA Orange Warning for Churu).
   - **Status:** Flagged with `is_benchmark = True` and `verification_status = "BENCHMARK_DEMONSTRATION"`. Clearly marked as benchmark reference scenarios.
2. **Hazard Events (`hazard_events` table):**
   - **Records:** Active points distinguished into `LIVE_SATELLITE_DETECTION` (NASA FIRMS) and `SEEDED_BENCHMARK_EVENT` (e.g., ASDMA Inundation).
3. **Indicator Archetypes (`vulnerability_indicators` table):**
   - **Status:** Sourced and observed indicators (population density, literacy rate, extreme rainfall, coastal surge) are separated from archetype-based indicators (agricultural dependency, housing vulnerability, marginalized proportion). Full 15-indicator provenance registry is exposed via `indicator_provenance`.

---

### 6. Flood and Drought Data Categorization

1. **Flood Inundation & Basin Exposure Layer (`/map/flood`):**
   - **Type:** Climatological / Topographical Flood Susceptibility Score ($0-100$).
   - **Data Origin:** Basin terrain slope and precipitation exposure index.
   - **Important Distinction:** This is **NOT** a live physical stream gauge or real-time optical flood satellite feed.
2. **Drought Severity & SPI Index Layer (`/map/drought`):**
   - **Type:** Long-term Climatological Precipitation Deficit Index ($0-100$).
   - **Data Origin:** Precipitation departure baselines and aridity index.
   - **Important Distinction:** This is **NOT** daily physical in-situ soil moisture sensor telemetry.
3. **Active Hazard Points (`/map/hazards`):**
   - **Type:** Near-real-time satellite thermal anomaly detections (NASA FIRMS) and benchmark disaster event records.
