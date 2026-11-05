# Climate & Environmental Data Integration Architecture

## 1. Data Provider Overview

| Source | Organization | Indicators Provided | Update Frequency | Access Policy & License | Status in Platform |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IMD Public API** | India Meteorological Department | District rainfall, temperatures, weather warnings, heavy rain alerts | 3 hours / Daily | Public Government API (Attribution required) | Active API client & ingestion pipeline |
| **NASA GPM IMERG** | NASA Goddard Space Flight Center | Half-hourly, daily, and 7-day cumulative satellite precipitation | Daily (Early/Late runs) | Open NASA Earthdata (User registration required) | Integrated API & GeoTIFF/HDF5 reader |
| **Copernicus ERA5** | ECMWF / European Union | 30-year reanalysis, 2m temperature anomalies, wind, surface pressure | Monthly / Retrospective | Copernicus Open Access (Free license) | Integrated climate baseline module |
| **NASA FIRMS** | NASA Earth Science Data | Active fire detections, thermal hotspots, FRP (Fire Radiative Power) | Near Real-Time (3 hours) | NASA Open Data (MAP_KEY required) | Real-time fire alert ingestor |
| **Census of India** | Office of the Registrar General | Total population, population density, rural/urban split, literacy, housing | Decennial / Periodic updates | Government Open Data License - India (GODL) | PostGIS demographic table |
| **NWIC Portal** | National Water Informatics Centre | District spatial boundaries, river basins, reservoir levels | Weekly / Seasonal | Ministry of Jal Shakti | PostGIS geometry and boundary layers |

---

## 2. API Integration Standards

1. **Authentication & Secret Management**:
   - Never hardcode credentials in code. All external API keys (`IMD_API_KEY`, `NASA_FIRMS_MAP_KEY`, etc.) are injected via environment variables.
   - If keys are omitted in development mode, clients automatically fall back to curated and verified baseline observation snapshots with unambiguous demonstration timestamps.
2. **Attribution & Transparency**:
   - Every observation displayed in the user interface is tagged with:
     - `source_name`: Official issuing authority (e.g., "India Meteorological Department").
     - `source_url`: Verifiable reference URL.
     - `observation_timestamp`: Exact instant when the physical measurement was recorded.
     - `ingestion_timestamp`: When the record entered the platform database.
     - `data_quality_status`: `VALIDATED`, `PROVISIONAL`, or `DEMONSTRATION`.
3. **Data Distinction Standard**:
   - **Observed Data**: Direct physical ground or satellite instrument readings.
   - **Historical Baselines**: Climatological averages over 1991–2020.
   - **Official Government Warnings**: Official IMD/NDMA color-coded warnings (Green, Yellow, Orange, Red).
   - **Model Estimates**: Normalized vulnerability metrics derived from multi-criteria algorithms.
