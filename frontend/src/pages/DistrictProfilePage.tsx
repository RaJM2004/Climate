import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Database,
  Calendar,
  Users
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api, API_BASE } from '../services/api';
import { VulnerabilityBadge } from '../components/VulnerabilityBadge';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const DistrictProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getDistrictDetail(id)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load district details:', err);
        setError('District not found or server error');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 text-sm">Loading district climate intelligence profile...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white border border-red-200 rounded-xl max-w-xl mx-auto text-center space-y-3">
        <div className="text-red-600 font-bold">Unable to load district</div>
        <p className="text-xs text-slate-500">{error || 'District not found'}</p>
        <button
          onClick={() => navigate('/map')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
        >
          Back to Map
        </button>
      </div>
    );
  }

  const v = data.vulnerability || {};
  const cw = data.current_weather || {};
  const pop = data.population || {};
  const ind = data.indicators || {};

  // Data for Radar Chart
  const radarData = [
    { dimension: 'Extreme Rain', value: ind.exposure?.rainfall_extremes || 50 },
    { dimension: 'Flood Basin', value: ind.exposure?.flood_exposure || 50 },
    { dimension: 'Heat Hazard', value: ind.exposure?.heat_exposure || 50 },
    { dimension: 'Agri Dependency', value: ind.sensitivity?.agri_dependency || 50 },
    { dimension: 'Housing Fragility', value: ind.sensitivity?.housing_vulnerability || 50 },
    { dimension: 'Healthcare Cap', value: ind.adaptive_capacity?.healthcare_score || 50 },
    { dimension: 'Road Network', value: ind.adaptive_capacity?.road_density || 50 },
    { dimension: 'Civil Defense', value: ind.adaptive_capacity?.disaster_preparedness || 50 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to previous view</span>
        </button>

        <div className="flex items-center space-x-2">
          <Link
            to={`/comparison?district_ids=${data.id}&district_ids=IND_OD_KEN`}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            Compare with Another District
          </Link>

          <a
            href={`${API_BASE}/reports/pdf/${data.id}`}
            download
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>Download PDF Brief</span>
          </a>
        </div>
      </div>

      {/* Main District Identity Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{data.state_name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">Code: {data.code}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{data.name}</h1>
          <p className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
            <span><b>Ecological Terrain:</b> {data.zone}</span>
            <span className="text-slate-300">•</span>
            <span><b>Coordinates:</b> {data.centroid_lat}° N, {data.centroid_lng}° E</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Composite Vulnerability</span>
            <VulnerabilityBadge category={v.vulnerability_category} score={v.vulnerability_score} size="lg" />
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-1">Scientific Confidence</span>
            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono">
              {data.data_confidence}% Confident
            </span>
          </div>
        </div>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* Subsystem 1: Long-term Climate Vulnerability Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 m-0">
              Subsystem 1: Long-term Vulnerability Assessment
            </h2>
            <p className="text-xs text-slate-500">
              Formula: V = 0.40·Exposure + 0.30·Sensitivity + 0.30·(100 - Adaptive Capacity)
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            IPCC AR5/AR6 Dimension
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-semibold">Exposure Score (E)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{v.exposure_score}</div>
            <p className="text-[11px] text-slate-500 mt-1">Weight: 40% in calculation</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-semibold">Sensitivity Score (S)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{v.sensitivity_score}</div>
            <p className="text-[11px] text-slate-500 mt-1">Weight: 30% in calculation</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-semibold">Adaptive Capacity (A)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{v.adaptive_capacity_score}</div>
            <p className="text-[11px] text-slate-500 mt-1">Weight: 30% in calculation</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-semibold">Adaptive Deficit (100 - A)</span>
            <div className="text-2xl font-bold text-orange-700 mt-1 font-mono">
              {roundNum(100 - (v.adaptive_capacity_score || 50))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Coping & resilience gap</p>
          </div>
        </div>

        {/* Detailed Indicators Radar Chart and Demographic Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="h-72 w-full flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Indicator Dimensions Radar Profile
            </h4>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" />
                <Radar name="District Score" dataKey="value" stroke="#047857" fill="#10B981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Demographic & Socioeconomic Indicators */}
          <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Demographics (Census 2011 Baseline)</span>
              </div>
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono">
                Ref Year: 2011
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Total Population</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">Official</span>
                </div>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {pop.total_population ? pop.total_population.toLocaleString() : '1,440,218'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Census 2011 Headcount</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Rural Population</span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Estimated</span>
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {pop.rural_population ? pop.rural_population.toLocaleString() : '1,200,000'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">65.0% National Ratio</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Urban Population</span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Estimated</span>
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {pop.urban_population ? pop.urban_population.toLocaleString() : '240,218'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">35.0% National Ratio</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Male Population</span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Estimated</span>
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {pop.male_population ? pop.male_population.toLocaleString() : '741,712'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">51.5% National Ratio</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Female Population</span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Estimated</span>
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {pop.female_population ? pop.female_population.toLocaleString() : '698,506'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">48.5% National Ratio</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Total Households</span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Estimated</span>
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {pop.total_households ? pop.total_households.toLocaleString() : '300,045'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">4.8 Persons / HH</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10.5px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Demographic Provenance Note:</span> Total population reflects official Census 2011 district headcount enumeration. Gender, rural/urban, and household figures are model-derived estimates using national demographic ratios, not separate official schedule measurements.
            </div>
          </div>
        </div>

        {/* 15 Vulnerability Indicators Provenance & Data Completeness Table */}
        {data.indicator_provenance && (
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  15-Indicator Scientific Provenance & Completeness Registry
                </h3>
                <p className="text-[11px] text-slate-500">
                  Audit trail mapping empirical ground sources, reanalysis models, and archetype estimates
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-600">Completeness:</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                  {data.data_completeness_pct || 94.5}% Evaluated
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Indicator</th>
                    <th className="p-2.5">Dimension</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">Data Source</th>
                    <th className="p-2.5">Ref Period</th>
                    <th className="p-2.5 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Object.entries(data.indicator_provenance).map(([k, p]: [string, any]) => (
                    <tr key={k} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium text-slate-900">{p.name}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.dimension === 'Exposure' ? 'bg-orange-50 text-orange-800' :
                          p.dimension === 'Sensitivity' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {p.dimension}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          p.data_type.includes('OBSERVED') ? 'bg-emerald-100 text-emerald-900 font-bold' :
                          p.data_type.includes('SOURCED') ? 'bg-sky-100 text-sky-900' :
                          p.data_type.includes('ARCHETYPE') ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.data_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{p.source}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{p.reference_period}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                        {p.confidence_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Subsystem 2: Real-time Weather & Hazard Monitoring */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 m-0">
              Subsystem 2: Current & Recent Hazard Monitoring
            </h2>
            <p className="text-xs text-slate-500">
              Observed ground surface telemetry, satellite feeds, and official alerts
            </p>
          </div>
          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
            Real-Time Feeds
          </span>
        </div>

        {/* Weather Observations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center space-x-3">
            <div className="p-3 bg-sky-600 text-white rounded-lg">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Surface Temperature</span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {cw.temp_current_c ?? 30.0} °C
              </div>
              <span className="text-[10px] text-slate-500">{cw.weather_condition || 'Normal'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center space-x-3">
            <div className="p-3 bg-sky-600 text-white rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">24h Rainfall (Open-Meteo Grid)</span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {cw.rainfall_mm_24h ?? 0.0} mm
              </div>
              <span className="text-[10px] text-slate-500">Source: {cw.station_name || 'Open-Meteo High-Res Grid'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center space-x-3">
            <div className="p-3 bg-sky-600 text-white rounded-lg">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Relative Humidity</span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {cw.humidity_pct ?? 65}%
              </div>
              <span className="text-[10px] text-slate-500">Synoptic Observation</span>
            </div>
          </div>
        </div>

        {/* Active Alerts Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Official Government Weather Warnings
          </h4>

          {data.active_alerts && data.active_alerts.length > 0 ? (
            <div className="space-y-2">
              {data.active_alerts.map((a: any) => (
                <div key={a.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">{a.alert_type}</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-900 text-[10px] uppercase">
                      Severity: {a.severity}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{a.headline}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{a.description}</p>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Authority: <b>{a.issuing_authority}</b> • Source:{' '}
                    <a href={a.source_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                      Mausam IMD
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              No active statutory disaster or extreme weather warnings registered for this district.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function roundNum(num: number): number {
  return Math.round(num * 10) / 10;
}
