import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Droplets,
  ShieldAlert,
  Filter,
  ExternalLink,
  Clock,
  MapPin,
  CheckCircle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAlerts({ severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined }),
      api.getHazards()
    ])
      .then(([alertRes, hazardRes]) => {
        setAlerts(alertRes);
        setHazards(hazardRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load alerts:', err);
        setLoading(false);
      });
  }, [selectedSeverity]);

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'red':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'orange':
        return 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Active Environmental Hazards & Weather Warnings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official statutory government alerts (IMD / NDMA) and near-real-time satellite thermal detections (NASA FIRMS)
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Filter Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Warning Tiers</option>
            <option value="Red">Red (Take Action / Immediate Warning)</option>
            <option value="Orange">Orange (Be Prepared)</option>
            <option value="Yellow">Yellow (Be Updated)</option>
          </select>
        </div>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-start space-x-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wide text-[11px] text-amber-900">
            Statutory Transparency & Academic Demonstration Notice
          </span>
          <p className="mt-0.5 leading-relaxed text-[11px] text-amber-900/90">
            Internal computational risk scores or model forecasts are <b>never</b> presented as official government alerts. Official IMD REST API credentials are unconfigured; the records displayed below are <b>benchmark reference disaster scenarios</b> (OSDMA, KSDMA, RSDMA) seeded for academic testing and platform verification.
          </p>
        </div>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* Official Weather Warnings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900 m-0">Official District Meteorological Warnings</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {alerts.length} Warnings Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${getSeverityBadge(a.severity)}`}>
                      {a.severity} Warning
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      Benchmark Scenario
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Valid: {new Date(a.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{a.headline}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{a.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Location:</span>
                  <span className="font-bold text-slate-800">{a.district_name}, {a.state_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authority:</span>
                  <span className="font-semibold text-emerald-800">{a.issuing_authority}</span>
                </div>
                <div className="pt-1 flex justify-end">
                  <a
                    href={a.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observed Environmental Hazard Events (Floods & NASA FIRMS Fires) */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900 m-0">
              Observed Environmental Hazards (Satellite Hotspots & River Inundations)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {hazards.length} Events Logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hazards.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start space-x-4"
            >
              <div className={`p-3 rounded-xl shrink-0 ${h.hazard_type === 'Forest Fire' ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                {h.hazard_type === 'Forest Fire' ? <Flame className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{h.hazard_type}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    Status: {h.status}
                  </span>
                </div>

                <div className="mt-1 text-slate-600 font-medium">{h.location_detail}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <b>District:</b> {h.district_name} ({h.state_name}) • <b>Coordinates:</b> {h.latitude}° N, {h.longitude}° E
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Source: {h.source_name}</span>
                  <a href={h.source_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">
                    Telemetry Source
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
