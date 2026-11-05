import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Calendar,
  MapPin,
  User,
  ShieldAlert,
  X,
  ExternalLink,
  Compass
} from 'lucide-react';
import { api, DistrictSummary } from '../services/api';
import { VulnerabilityBadge } from './VulnerabilityBadge';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allDistricts, setAllDistricts] = useState<DistrictSummary[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('National Overview');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('Current Observations 2024-2026');
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load district dataset for autocomplete indexing
  useEffect(() => {
    api.getDistricts()
      .then((data) => {
        setAllDistricts(data);
      })
      .catch((err) => {
        console.warn('Header: Failed to prefetch districts for search:', err);
      });
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered district matches
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return allDistricts
      .filter((d) =>
        d.name?.toLowerCase().includes(q) ||
        d.state_name?.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q))
      )
      .slice(0, 7);
  }, [allDistricts, searchTerm]);

  // Handle explicit form submit (Enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    if (searchResults.length > 0) {
      // Navigate to top match
      const topMatch = searchResults[0];
      setIsOpen(false);
      navigate(`/district/${topMatch.id}`);
    } else {
      setIsOpen(false);
      navigate(`/map?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSelectDistrict = (districtId: string, target: 'profile' | 'map') => {
    setIsOpen(false);
    if (target === 'profile') {
      navigate(`/district/${districtId}`);
    } else {
      navigate(`/map?district_id=${encodeURIComponent(districtId)}`);
    }
  };

  return (
    <header className="h-16 bg-gradient-to-r from-white via-[#F8FAF8] to-[#EBF3EC] border-b border-[#D8E7DA] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs max-w-full">
      {/* Left: Search Bar with Autocomplete Dropdown & ⌘K badge */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-3">
        <div ref={searchContainerRef} className="relative w-full max-w-xs sm:max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#7DA683] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search district, state, or climate zone..."
              className="w-full pl-9 pr-14 py-2 bg-white/90 border border-[#D8E7DA] rounded-xl text-xs text-[#243326] placeholder-[#7DA683]/70 focus:outline-none focus:ring-2 focus:ring-[#7DA683]/30 focus:border-[#4D6D53] transition shadow-2xs"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-[#7DA683] hover:text-[#4D6D53] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-[#F6FAF6] border border-[#D8E7DA] px-1.5 py-0.5 rounded text-[#4D6D53] shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          </form>

          {/* Autocomplete Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-12 bg-white/98 backdrop-blur-md rounded-xl border border-[#D8E7DA] shadow-xl overflow-hidden z-50 divide-y divide-[#EBF3EC] max-h-96 overflow-y-auto">
              {searchTerm.trim() ? (
                searchResults.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#4D6D53] bg-gradient-to-r from-[#F6FAF6] to-[#EBF3EC] flex items-center justify-between border-b border-[#D8E7DA]">
                      <span>Matching Indian Districts ({searchResults.length})</span>
                      <span>Press ↵ to open</span>
                    </div>
                    {searchResults.map((d) => (
                      <div
                        key={d.id}
                        className="px-3 py-2.5 hover:bg-[#F6FAF6] flex items-center justify-between transition group"
                      >
                        <div
                          className="flex-1 cursor-pointer pr-2"
                          onClick={() => handleSelectDistrict(d.id, 'profile')}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#243326] text-xs group-hover:text-[#4D6D53] transition">
                              {d.name}
                            </span>
                            <span className="text-[11px] text-[#628B68]">
                              ({d.state_name})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {d.zone && (
                              <span className="text-[10px] text-[#4D6D53] font-mono">
                                {d.zone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {d.vulnerability_category && (
                            <VulnerabilityBadge
                              category={d.vulnerability_category}
                              score={d.vulnerability_score}
                              size="sm"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectDistrict(d.id, 'map')}
                            className="p-1 hover:bg-[#EBF3EC] text-[#4D6D53] hover:text-[#243326] rounded transition"
                            title="Locate on GIS Map"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectDistrict(d.id, 'profile')}
                            className="p-1 hover:bg-[#EBF3EC] text-[#4D6D53] hover:text-[#243326] rounded transition"
                            title="View District Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#4D6D53] space-y-1">
                    <p className="font-semibold text-[#243326]">No districts found matching "{searchTerm}"</p>
                    <p className="text-[11px] text-[#628B68]">
                      Try searching by district name (e.g., Pune, Kendrapara, Churu, Nagpur) or state.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-3 text-xs space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#4D6D53]">
                    Quick Geographic Shortcuts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pune', 'Kendrapara', 'Churu', 'Nagpur', 'Wayanad', 'Thane', 'Cuttack'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSearchTerm(name);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-1 rounded-md bg-[#EBF3EC] hover:bg-[#D8E7DA] text-[#3E5643] text-xs font-semibold transition border border-[#BCD5BF]"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Territory Selector Pill */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-gradient-to-r from-white to-[#F6FAF6] border border-[#D8E7DA] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#243326] shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-[#4D6D53]" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-transparent border-0 text-xs font-semibold text-[#243326] focus:outline-none cursor-pointer pr-1"
          >
            <option value="National Overview">Region: All India (594 Districts)</option>
            <option value="Eastern Coast">Region: Eastern Coastal Belt</option>
            <option value="Western Ghats">Region: Western Ghats Highland</option>
            <option value="North Arid">Region: Thar Arid Margin</option>
          </select>
        </div>

        {/* Date / Baseline Selector Pill */}
        <div className="hidden 2xl:flex items-center space-x-1.5 bg-gradient-to-r from-white to-[#F6FAF6] border border-[#D8E7DA] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#243326] shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-[#628B68]" />
          <select
            value={selectedTimeline}
            onChange={(e) => setSelectedTimeline(e.target.value)}
            className="bg-transparent border-0 text-xs font-semibold text-[#243326] focus:outline-none cursor-pointer pr-1"
          >
            <option value="Current Observations 2024-2026">Live Feeds 2024–2026</option>
            <option value="Historical 1991-2020 Normal">Historical Baseline 1991–2020</option>
            <option value="CMIP6 Projections 2031-2050">Projected CMIP6 (2031–2050)</option>
          </select>
        </div>
      </div>

      {/* Right Controls: Filters, Export, Notifications, Avatar */}
      <div className="flex items-center space-x-3">
        {/* Filters Button */}
        <button
          onClick={() => navigate('/analytics')}
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#D8E7DA] bg-gradient-to-b from-white to-[#F6FAF6] hover:to-[#EBF3EC] text-[#3E5643] text-xs font-semibold shadow-2xs transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#628B68]" />
          <span>Filters</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#D8E7DA] bg-gradient-to-b from-white to-[#F6FAF6] hover:to-[#EBF3EC] text-[#3E5643] text-xs font-semibold shadow-2xs transition"
        >
          <Download className="w-3.5 h-3.5 text-[#628B68]" />
          <span>Export</span>
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 rounded-lg hover:bg-[#EBF3EC] text-[#4D6D53] relative transition"
            title="Active Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white/98 backdrop-blur-md rounded-xl border border-[#D8E7DA] shadow-xl p-3 z-50 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#EBF3EC]">
                <span className="font-bold text-[#243326]">Active Alerts (SDMA/NDMA)</span>
                <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  3 Official Warnings
                </span>
              </div>
              <div
                onClick={() => {
                  setShowNotificationMenu(false);
                  navigate('/alerts');
                }}
                className="p-2 bg-red-50/90 rounded-lg text-red-950 hover:bg-red-100 cursor-pointer transition space-y-0.5 border border-red-200/80"
              >
                <div className="font-bold">Red Alert: Wayanad Debris Flow</div>
                <p className="text-[11px] text-red-800">Torrential rain &gt;200mm in 24 hours.</p>
              </div>
              <div
                onClick={() => {
                  setShowNotificationMenu(false);
                  navigate('/alerts');
                }}
                className="p-2 bg-amber-50/90 rounded-lg text-amber-950 hover:bg-amber-100 cursor-pointer transition space-y-0.5 border border-amber-200/80"
              >
                <div className="font-bold">Orange Alert: Kendrapara Squally Wind</div>
                <p className="text-[11px] text-amber-800">45-55 kmph coastal wind advisory.</p>
              </div>
            </div>
          )}
        </div>

        {/* User / Administrator Profile Pill */}
        <div
          onClick={() => navigate('/admin')}
          className="flex items-center space-x-2.5 pl-3 border-l border-[#D8E7DA] cursor-pointer hover:opacity-85 transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4D6D53] to-[#7DA683] flex items-center justify-center text-white font-bold text-xs shadow-xs">
            U
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-[#243326] leading-tight">Administrator</div>
            <div className="text-[10px] text-[#628B68] font-medium leading-none">Lead Officer ∨</div>
          </div>
        </div>
      </div>
    </header>
  );
};
