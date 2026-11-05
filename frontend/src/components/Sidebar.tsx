import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  ShieldAlert,
  GitCompare,
  AlertTriangle,
  FileText,
  BookOpen,
  Sliders,
  HelpCircle,
  Globe2,
  Activity,
  Layers,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [selectedTerritory, setSelectedTerritory] = useState('All India (National)');

  const publicNavItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/map', label: 'India GIS Map', icon: Map },
    { to: '/analytics', label: 'Climate Monitoring', icon: BarChart3 },
    { to: '/vulnerability', label: 'Vulnerability Assessment', icon: ShieldAlert },
    { to: '/district/IND_MH_NAG', label: 'District Profiles', icon: Layers },
    { to: '/comparison', label: 'District Comparison', icon: GitCompare },
    { to: '/alerts', label: 'Alerts & Hazards', icon: AlertTriangle, badge: '3 Alerts' },
    { to: '/reports', label: 'Reports & Downloads', icon: FileText },
    { to: '/methodology', label: 'Data & Methodology', icon: BookOpen },
    { to: '/about', label: 'About & Contact', icon: HelpCircle },
  ];

  const adminNavItem = { to: '/admin', label: 'Protected Admin Panel', icon: Sliders };

  return (
    <aside className="w-64 bg-gradient-to-b from-white via-[#F7FAF7] to-[#EBF3EC] text-[#243326] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30 border-r border-[#D8E7DA] shadow-xs">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header with Glowing Sage-Green Gradient Ribbon Logo */}
        <div className="p-5 border-b border-[#D8E7DA] bg-white/80 backdrop-blur-xs flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3E5643] via-[#4D6D53] to-[#7DA683] p-0.5 shadow-md shadow-[#4D6D53]/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="text-xl font-black bg-gradient-to-r from-[#3E5643] via-[#4D6D53] to-[#7DA683] bg-clip-text text-transparent">
                V
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-[#243326] m-0">VITA</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3EC] text-[#3E5643] border border-[#BCD5BF]">
                GEOINT
              </span>
            </div>
            <p className="text-[10px] text-[#628B68] font-medium tracking-wide uppercase mt-0.5">
              Territorial Climate Intelligence
            </p>
          </div>
        </div>

        {/* Dual-System Operational Tag with Sage Gradient Tint */}
        <div className="mx-3 mt-3 px-3 py-2 bg-gradient-to-r from-white via-[#F6FAF6] to-[#EBF3EC] border border-[#D8E7DA] rounded-xl flex items-center justify-between text-[11px] shadow-2xs shrink-0">
          <span className="text-[#243326] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4D6D53] animate-pulse"></span>
            <span className="font-bold text-[#243326]">Dual-Engine</span>
          </span>
          <span className="text-[10px] font-mono text-[#3E5643] font-bold bg-white px-2 py-0.5 rounded-md border border-[#BCD5BF] shadow-2xs">
            IPCC + Open-Meteo
          </span>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#628B68] px-3.5 mb-1.5 pt-1">
            Navigation
          </div>

          {publicNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D8E7DA] via-[#EBF3EC] to-white text-[#263328] font-bold border-l-4 border-[#4D6D53] shadow-2xs'
                      : 'text-[#4D6D53] hover:bg-[#EBF3EC]/70 hover:text-[#243326] font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#3E5643]'
                            : 'text-[#7DA683] group-hover:text-[#3E5643]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin Management Navigation */}
          <div className="pt-2.5 mt-2.5 border-t border-[#D8E7DA]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#628B68] px-3.5 block mb-1">
              Platform Governance
            </span>
            <NavLink
              to={adminNavItem.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D8E7DA] via-[#EBF3EC] to-white text-[#263328] font-bold border-l-4 border-[#7DA683] shadow-2xs'
                    : 'text-[#4D6D53] hover:bg-[#EBF3EC]/70 hover:text-[#243326] font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <adminNavItem.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#3E5643]'
                          : 'text-[#7DA683] group-hover:text-[#3E5643]'
                      }`}
                    />
                    <span className="truncate">{adminNavItem.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EBF3EC] text-[#3E5643] border border-[#BCD5BF]">
                    RBAC
                  </span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom Territory Selector & System Status */}
      <div className="p-4 border-t border-[#D8E7DA] bg-gradient-to-b from-[#F7FAF7] to-[#EBF3EC] space-y-3 text-xs shrink-0">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#4D6D53] font-bold block mb-1.5">
            Selected Territory Scope
          </span>
          <div className="relative">
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full bg-white border border-[#D8E7DA] rounded-lg px-2.5 py-1.5 text-[#243326] text-xs font-semibold appearance-none focus:outline-none focus:border-[#4D6D53] focus:ring-1 focus:ring-[#4D6D53]/20 shadow-2xs cursor-pointer"
            >
              <option value="All India (National)">National Scope (594 Districts)</option>
              <option value="Eastern Coastal Zone">Eastern Coastal Zone (Odisha/WB)</option>
              <option value="Western Ghats">Western Ghats (Kerala/MH)</option>
              <option value="Arid Rain-Shadow">Arid Zone (Rajasthan/Marathwada)</option>
              <option value="Gangetic Basin">Gangetic Flood Plain (Bihar/UP)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7DA683] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#D8E7DA] flex items-center justify-between text-[11px] text-[#4D6D53]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4D6D53] shadow-xs shadow-[#4D6D53]/50"></span>
            <span className="font-semibold text-[#243326]">System Operational</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#3E5643] bg-white border border-[#BCD5BF] px-1.5 py-0.5 rounded shadow-2xs">
            v1.0-Academic
          </span>
        </div>
      </div>
    </aside>
  );
};
