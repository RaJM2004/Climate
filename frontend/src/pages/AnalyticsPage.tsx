import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Thermometer,
  Layers,
  Calendar,
  Filter,
  Info
} from 'lucide-react';
import { api, DistrictSummary, OverviewAnalytics } from '../services/api';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';
import { VulnerabilityBadge } from '../components/VulnerabilityBadge';

export const AnalyticsPage: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [trendsData, setTrendsData] = useState<any | null>(null);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);

  useEffect(() => {
    api.getDistricts().then((data) => {
      setDistricts(data);
      if (data.length > 0) {
        // Prefer Nagpur or first district
        const nagpur = data.find((d) => d.name.toLowerCase().includes('nagpur'));
        setSelectedDistrictId(nagpur ? nagpur.id : data[0].id);
      }
    });

    api.getOverviewAnalytics().then((res) => setOverview(res));
  }, []);

  useEffect(() => {
    if (selectedDistrictId) {
      setLoadingTrends(true);
      api.getClimateTrends(selectedDistrictId)
        .then((res) => {
          setTrendsData(res);
          setLoadingTrends(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingTrends(false);
        });
    }
  }, [selectedDistrictId]);

  // Distribution chart data
  const distData = [
    { name: 'Very Low (0-20)', count: overview?.vulnerability_distribution?.['Very Low'] || 2, color: '#10B981' },
    { name: 'Low (21-40)', count: overview?.vulnerability_distribution?.['Low'] || 5, color: '#34D399' },
    { name: 'Moderate (41-60)', count: overview?.vulnerability_distribution?.['Moderate'] || 10, color: '#FBBF24' },
    { name: 'High (61-80)', count: overview?.vulnerability_distribution?.['High'] || 6, color: '#F97316' },
    { name: 'Very High (81-100)', count: overview?.vulnerability_distribution?.['Very High'] || 3, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Climate Analytics & Climatological Trends
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical multi-decadal observations, vulnerability distributions, and annual cycles across India
          </p>
        </div>

        {/* District Selector for Trends */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600">Focus District:</span>
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.state_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* Top 12-Month Climatological Trend Cards (Dual Charts) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${trendsData?.data_classification === 'OBSERVED_HISTORICAL_API' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
            {trendsData?.data_classification === 'OBSERVED_HISTORICAL_API' ? 'Open-Meteo Archive (Observed API)' : 'Climatological Archetype (Estimated)'}
          </span>
          <span className="text-slate-600 font-medium">
            Period: <b>{trendsData?.observation_period || '2023 Annual Cycle'}</b>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 space-x-3">
          <span>Source: <b>{trendsData?.data_source || 'Open-Meteo Archive'}</b></span>
          {trendsData?.coordinates && (
            <span>Coords: <b>{trendsData.coordinates.latitude?.toFixed(2)}°N, {trendsData.coordinates.longitude?.toFixed(2)}°E</b></span>
          )}
          {trendsData?.is_cached && <span className="text-emerald-700 font-semibold">(Cached in SQLite)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rainfall Cycle Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Monthly Rainfall Cycle (mm)</h3>
                <p className="text-[11px] text-slate-500">
                  {trendsData ? `${trendsData.district_name} (${trendsData.zone})` : 'District Rainfall Cycle'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {trendsData?.data_classification === 'OBSERVED_HISTORICAL_API' ? 'Open-Meteo Archive' : 'Regional Baseline'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis unit=" mm" tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} mm`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="rainfall_mm" name="Observed Precipitation" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normal_rainfall_mm" name="30-Yr Climatological Normal" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Trend Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Annual Temperature Progression (°C)</h3>
                <p className="text-[11px] text-slate-500">
                  {trendsData ? `${trendsData.district_name} (${trendsData.zone})` : 'District Thermal Curve'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {trendsData?.data_classification === 'OBSERVED_HISTORICAL_API' ? 'Open-Meteo Archive (ERA5)' : 'Regional Baseline'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis unit=" °C" tick={{ fill: '#64748B', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(val: any) => [`${val} °C`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="temperature_c" name="Mean Temperature" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="normal_temp_c" name="30-Yr Baseline Normal" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vulnerability Distribution Analytics (Bar + Doughnut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">National Vulnerability Distribution</h3>
              <p className="text-xs text-slate-500">Number of assessed districts per vulnerability tier</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Total: {districts.length} Districts
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(val: any) => [`${val} Districts`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Card with Key Takeaway */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-2 py-0.5 rounded">
              Analytical Insight
            </span>
            <h3 className="text-lg font-bold text-white mt-3">High Vulnerability Concentration</h3>
            <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
              Districts situated in <b>Eastern Coastal Deltas</b> (e.g., Kendrapara, South 24 Parganas) and <b>Steep Himalayan Ghats</b> (Wayanad, Chamoli) exhibit composite vulnerability scores &gt; 75.0, driven predominantly by high extreme rainfall and infrastructure sensitivity.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 mt-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-300/80 block text-[10px]">National Average</span>
              <span className="text-base font-bold font-mono text-white">
                {overview?.average_vulnerability_score || 54.2} / 100
              </span>
            </div>
            <div className="text-right">
              <span className="text-emerald-300/80 block text-[10px]">Critical Districts</span>
              <span className="text-base font-bold font-mono text-orange-300">
                {overview?.high_vulnerability_districts || 9} Districts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
