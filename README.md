# Community Climate Vulnerability Mapping (India)
### Geospatial Climate Intelligence & Environmental Hazard Monitoring Platform

An academic and scientific decision-support web application for India that combines:
1. **Subsystem 1: Long-term Climate Vulnerability Assessment** (Multi-decadal IPCC AR5/AR6 indicator model)
2. **Subsystem 2: Current & Recent Hazard Monitoring** (IMD real-time synoptic weather telemetry, official warnings, and NASA FIRMS active fire hotspots)

> **CRITICAL ARCHITECTURAL DISTINCTION:**  
> These two independent systems operate on distinct analytical baselines and are strictly decoupled. Model risk estimates are never presented as official government disaster warnings.

---

## 1. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet.js, React-Leaflet, Recharts, Axios, Lucide React
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Shapely, PyJWT, Passlib
- **Database**: PostgreSQL with PostGIS (with automatic zero-configuration SQLite fallback for portable offline college presentations)
- **Reporting & Exports**: ReportLab (publication-ready PDF district briefs), Pandas, OpenPyXL (multi-sheet Excel and CSV datasets)
- **Background Automation**: APScheduler (automated periodic sync for IMD and NASA FIRMS feeds)
- **Testing**: Pytest

---

## 2. Project Directory Structure

```text
d:\Projects\Climate\
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints (districts, map, analytics, alerts, reports, admin, auth)
│   │   ├── core/            # Config, database engine, security (JWT & password hashing)
│   │   ├── db/              # Initial database seeding & schema migrations
│   │   ├── integrations/    # Modular clients: IMD, NASA GPM, Copernicus ERA5, NASA FIRMS, Census
│   │   ├── models/          # SQLAlchemy relational models (14 tables)
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── scheduler/       # APScheduler automated data ingestion jobs
│   │   ├── services/        # Vulnerability mathematical engine, spatial service, ReportLab PDF, exports
│   │   └── main.py          # FastAPI application entrypoint with CORS & lifespans
│   ├── scripts/
│   │   └── migrate.py       # PostgreSQL/PostGIS & SQLite migration script
│   ├── tests/
│   │   └── test_backend.py  # Pytest test suite
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Backend environment settings
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Header, SystemDistinctionBanner, VulnerabilityBadge, Layout
│   │   ├── pages/           # 10 Application Pages:
│   │   │   ├── HomePage.tsx            # Overview & national KPIs
│   │   │   ├── MapPage.tsx             # Interactive Leaflet GIS map with layer selector
│   │   │   ├── DistrictProfilePage.tsx # Detailed district analysis & radar profile
│   │   │   ├── AnalyticsPage.tsx       # 12-Month rainfall & temperature curves
│   │   │   ├── ComparisonPage.tsx      # Multi-district cross-comparison & radar chart
│   │   │   ├── AlertsPage.tsx          # Official IMD warnings & NASA FIRMS fires
│   │   │   ├── ReportsPage.tsx         # ReportLab PDF briefs, CSV & Excel exports
│   │   │   ├── MethodologyPage.tsx     # Formulas, weights & data sources
│   │   │   ├── AdminPage.tsx           # Live weight sliders & manual feed sync
│   │   │   └── AboutPage.tsx           # Academic project scope & peer review form
│   │   ├── services/        # Axios API client
│   │   ├── App.tsx          # React Router v7 routes
│   │   └── main.tsx         # React root
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── india_districts.json # GeoJSON boundaries & baseline metrics for Indian districts
│   └── reports/             # Compiled PDF briefs and exports
│
├── docs/
│   ├── vulnerability_methodology.md
│   └── data_sources.md
│
├── scripts/
│   └── generate_geo_data.py # Spatial dataset generator
│
├── .env.example
└── README.md
```

---

## 3. Quick Start & Execution Guide

### Prerequisites
- Node.js (v18+) and npm
- Python (3.11+)

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd d:\Projects\Climate\backend
   ```

2. Activate the existing virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```

3. Run initial database migration & dataset seeding:
   ```bash
   python scripts/migrate.py
   ```

4. Launch the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   - **Backend API URL**: `http://localhost:8000`
   - **Interactive Swagger Documentation**: `http://localhost:8000/docs`
   - **Health-check Endpoint**: `http://localhost:8000/health`

---

### Step 2: Start the Frontend (React + Vite)

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd d:\Projects\Climate\frontend
   ```

2. Launch the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 4. Database Setup: PostgreSQL + PostGIS (Optional) vs SQLite

The application is engineered with an intelligent **dual-database design**:
- **Option 1: Local PostgreSQL + PostGIS** (For production or lab evaluation):
  1. Install PostgreSQL and create a database:
     ```sql
     CREATE DATABASE climate_vulnerability_db;
     ```
  2. In `backend/.env`, set:
     ```env
     DATABASE_URL="postgresql://postgres:your_password@localhost:5432/climate_vulnerability_db"
     ```
  3. Run `python scripts/migrate.py`. The script automatically executes `CREATE EXTENSION IF NOT EXISTS postgis;` and provisions all spatial tables.

- **Option 2: Zero-Configuration SQLite Fallback** (Default for portable evaluation):
  - Preconfigured out-of-the-box (`sqlite:///./climate_intelligence.db`).
  - No external database server installation required. Ideal for presentation defense on any laptop.

---

## 5. Mathematical Vulnerability Model

The composite vulnerability index is calculated in `backend/app/services/vulnerability_engine.py`:

$$V = 0.40 \cdot E + 0.30 \cdot S + 0.30 \cdot (100 - A)$$

Where:
- **Exposure ($E \in [0, 100]$)**: Historical rainfall extremes (95th percentile), flood basin area %, annual heat days $>40^\circ\text{C}$, drought SPI severity, coastal cyclone hazard.
- **Sensitivity ($S \in [0, 100]$)**: Population density, agricultural workforce dependency, non-resilient kutcha housing proportion, marginalized social groups.
- **Adaptive Capacity ($A \in [0, 100]$)**: Primary Health Center & hospital bed density, surfaced road connectivity, treated tap water supply, literacy rate, emergency civil defense shelters.
- **Adaptive Deficit**: Calculated as $(100 - A)$ to reflect institutional and infrastructural vulnerability.

### 5-Tier Scientific Classification
| Score Range | Vulnerability Tier | Color Code | Action Level |
| :---: | :---: | :---: | :--- |
| **0 – 20** | **Very Low** | Green (`#10B981`) | Routine baseline monitoring |
| **21 – 40** | **Low** | Teal (`#34D399`) | General resilience maintenance |
| **41 – 60** | **Moderate** | Amber (`#FBBF24`) | Targeted infrastructure upgrades |
| **61 – 80** | **High** | Orange (`#F97316`) | Priority climate adaptation & mitigation |
| **81 – 100** | **Very High** | Red (`#EF4444`) | Urgent disaster risk reduction & state intervention |

---

## 6. Running Automated Tests

Run the complete backend test suite:
```bash
cd d:\Projects\Climate\backend
.\venv\Scripts\pytest -v tests/test_backend.py
```
**Test Coverage Includes:**
- Root & `/health` checks
- Mathematical formula & 0-100 normalization tests
- Missing-data policy validation (strictly non-zero)
- District profiles & spatial coordinate queries
- Thematic GeoJSON layer generation
- Overview analytics & multi-district radar comparison
- Official IMD weather warnings validation
- ReportLab PDF generation, CSV, and Excel exports

---

## 7. College Presentation & Defense Checklist

- [x] **Clear Architectural Separation**: Explain how Subsystem 1 (Long-term Vulnerability) and Subsystem 2 (Real-time Hazard Monitoring) operate independently.
- [x] **Interactive GIS Map**: Navigate to `/map`, toggle thematic layers (Rainfall, Temperature, Flood, Drought, Population), pan/zoom across India, and inspect district polygons.
- [x] **Live Parameter Engine**: In `/admin`, adjust the Exposure or Adaptive Capacity sliders and demonstrate dynamic database score recalculation across all districts.
- [x] **Publication PDF Export**: In `/reports`, select a district and download the formatted PDF brief generated in real-time by ReportLab.
- [x] **Multi-District Comparison**: In `/comparison`, demonstrate the multi-axis Radar Chart comparing divergent ecological zones (e.g. Kendrapara coastal vs Wayanad Western Ghats vs Churu Thar Desert).
