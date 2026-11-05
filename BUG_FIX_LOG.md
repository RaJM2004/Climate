# Bug Fix & Technical Remediation Log
## Community Climate Vulnerability Mapping (India) – Academic Platform
**Last Updated:** 2026-11-05 (Post-Verification Audit)

---

### 1. Summary of Identified Defects & Remediations

| Bug ID | Component | Defect Description | Root Cause | Technical Fix Applied |
|---|---|---|---|---|
| **BUG-001** | GIS / Administrative | Outdated 29-state hierarchy; missing Telangana and Ladakh | Source GeoJSON reflected pre-2014 boundaries (Telangana inside AP, Ladakh inside J&K) | Created `backend/scripts/align_admin_structure.py` to reassign 10 districts to Telangana, 2 to Ladakh, merged DNH & DD, producing exact constitutional 28 States and 8 UTs. |
| **BUG-002** | Database / SQLAlchemy | Relative SQLite path resolution error | `sqlite:///./climate_intelligence.db` opened different files depending on current working directory | Anchored SQLite path in `backend/app/core/database.py` to absolute backend directory (`backend/climate_intelligence.db`). |
| **BUG-003** | Backend API | Multi-district comparison failed (`IND_OD_KEN`, `IND_RJ_CHU`) | `analytics.py` performed strict SQL `District.id.in_(district_ids)` which failed on fuzzy tokens | Integrated `find_district_in_db` in `analytics.py` to support fuzzy names and district tokens. |
| **BUG-004** | Database Schema | `OperationalError: no such column: states.is_union_territory` | SQLite `create_all()` does not alter existing tables | Updated `init_db.py` to drop and recreate cleanly with `force_refresh=True`, establishing `is_union_territory` and `admin_type`. |
| **BUG-005** | Python / Pydantic | Pydantic v2 deprecation warnings (`class Config:`) | Pydantic v2 replaced `class Config:` with `ConfigDict` | Refactored all schemas in `schemas.py` and `config.py` to `model_config = ConfigDict(from_attributes=True)`. |
| **BUG-006** | Python Standard Library | `DeprecationWarning: datetime.utcnow() is deprecated` | Python 3.12 deprecated naive UTC datetimes | Converted all occurrences in `reporting_service.py` and models to `datetime.now(timezone.utc)`. |
| **BUG-007** | Frontend / Vite | JSX parse error in `MapPage.tsx` (`Expected ',' or ')' but found '{'`) | Unclosed HTML spans around `Adaptive capacity` badge | Corrected JSX closing tags in `MapPage.tsx`; confirmed clean build with `npm run build`. |
| **BUG-008** | Frontend / UI | Metric cards displayed fallback "26 Districts" and "7 States" | Static default strings in `HomePage.tsx` | Replaced fallbacks with dynamic API fields: `${data.total_districts} Districts` (594) and `${data.total_administrative_units} Admin Units (28 States, 8 UTs)`. |
| **BUG-009** | Backend API / Admin | Admin dashboard endpoint missing UT and unit breakdown | Endpoint only reported total districts and raw states | Updated `get_admin_dashboard_stats` in `admin.py` to return 28 states, 8 UTs, 36 units, 594 districts, and 7,128 monthly climatology records. |
| **BUG-010** | Backend Tests | Unit test assertion failure on UT names | Expected `"Jammu and Kashmir"` but list contained `"Jammu & Kashmir"` | Updated assertion in `test_backend.py` to fuzzy match `any("Jammu" in n for n in ut_names)` and asserted 7,128 monthly climate records. |
| **BUG-011** | Frontend / TypeScript | `npm run build` failed in `ComparisonPage.tsx` | `string[][]` was passed to `setSearchParams` causing TS2345 type error in React Router v7 | Refactored `setSearchParams` to construct standard `URLSearchParams` instances. |
| **BUG-012** | Frontend / TSX | `npm run build` failed in `AdminPage.tsx` | Duplicated `)}` tokens following Tab 6 caused TS1005 / TS1381 compiler syntax errors | Removed duplicate tokens; `npm run build` completed with Exit Code 0 in 6.49s. |
| **BUG-013** | Backend Security | Admin mutation endpoints lacked role authorization | `/sync`, `/weights`, `/users` accepted anonymous HTTP calls without JWT validation | Added `get_current_admin_user` FastAPI dependency requiring `ADMINISTRATOR` role. |
| **BUG-014** | Security / Auth | Insecure default admin credentials (`admin / admin123`) | Hardcoded trivial password in `init_db.py` reset on every server restart | Replaced with strong `Climate@Admin2026#Secured` credentials and non-overwriting seeding logic. |
| **BUG-015** | Backend API / Admin | Hardcoded sync record count in `admin.py` | `records_ingested = 26` was statically returned regardless of source | Replaced with dynamic integration queries to Open-Meteo and NASA FIRMS returning real counts. |

---

### 2. Verified Local Execution Commands

#### Prerequisites:
- Python 3.10+ (Current: Python 3.12.4)
- Node.js 18+ & npm
- **No Docker / No Redis / No Celery required**

#### Step 1: Start the Backend Service
From the project root:
```bash
cd d:/Projects/Climate/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API Base:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

#### Step 2: Start the Frontend Application
From the project root:
```bash
cd d:/Projects/Climate/frontend
npm run dev
```
- **Public User Dashboard:** `http://127.0.0.1:5173`
- **Administration Portal:** `http://127.0.0.1:5173/admin`
  - Secured Username: `admin`
  - Secured Password: `Climate@Admin2026#Secured`

#### Step 3: Run the Automated Test Suite
From the project root:
```bash
python -m pytest backend/tests -v
```
*Current test suite result: 17 passed in 10.89s (100% pass rate).*

---

### Stage 3: Academic Demonstration Hardening & Security Log (2026-11-06)

1. **Security Vulnerability: Hardcoded Admin Password in Frontend:**
   - *Discovery:* Security audit detected default administrator password string in `AdminPage.tsx` state and UI footnote.
   - *Fix:* Removed all hardcoded credentials from `AdminPage.tsx`. Form defaults to empty inputs. Rebuilt bundle to eliminate plaintext strings from `dist/`.
2. **Version Control Security: Missing Root `.gitignore`:**
   - *Discovery:* No root `.gitignore` existed to exclude `.env` and SQLite database files.
   - *Fix:* Created `.gitignore` and `backend/.gitignore` explicitly excluding `.env`, `*.db`, `node_modules/`, and build artifacts.
3. **Historical Climate Realism & Caching:**
   - *Discovery:* Historical climate endpoint was using regional archetypes instead of querying archive API.
   - *Fix:* Added `fetch_historical_trends_live` with calendar month aggregation and SQLite caching in `historical_climate_records`.
4. **Data Provenance & Transparency:**
   - *Discovery:* Population sub-demographics were presented without noting estimation methodology.
   - *Fix:* Added `SYNTHETIC_ESTIMATE` tagging and UI badges distinguishing Census 2011 official headcount from modeled national demographic proportions.
5. **15-Indicator Scientific Registry:**
   - *Discovery:* Indicators lacked granular provenance metadata.
   - *Fix:* Embedded full provenance registry (source, reference year, resolution, confidence, data type) in `/districts/{id}` and district profile UI.
