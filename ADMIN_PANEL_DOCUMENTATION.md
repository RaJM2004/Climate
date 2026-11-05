# Administration Panel & System Governance Manual
## Community Climate Vulnerability Mapping (India) – Academic Platform

---

### 1. Architectural Scope & Security Model
The Administration Panel (`/admin`) is a dedicated, protected subsystem designed exclusively for system administrators, data engineers, and academic evaluators. It does not replace or alter the public climate intelligence exploration portal.

#### Security & Authentication:
- **Authentication Mechanism:** Stateless JSON Web Token (JWT) using HMAC-SHA256 (`HS256`).
- **Endpoint Protection:** All administrative endpoints (`/api/v1/admin/*`) require the `Authorization: Bearer <token>` header verified via FastAPI dependency injection.
- **Secured Administrator Credentials:**
  - **Username:** `admin`
  - **Password:** `Climate@Admin2026#Secured`
  - **Role:** `ADMINISTRATOR`
- **Credential Protection:** External API keys (e.g., NASA FIRMS key, Copernicus CDS key) are never exposed in UI text, JSON responses, or browser logs. Unconfigured keys are displayed as `CONFIGURATION_UNAVAILABLE` rather than masked dummy strings.

---

### 2. Admin Panel Governance Modules

#### A. Administrative Dashboard (`/admin` -> Dashboard Tab)
Displays live, database-derived operational KPIs directly queried from SQLite:
- **Total Constitutional States:** `28`
- **Total Union Territories:** `8`
- **Total Administrative Units:** `36`
- **Total Monitored Districts:** `594`
- **Districts with Active Climate Data:** Real-time count of districts linked to valid rainfall & temperature observations.
- **Population Baseline Records:** `594` district demographic records.
- **Historical Climate Climatology Records:** `7,128` monthly baseline records ($594 \times 12$ months).
- **Embedded Database Type:** `SQLite Embedded (Zero-Config / No Docker / No Redis)`.
- **Scheduler Cadence:** 6-Hour background synchronization interval.

#### B. Geographic Data Management (`/admin` -> Geographic Data Tab)
Provides geospatial data engineers with inspection and topology validation tools:
- **Administrative Unit Inventory:** Table displaying all 28 States and 8 Union Territories with official ISO codes, regional classifications, and constituent district counts.
- **Constitutional Entity Verification:** Confirms proper administrative status for `Ladakh` (UT), `Jammu and Kashmir` (UT), `Dadra and Nagar Haveli and Daman and Diu` (merged UT), `Delhi`, `Chandigarh`, `Lakshadweep`, `Puducherry`, and `Andaman and Nicobar Islands`.
- **Topological Integrity Checker:** Runs `shapely.geometry.shape(geom).is_valid` on all 594 district geometries in `data/india_districts.json` to verify zero self-intersections or bowtie anomalies.

#### C. Data Source Management (`/admin` -> Data Sources Tab)
Exposes the runtime configuration and connectivity health of all 6 external providers:
1. **Open-Meteo High-Resolution Forecast:** Status, endpoint, parameter list, and last successful ping.
2. **Open-Meteo Historical Archive:** Climatological baseline status (1991–2020 normals).
3. **NASA FIRMS Active Fire Hotspots:** Sensor status (MODIS/VIIRS), user map key presence, and satellite anomaly count.
4. **Census of India / WorldPop:** Demographic resolution and reference year.
5. **NASA SRTM 30m DEM:** Local elevation raster path and terrain coverage.
6. **Copernicus CDS (ERA5-Land):** Account credentials verification and land-surface reanalysis status.

#### D. Data Synchronization Scheduler (`/admin` -> Data Synchronization Tab)
Manages the background ingestion lifecycle:
- **Last Sync Timestamp:** ISO 8601 UTC timestamp of the most recent automated ingestion run.
- **Next Scheduled Cadence:** Countdown to next scheduled 6-hour cycle.
- **Manual Synchronization Trigger:** Allows administrators to trigger an immediate, non-blocking sync for Open-Meteo telemetry or NASA FIRMS hotspots with real-time UI status feedback.
- **Duplicate Prevention:** Ingestion routines employ database upserts (checking district code and observation timestamp) to prevent duplicate records.

#### E. Vulnerability Indicator & Weight Governance (`/admin` -> Indicator Weights Tab)
Empowers environmental scientists to evaluate sensitivity scenarios:
- **Interactive Slider Controls:** Adjust dimensional weights ($w_e, w_s, w_a$).
- **Sum-to-Unity Constraint:** Automatically validates that $w_e + w_s + w_a = 1.00$.
- **Audit Logging:** Every weight adjustment is written to the `audit_logs` table with timestamp, user ID, previous weights, and new weights.
- **Recalculation Trigger:** Recalculates composite vulnerability scores for all 594 districts with zero data fabrication.

#### F. System & Ingestion Logs (`/admin` -> System Logs Tab)
Provides real-time visibility into system behavior:
- Historical ledger of API calls, HTTP status codes, latency in milliseconds, records inserted, and failure error messages.
- Full traceback inspection for failed external network calls.
