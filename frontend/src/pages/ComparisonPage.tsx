import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import {
  GitCompare,
  Plus,
  X,
  Search,
  Compass,
  FileText,
  ShieldAlert,
  Droplets,
  Thermometer,
  Users,
  Mountain,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { api, API_BASE, DistrictSummary } from '../services/api';
import { VulnerabilityBadge } from '../components/VulnerabilityBadge';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allDistricts, setAllDistricts] = useState<DistrictSummary[]>([]);
  // Default to Pune (Maharashtra), Kendrapara (Odisha), and Churu (Rajasthan)
  const [selectedIds, setSelectedIds] = useState<string[]>(['IND_MA_PUNE_329', 'IND_OD_KENDRA_388', 'IND_RJ_CHU']);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial load: Fetch district list and load query params if available
  useEffect(() => {
    api.getDistricts().then((data) => {
      setAllDistricts(data);
      const paramIds = searchParams.getAll('district_ids');
      if (paramIds.length > 0) {
        setSelectedIds(paramIds);
      }
    });
  }, []);

  // Fetch comparative telemetry whenever selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    api.getDistrictComparison(selectedIds)
      .then((res) => {
        setComparisonData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load comparison data:', err);
        setErrorMsg('Failed to load comparative intelligence for the selected regions.');
        setLoading(false);
      });
  }, [selectedIds]);

  const addEntity = (id: string) => {
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 5) {
      alert('You can compare a maximum of 5 entities concurrently for visual clarity.');
      return;
    }
    const updated = [...selectedIds, id];
    setSelectedIds(updated);
    const params = new URLSearchParams();
    updated.forEach((item) => params.append('district_ids', item));
    setSearchParams(params);
    setSearchQuery('');
  };

  const removeEntity = (id: string) => {
    if (selectedIds.length <= 1) {
      alert('Please keep at least 1 entity selected for comparison.');
      return;
    }
    const updated = selectedIds.filter((i) => i !== id);
    setSelectedIds(updated);
    const params = new URLSearchParams();
    updated.forEach((item) => params.append('district_ids', item));
    setSearchParams(params);
  };

  // Filtered district & state suggestions for search dropdown
  const combinedSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    // 1. Unique state suggestions for Option B (State-level aggregation)
    const uniqueStates = Array.from(new Set(allDistricts.map((d) => d.state_name))).filter(Boolean);
    const stateMatches = uniqueStates
      .filter((st) => st.toLowerCase().includes(query))
      .filter((st) => !selectedIds.includes(st) && !selectedIds.includes(`STATE_${st}`))
      .slice(0, 2)
      .map((st) => ({
        id: st,
        name: `${st} (State Aggregate)`,
        state_name: 'Aggregated State Profile',
        is_state: true,
        vulnerability_score: null
      }));

    // 2. District suggestions for Option A (District-level comparison)
    const districtMatches = allDistricts
      .filter((d) => !selectedIds.includes(d.id))
      .filter((d) =>
        d.name.toLowerCase().includes(query) ||
        d.state_name.toLowerCase().includes(query) ||
        (d.code && d.code.toLowerCase().includes(query))
      )
      .slice(0, 8)
      .map((d) => ({
        id: d.id,
        name: d.name,
        state_name: d.state_name,
        is_state: false,
        vulnerability_score: d.vulnerability_score
      }));

    return [...stateMatches, ...districtMatches];
  }, [allDistricts, selectedIds, searchQuery]);

  // Color palette for comparative radar and tables
  const colorPalette = ['#2563EB', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6'];

  const districtsList = comparisonData?.districts || [];
  const radarData = comparisonData?.radar_data || [];
  const radarAvailable = comparisonData?.radar_available !== false && radarData.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Context */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
          <GitCompare className="w-4 h-4" />
          <span>Section 6: Multi-District & State Comparative Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          District Climate & Vulnerability Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Evaluate comparative vulnerabilities, socioeconomic sensitivities, terrain elevations, and real-time weather anomalies side-by-side across selected Indian districts or state-level aggregates.
        </p>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* State-Level Aggregation Note if present */}
      {comparisonData?.aggregation_note && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center space-x-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span><b>Methodology Note:</b> {comparisonData.aggregation_note}</span>
        </div>
      )}

      {/* Entity Selector & Active Chips Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Entities for Comparison:</span>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {districtsList.map((d: any, idx: number) => {
                const entityId = d.district_id || d.id;
                const entityName = d.district_name || d.name;
                const color = colorPalette[idx % colorPalette.length];
                return (
                  <div
                    key={entityId}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs"
                    style={{
                      backgroundColor: `${color}10`,
                      borderColor: `${color}40`,
                      color: color
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="font-bold text-slate-900">{entityName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({d.state_name}{d.is_state_aggregate ? ' • State' : ''})
                    </span>
                    <button
                      onClick={() => removeEntity(entityId)}
                      className="hover:opacity-80 p-0.5 rounded-full text-slate-400 hover:text-slate-700 transition"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search to Add District or State */}
          <div className="relative w-full sm:w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search district or state (e.g. Pune, Kendrapara)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Suggestions Dropdown */}
            {combinedSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {combinedSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addEntity(s.id)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center justify-between transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{s.name}</span>{' '}
                      <span className="text-[11px] text-slate-500">({s.state_name})</span>
                    </div>
                    {s.is_state ? (
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        State Aggregate
                      </span>
                    ) : s.vulnerability_score !== null && s.vulnerability_score !== undefined ? (
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Risk: {s.vulnerability_score.toFixed(1)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Comparative Visuals: Radar Overlay + Core KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Overlay */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Dimensional Radar Comparison
              </h2>
              <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                IPCC Dimensions
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-axial polygon comparison across Exposure ($E$), Sensitivity ($S$), Adaptive Capacity ($A$), Deficit ($100-A$), and Overall Vulnerability ($V$).
            </p>

            <div className="h-80 w-full mt-3 flex items-center justify-center">
              {loading ? (
                <div className="text-xs text-slate-400">Loading radar telemetry...</div>
              ) : !radarAvailable ? (
                <div className="text-xs text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-1">
                  <ShieldAlert className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Radar Dimensions Unavailable</p>
                  <p className="text-[11px] text-slate-400">
                    Vulnerability indicators for the selected entities are currently unavailable.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {districtsList.map((d: any, idx: number) => {
                      const entityId = d.district_id || d.id;
                      const entityName = d.district_name || d.name;
                      const color = colorPalette[idx % colorPalette.length];
                      return (
                        <Radar
                          key={entityId}
                          name={`${entityName} (${d.state_name}${d.is_state_aggregate ? ' State' : ''})`}
                          dataKey={entityId}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.2}
                        />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Comparative Overview Summary Cards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Comparative Vulnerability Ranking
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by composite vulnerability index score: $V = 0.40E + 0.30S + 0.30(100 - A)$
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {districtsList.length} Selected
            </span>
          </div>

          <div className="space-y-3">
            {districtsList
              .slice()
              .sort((a: any, b: any) => {
                const scoreA = a.vulnerability_score ?? a.vulnerability?.vulnerability_score ?? -1;
                const scoreB = b.vulnerability_score ?? b.vulnerability?.vulnerability_score ?? -1;
                return scoreB - scoreA;
              })
              .map((d: any, idx: number) => {
                const entityId = d.district_id || d.id;
                const entityName = d.district_name || d.name;
                const color = colorPalette[idx % colorPalette.length];
                const vScore = d.vulnerability_score ?? d.vulnerability?.vulnerability_score;
                const eScore = d.exposure_score ?? d.vulnerability?.exposure_score;
                const sScore = d.sensitivity_score ?? d.vulnerability?.sensitivity_score;
                const aScore = d.adaptive_capacity_score ?? d.vulnerability?.adaptive_capacity_score;
                const deficit = d.adaptive_deficit ?? (aScore !== null && aScore !== undefined ? 100 - aScore : null);
                const category = d.vulnerability_category ?? d.vulnerability?.vulnerability_category;

                return (
                  <div
                    key={entityId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => {
                      if (!d.is_state_aggregate) {
                        navigate(`/district/${entityId}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{entityName}</span>
                            {d.is_state_aggregate && (
                              <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                State Aggregate
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {d.state_name} • {d.zone || d.climate_zone || 'India'}
                          </span>
                        </div>
                      </div>
                      {vScore !== null && vScore !== undefined ? (
                        <VulnerabilityBadge category={category} score={vScore} size="sm" />
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Unavailable</span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-semibold">Exposure ($E$)</span>
                        <span className="font-mono font-bold text-xs text-indigo-700">
                          {eScore !== null && eScore !== undefined ? eScore.toFixed(1) : 'Unavailable'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-semibold">Sensitivity ($S$)</span>
                        <span className="font-mono font-bold text-xs text-purple-700">
                          {sScore !== null && sScore !== undefined ? sScore.toFixed(1) : 'Unavailable'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-semibold">Capacity ($A$)</span>
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {aScore !== null && aScore !== undefined ? aScore.toFixed(1) : 'Unavailable'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-semibold">Deficit ($100-A$)</span>
                        <span className="font-mono font-bold text-xs text-orange-700">
                          {deficit !== null && deficit !== undefined ? deficit.toFixed(1) : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comprehensive Indicator Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Side-by-Side Indicator Comparison Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Cross-sectional comparison of environmental baselines, demographics, and real-time weather observations
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md">
            WGS84 Normalized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/4">Indicator / Baseline Parameter</th>
                {districtsList.map((d: any, idx: number) => {
                  const entityId = d.district_id || d.id;
                  const entityName = d.district_name || d.name;
                  const color = colorPalette[idx % colorPalette.length];
                  return (
                    <th key={entityId} className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="font-bold text-slate-900">{entityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 normal-case font-normal">
                        {d.state_name} {d.is_state_aggregate ? '(State Aggregate)' : ''}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Category: Administrative & Geographic */}
              <tr className="bg-slate-50/60 font-bold text-slate-900">
                <td colSpan={districtsList.length + 1} className="py-2 px-4 text-[11px] uppercase tracking-wider text-slate-500">
                  Geographic & Environmental Baseline
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Ecological Terrain Zone</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-semibold text-slate-800">
                    {d.zone || d.climate_zone || 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Centroid Coordinates</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {d.centroid_lat && d.centroid_lng
                      ? `${d.centroid_lat.toFixed(2)}° N, ${d.centroid_lng.toFixed(2)}° E`
                      : d.is_state_aggregate
                      ? 'State Spatial Centroid'
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">NASA SRTM Elevation (m MSL)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-slate-800">
                    {d.elevation_m !== null && d.elevation_m !== undefined
                      ? `${d.elevation_m} m (${d.elevation_source || 'NASA SRTM GL1'})`
                      : d.elevation_source || 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Volumetric Soil Moisture ($m^3/m^3$)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-slate-600">
                    {d.soil_moisture_m3m3 !== null && d.soil_moisture_m3m3 !== undefined
                      ? `${d.soil_moisture_m3m3} m³/m³`
                      : d.soil_moisture_status || 'Unavailable (Copernicus CDS Authentication Not Configured)'}
                  </td>
                ))}
              </tr>

              {/* Category: Demographics */}
              <tr className="bg-slate-50/60 font-bold text-slate-900">
                <td colSpan={districtsList.length + 1} className="py-2 px-4 text-[11px] uppercase tracking-wider text-slate-500">
                  Demographics & Human Exposure (Census of India 2011)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Total Population</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {d.population ? `${(d.population / 1000000).toFixed(2)}M (Census 2011)` : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Population Density (Persons / $km^2$)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-purple-700 font-semibold">
                    {d.population_density !== null && d.population_density !== undefined
                      ? `${d.population_density.toFixed(1)} / km²`
                      : d.indicators?.sensitivity?.pop_density
                      ? `${d.indicators.sensitivity.pop_density} / km²`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>

              {/* Category: Vulnerability Dimensions */}
              <tr className="bg-slate-50/60 font-bold text-slate-900">
                <td colSpan={districtsList.length + 1} className="py-2 px-4 text-[11px] uppercase tracking-wider text-slate-500">
                  IPCC AR5 Vulnerability Indices (0–100 Scale)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Exposure Score ($E$) (40% Weight)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                    {d.exposure_score !== null && d.exposure_score !== undefined
                      ? `${d.exposure_score.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Sensitivity Score ($S$) (30% Weight)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-purple-700">
                    {d.sensitivity_score !== null && d.sensitivity_score !== undefined
                      ? `${d.sensitivity_score.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Adaptive Capacity Score ($A$) (30% Weight)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                    {d.adaptive_capacity_score !== null && d.adaptive_capacity_score !== undefined
                      ? `${d.adaptive_capacity_score.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Adaptive Deficit ($100 - A$)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-orange-700">
                    {d.adaptive_deficit !== null && d.adaptive_deficit !== undefined
                      ? `${d.adaptive_deficit.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr className="bg-amber-50/40">
                <td className="py-3 px-4 font-bold text-slate-900">Composite Vulnerability Score ($V$)</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-3 px-4 font-mono font-extrabold text-sm text-amber-700">
                    {d.vulnerability_score !== null && d.vulnerability_score !== undefined
                      ? `${d.vulnerability_score.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Vulnerability Category Tier</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4">
                    {d.vulnerability_category ? (
                      <VulnerabilityBadge category={d.vulnerability_category} />
                    ) : (
                      <span className="text-slate-400">Unavailable</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Category: Real-time Weather Telemetry */}
              <tr className="bg-slate-50/60 font-bold text-slate-900">
                <td colSpan={districtsList.length + 1} className="py-2 px-4 text-[11px] uppercase tracking-wider text-slate-500">
                  Near-Real-Time Weather Telemetry (Open-Meteo)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Current Modelled Temperature</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                    {d.current_temp_c !== null && d.current_temp_c !== undefined
                      ? `${d.current_temp_c.toFixed(1)}°C`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Recent 24h Precipitation</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-semibold text-blue-700">
                    {d.recent_rainfall_24h !== null && d.recent_rainfall_24h !== undefined
                      ? `${d.recent_rainfall_24h.toFixed(1)} mm`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Weather Observation Timestamp</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-[10px] text-slate-500">
                    {d.weather_timestamp ? new Date(d.weather_timestamp).toLocaleString() : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Telemetry Source & Verification</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 text-[11px] text-slate-600">
                    {d.weather_source ? `${d.weather_source} [${d.weather_quality || 'VERIFIED'}]` : 'Unavailable'}
                  </td>
                ))}
              </tr>

              {/* Category: Scientific Confidence & Methodology */}
              <tr className="bg-slate-50/60 font-bold text-slate-900">
                <td colSpan={districtsList.length + 1} className="py-2 px-4 text-[11px] uppercase tracking-wider text-slate-500">
                  Scientific Confidence & Empirical Quality
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Scientific Confidence Index</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                    {d.data_confidence !== null && d.data_confidence !== undefined
                      ? `${d.data_confidence.toFixed(1)}%`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Indicator Completeness</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-slate-700">
                    {d.data_completeness_pct !== null && d.data_completeness_pct !== undefined
                      ? `${d.data_completeness_pct.toFixed(1)}% (15 Indicators)`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Empirical Ground & Census Share</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-indigo-700">
                    {d.empirical_coverage_pct !== null && d.empirical_coverage_pct !== undefined
                      ? `${d.empirical_coverage_pct.toFixed(1)}% (Census & Station)`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Numerical Model-Derived Share</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-purple-700">
                    {d.model_derived_share_pct !== null && d.model_derived_share_pct !== undefined
                      ? `${d.model_derived_share_pct.toFixed(1)}% (ERA5 / Open-Meteo)`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Archetype / Estimated Share</td>
                {districtsList.map((d: any) => (
                  <td key={d.district_id || d.id} className="py-2.5 px-4 font-mono text-amber-700">
                    {d.estimated_share_pct !== null && d.estimated_share_pct !== undefined
                      ? `${d.estimated_share_pct.toFixed(1)}% (Regional Archetype)`
                      : 'Unavailable'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
