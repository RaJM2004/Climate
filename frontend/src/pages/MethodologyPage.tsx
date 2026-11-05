import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calculator,
  Database,
  Layers,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const MethodologyPage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    api.getDataSources().then((res) => setSources(res));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Scientific Methodology & Data Integration Architecture
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete mathematical formulations, normalization criteria, indicator weights, and source metadata
        </p>
      </div>

      <SystemDistinctionBanner />

      {/* 1. Mathematical Formulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 m-0">1. IPCC AR5/AR6 Climate Vulnerability Formulation</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Climate vulnerability ($V$) is evaluated across three primary dimensions: <b>Exposure ($E$)</b>, <b>Sensitivity ($S$)</b>, and <b>Adaptive Capacity ($A$)</b>. To reflect the vulnerability deficit, lack of adaptive capacity is formalized as $(100 - A)$:
        </p>

        {/* Formula Box */}
        <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-center text-sm shadow-inner tracking-wide">
          <span className="text-emerald-400 font-bold">V</span> = <span className="text-amber-300">0.40 · E</span> + <span className="text-sky-300">0.30 · S</span> + <span className="text-teal-300">0.30 · (100 - A)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block text-sm">Exposure Dimension (E)</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded inline-block mt-1">
              Weight: 40% (0.40)
            </span>
            <p className="text-slate-600 mt-2 text-[11px] leading-relaxed">
              Reflects the magnitude and frequency of physical climate hazards: 95th percentile rainfall extremes, flood basin area percentage, annual heat days &gt;40°C, and drought SPI indices.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block text-sm">Sensitivity Dimension (S)</span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded inline-block mt-1">
              Weight: 30% (0.30)
            </span>
            <p className="text-slate-600 mt-2 text-[11px] leading-relaxed">
              Reflects inherent socio-economic fragility: population density, agricultural workforce dependency percentage, housing structural fragility (kutcha houses), and critical infrastructure proximity.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block text-sm">Adaptive Capacity (A)</span>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded inline-block mt-1">
              Weight: 30% (0.30)
            </span>
            <p className="text-slate-600 mt-2 text-[11px] leading-relaxed">
              Reflects coping and resilience resources: healthcare infrastructure density (PHCs/beds), surfaced road density, treated drinking water access, literacy rate, and civil defense shelters.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Normalization & Classification */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 m-0">2. Normalization & Missing-Data Governance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 mb-1.5 text-xs">Min-Max Indicator Normalization (0 to 100)</h3>
            <p>
              Every raw indicator $X_i$ is mapped onto a standardized continuous scale between 0 and 100:
            </p>
            <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-800 my-2 border border-slate-200 text-center">
              X_norm = ((X - X_min) / (X_max - X_min)) * 100
            </div>
            <p>
              National benchmark bounds derived from decadal climatological surveys define X_min and X_max across all Indian districts.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1.5 text-xs">Missing-Data & Uncertainty Policy</h3>
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-red-950 mb-2">
              <b>Strict Rule:</b> Missing indicator values are <b>never treated as zero</b>. Setting missing observations to zero would artificially deflate vulnerability and produce misleading low-risk results.
            </div>
            <p>
              Each district computes a <b>Confidence Score (%)</b> based on observed data completeness. Districts with completeness &lt; 60% are flagged as provisional.
            </p>
          </div>
        </div>

        {/* 5-Tier Classification Table */}
        <div className="pt-2">
          <h3 className="font-bold text-slate-900 mb-2 text-xs">Standardized Vulnerability Tiers</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-800 block">Very Low</span>
              <span className="text-[11px] text-emerald-700 font-mono">0 – 20</span>
            </div>
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
              <span className="font-bold text-teal-800 block">Low</span>
              <span className="text-[11px] text-teal-700 font-mono">21 – 40</span>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="font-bold text-amber-800 block">Moderate</span>
              <span className="text-[11px] text-amber-700 font-mono">41 – 60</span>
            </div>
            <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="font-bold text-orange-800 block">High</span>
              <span className="text-[11px] text-orange-700 font-mono">61 – 80</span>
            </div>
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <span className="font-bold text-red-800 block">Very High</span>
              <span className="text-[11px] text-red-700 font-mono">81 – 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Providers Registry Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 m-0">3. Connected Climate & Environmental Data Sources</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Data Provider</th>
                <th className="py-2.5 px-3 font-semibold">Governing Organization</th>
                <th className="py-2.5 px-3 font-semibold">Update Frequency</th>
                <th className="py-2.5 px-3 font-semibold">Geographic Coverage</th>
                <th className="py-2.5 px-3 font-semibold">Measurement Units</th>
                <th className="py-2.5 px-3 font-semibold text-right">Portal Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-800">{s.name}</td>
                  <td className="py-3 px-3 text-slate-600">{s.organization}</td>
                  <td className="py-3 px-3 text-emerald-800 font-medium">{s.update_frequency}</td>
                  <td className="py-3 px-3 text-slate-500">{s.coverage}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{s.measurement_units || 'Normalized'}</td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                    >
                      <span>Access</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
