import React from 'react';
import { Info, ShieldAlert, Layers } from 'lucide-react';

interface Props {
  collapsed?: boolean;
}

export const SystemDistinctionBanner: React.FC<Props> = ({ collapsed = false }) => {
  if (collapsed) {
    return (
      <div className="bg-emerald-900/5 border border-emerald-800/15 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <b>Independent Intelligence Engines:</b> Long-term Vulnerability (IPCC AR5/AR6) vs Real-time Weather & Hazard Monitoring (Open-Meteo / NASA FIRMS / SDMA).
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded">
          Dual System
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-sky-50 border border-emerald-200/80 rounded-xl p-4 shadow-xs">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-emerald-700 text-white shrink-0 mt-0.5">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Core Architectural Separation
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
              Strictly Disjoint
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            This platform combines two independent scientific systems that operate on distinct temporal and analytical baselines. They must never be confused:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5">
            <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Subsystem 1: Long-term Climate Vulnerability</span>
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Multi-decadal baseline evaluating Exposure (0.40), Sensitivity (0.30), and Adaptive Deficit (0.30). Reflects structural and geographical susceptibility.
              </p>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-sky-200 text-xs">
              <span className="font-bold text-sky-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>Subsystem 2: Current & Recent Hazard Monitoring</span>
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Near-real-time telemetry: Open-Meteo weather models, NASA FIRMS thermal hotspots, and SDMA/NDMA statutory official alerts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
