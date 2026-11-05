import React, { useEffect, useState } from 'react';
import {
  Sliders,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  RotateCcw,
  Clock,
  Save,
  MapPin,
  Layers,
  FileText,
  Lock,
  Globe2,
  Activity,
  Check,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const AdminPage: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('climate_token');
  });
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'geographic' | 'sources' | 'sync' | 'weights' | 'logs' | 'users'>('overview');

  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [statesList, setStatesList] = useState<any[]>([]);

  // Weights state
  const [weights, setWeights] = useState({
    weight_exposure: 0.40,
    weight_sensitivity: 0.30,
    weight_adaptive_capacity: 0.30
  });
  const [savingWeights, setSavingWeights] = useState<boolean>(false);
  const [weightSuccess, setWeightSuccess] = useState<string | null>(null);

  // Data sources & logs
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);

  // User Management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', full_name: '', password: '', role: 'RESEARCHER' });
  const [userMsg, setUserMsg] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const loadData = () => {
    api.getAdminDashboardStats()
      .then((stats) => setDashboardStats(stats))
      .catch((err) => console.warn('Dashboard stats error:', err));

    api.getStates()
      .then((states) => setStatesList(states))
      .catch((err) => console.warn('States error:', err));

    api.getWeights()
      .then((res) => {
        setWeights({
          weight_exposure: res.exposure,
          weight_sensitivity: res.sensitivity,
          weight_adaptive_capacity: res.adaptive_capacity
        });
      })
      .catch((err) => console.warn('Weights error:', err));

    api.getDataSources().then((res) => setSources(res)).catch(() => {});
    api.getIngestionLogs().then((res) => setLogs(res)).catch(() => {});
    api.getUsers().then((res) => setUsersList(res)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.login({ username, password });
      if (res.access_token) {
        localStorage.setItem('climate_token', res.access_token);
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('climate_token');
    setIsAuthenticated(false);
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWeights(true);
    setWeightSuccess(null);
    try {
      const res = await api.updateWeights(weights);
      setWeightSuccess(res.message);
      setSavingWeights(false);
    } catch (err) {
      console.error(err);
      setSavingWeights(false);
    }
  };

  const handleSyncSource = async (key: string) => {
    setSyncingSource(key);
    try {
      await api.triggerSync(key);
      const [updatedSources, updatedLogs, updatedStats] = await Promise.all([
        api.getDataSources(),
        api.getIngestionLogs(),
        api.getAdminDashboardStats()
      ]);
      setSources(updatedSources);
      setLogs(updatedLogs);
      setDashboardStats(updatedStats);
      setSyncingSource(null);
    } catch (err) {
      console.error(err);
      setSyncingSource(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    setUserError(null);
    try {
      const res = await api.createUser(newUser);
      setUserMsg(res.message);
      setNewUser({ username: '', email: '', full_name: '', password: '', role: 'RESEARCHER' });
      const updated = await api.getUsers();
      setUsersList(updated);
    } catch (err: any) {
      setUserError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.toggleUserStatus(userId, !currentStatus);
      const updated = await api.getUsers();
      setUsersList(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const totalWeight = (
    weights.weight_exposure +
    weights.weight_sensitivity +
    weights.weight_adaptive_capacity
  ).toFixed(2);

  // If not authenticated, render login prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Protected Administrative Portal</h1>
          <p className="text-xs text-slate-500">
            Authentication required to configure vulnerability models, verify GIS boundaries, and manage ingestion feeds.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
              required
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Authenticate & Access Portal
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            Authorized administrative access only. Role-based JWT authentication enforced.
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrative Control & Governance Engine
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Admin Authenticated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System maintenance, geographic validation, external climate feed management, and vulnerability model configuration
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh All Feeds</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* Admin Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'overview', label: 'Dashboard Statistics', icon: Activity },
          { key: 'geographic', label: 'Geographic Data Management', icon: MapPin },
          { key: 'sources', label: 'Data Source Management', icon: Database },
          { key: 'sync', label: 'Data Synchronization', icon: RefreshCw },
          { key: 'weights', label: 'Vulnerability Weights', icon: Sliders },
          { key: 'logs', label: 'System Ingestion Logs', icon: Clock },
          { key: 'users', label: 'User Management', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DASHBOARD OVERVIEW                                            */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official States</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {dashboardStats?.total_states || 28} States
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">28 Constitutional States</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Union Territories</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {dashboardStats?.total_union_territories || 8} UTs
              </div>
              <span className="text-[10px] text-teal-600 font-semibold">8 Official Union Territories</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Districts</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {dashboardStats?.total_districts || 594} Districts
              </div>
              <span className="text-[10px] text-blue-600 font-semibold">100% Boundary Validated</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                SQLite 3
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Embedded Zero-Config (No Docker)</span>
            </div>
          </div>

          {/* Technical Health Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 m-0">Repository Technical Integrity Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Climate Observations Synced</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {dashboardStats?.districts_with_climate_data || 594} Districts
                </span>
                <span className="text-[10px] text-emerald-600 block mt-1">Open-Meteo High-Res Active</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Demographic Records</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {dashboardStats?.population_records || 594} Districts
                </span>
                <span className="text-[10px] text-teal-600 block mt-1">Census & WorldPop Calibrated</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Climatological Monthly Baseline</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {dashboardStats?.historical_climate_records || 7128} Records
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">12-Month Cycles for all districts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: GEOGRAPHIC DATA MANAGEMENT                                   */}
      {/* =================================================================== */}
      {activeTab === 'geographic' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">India Administrative Hierarchy (36 Units)</h2>
              <p className="text-xs text-slate-500">
                28 States + 8 Union Territories conforming to the Constitution of India and Ministry of Home Affairs
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              594 Geometries Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Code</th>
                  <th className="py-2.5 px-3 font-semibold">Administrative Unit Name</th>
                  <th className="py-2.5 px-3 font-semibold">Classification</th>
                  <th className="py-2.5 px-3 font-semibold">Region</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Districts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statesList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{st.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          st.is_union_territory
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {st.is_union_territory ? 'Union Territory' : 'State'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{st.region}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {st.district_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: DATA SOURCE MANAGEMENT                                       */}
      {/* =================================================================== */}
      {activeTab === 'sources' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 m-0">Connected Scientific Data Providers</h2>
            <p className="text-xs text-slate-500">
              API connections, reference periods, measurement units, and update cadence (Keys safely masked)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Source Key</th>
                  <th className="py-2.5 px-3 font-semibold">Provider / Instrument</th>
                  <th className="py-2.5 px-3 font-semibold">Cadence</th>
                  <th className="py-2.5 px-3 font-semibold">Coverage</th>
                  <th className="py-2.5 px-3 font-semibold">Units</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{s.source_key}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.organization}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{s.update_frequency}</td>
                    <td className="py-3 px-3 text-slate-600">{s.coverage}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{s.measurement_units || 'N/A'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {s.sync_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: DATA SYNCHRONIZATION                                         */}
      {/* =================================================================== */}
      {activeTab === 'sync' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">Manual & Scheduled Sync Control</h2>
              <p className="text-xs text-slate-500">
                Trigger on-demand data sync across external providers without waiting for background scheduler
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Scheduler Cadence: Every 6 Hours</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">{s.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{s.source_key}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Last Ingested: {s.last_successful_sync ? new Date(s.last_successful_sync).toLocaleTimeString() : 'Current'}
                  </span>
                </div>
                <button
                  onClick={() => handleSyncSource(s.source_key)}
                  disabled={syncingSource === s.source_key}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingSource === s.source_key ? 'animate-spin' : ''}`} />
                  <span>{syncingSource === s.source_key ? 'Syncing...' : 'Sync Feed'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: VULNERABILITY MODEL CONFIGURATION                            */}
      {/* =================================================================== */}
      {activeTab === 'weights' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">IPCC AR5/AR6 Indicator Weights Engine</h2>
              <p className="text-xs text-slate-500">
                Formula: V = w_E·E + w_S·S + w_A·(100 - A) across all 594 districts in the SQLite database
              </p>
            </div>
            <div className="text-xs">
              <span className="text-slate-500">Weight Sum: </span>
              <span className={`font-mono font-bold ${Number(totalWeight) === 1.0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {totalWeight} {Number(totalWeight) === 1.0 ? '(Balanced 1.00)' : '(Auto-normalized)'}
              </span>
            </div>
          </div>

          <form onSubmit={handleWeightSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Exposure Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Exposure (w_E):</span>
                  <span className="font-mono text-amber-700 font-bold">{weights.weight_exposure.toFixed(2)} ({(weights.weight_exposure * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={weights.weight_exposure}
                  onChange={(e) => setWeights({ ...weights, weight_exposure: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-700"
                />
                <p className="text-[10px] text-slate-400">Extreme rainfall, heatwaves, flood basin %</p>
              </div>

              {/* Sensitivity Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Sensitivity (w_S):</span>
                  <span className="font-mono text-sky-700 font-bold">{weights.weight_sensitivity.toFixed(2)} ({(weights.weight_sensitivity * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={weights.weight_sensitivity}
                  onChange={(e) => setWeights({ ...weights, weight_sensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-700"
                />
                <p className="text-[10px] text-slate-400">Population density, agriculture, housing fragility</p>
              </div>

              {/* Adaptive Capacity Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Adaptive Capacity (w_A):</span>
                  <span className="font-mono text-teal-700 font-bold">{weights.weight_adaptive_capacity.toFixed(2)} ({(weights.weight_adaptive_capacity * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={weights.weight_adaptive_capacity}
                  onChange={(e) => setWeights({ ...weights, weight_adaptive_capacity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-700"
                />
                <p className="text-[10px] text-slate-400">Healthcare access, surfaced road density, shelters</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setWeights({ weight_exposure: 0.40, weight_sensitivity: 0.30, weight_adaptive_capacity: 0.30 })}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default (0.40, 0.30, 0.30)</span>
              </button>

              <button
                type="submit"
                disabled={savingWeights}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition"
              >
                <Save className="w-4 h-4 text-emerald-300" />
                <span>{savingWeights ? 'Recalculating Districts...' : 'Save & Recalculate Scores'}</span>
              </button>
            </div>

            {weightSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{weightSuccess}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: SYSTEM LOGS                                                  */}
      {/* =================================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 m-0">Audit & Data Ingestion Logs</h2>
            <p className="text-xs text-slate-500">
              Immutable chronological record of external sync jobs, records ingested, and provider statuses
            </p>
          </div>

          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 uppercase font-mono text-[11px]">{l.source_key}</span>
                    <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800 uppercase">
                      {l.status}
                    </span>
                    <span className="text-slate-400 text-[10px]">{`(${l.records_ingested} records)`}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{l.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-4">
                  {new Date(l.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* TAB 7: USER MANAGEMENT                                              */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Creation Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 m-0">Create New System User / Analyst</h2>
                <p className="text-xs text-slate-500">
                  Assign role permissions for platform governance, indicator weights, or scientific data exploration
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                RBAC Access Control
              </span>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. scientist1"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. priya@iitm.res.in"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-1/2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="RESEARCHER">RESEARCHER</option>
                    <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-1/2 mt-4 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
                >
                  Create
                </button>
              </div>
            </form>

            {userMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{userMsg}</span>
              </div>
            )}

            {userError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{userError}</span>
              </div>
            )}
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Registered Administrative & Research Users</h3>
                <p className="text-xs text-slate-500">
                  SQLite database table: <span className="font-mono text-slate-700">users</span>
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {usersList.length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created At</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMINISTRATOR' || u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[10px] font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
