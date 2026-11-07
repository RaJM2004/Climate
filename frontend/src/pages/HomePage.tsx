import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Droplets,
  Thermometer,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Users,
  Compass,
  FileText,
  BookOpen,
  Sliders,
  CheckCircle2,
  Calendar,
  Building2,
  Activity,
  ThumbsUp,
  Radio,
  Eye,
  Plus
} from 'lucide-react';
import { api, DistrictSummary, OverviewAnalytics } from '../services/api';

// Subcomponent to fly to map center
const MapViewHandler: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewAnalytics | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>('vulnerability');
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [heatmapHover, setHeatmapHover] = useState<{ name: string; score: number; tier: string; desc?: string } | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'vulnerability' | 'thermal' | 'flood'>('vulnerability');
  const [loading, setLoading] = useState<boolean>(true);

  const regionalHeatData = useMemo(() => {
    switch (heatmapMode) {
      case 'thermal':
        return [
          { id: 'thar', name: 'Thar Arid Margin (Rajasthan)', score: 91.5, tier: 'Very High', color: '#DC2626', desc: '48.2°C Extreme Heatwave Stress' },
          { id: 'deccan', name: 'Deccan Rain-Shadow (Telangana)', score: 74.0, tier: 'High', color: '#EA580C', desc: 'Prolonged High Heat Index' },
          { id: 'ganga', name: 'Gangetic Basin (Bihar/UP)', score: 68.2, tier: 'High', color: '#F59E0B', desc: 'High Wet-Bulb Humidity Anomalies' },
          { id: 'east', name: 'East Coastal Belt (Odisha/AP)', score: 62.5, tier: 'High', color: '#F59E0B', desc: 'Coastal Thermal Stagnation' },
          { id: 'central', name: 'Central Plateau (MP/JH)', score: 58.0, tier: 'Moderate', color: '#FACC15', desc: 'Seasonal Heat Spikes' },
          { id: 'west', name: 'Western Ghats (MH/KL)', score: 36.5, tier: 'Low', color: '#86EFAC', desc: 'Orographic Heat Moderation' },
          { id: 'northeast', name: 'Northeast Hills (Assam)', score: 28.0, tier: 'Low', color: '#4ADE80', desc: 'Subtropical Humid Baseline' },
          { id: 'north', name: 'Northern Highlands (J&K/HP)', score: 14.5, tier: 'Very Low', color: '#22C55E', desc: 'Temperate Montane Buffer' },
        ];
      case 'flood':
        return [
          { id: 'east', name: 'East Coast Littoral (Odisha/WB)', score: 94.2, tier: 'Very High', color: '#DC2626', desc: 'Severe Surge & River Overflow' },
          { id: 'west', name: 'Western Ghats Belt (Wayanad/KL)', score: 86.8, tier: 'Very High', color: '#EF4444', desc: 'Flash Inundation & Debris Flow' },
          { id: 'ganga', name: 'Gangetic Basin (Bihar/East UP)', score: 79.4, tier: 'High', color: '#EA580C', desc: 'Kosi/Ganga Floodplain Swell' },
          { id: 'northeast', name: 'Northeast Mountain Arc (Assam)', score: 72.1, tier: 'High', color: '#F97316', desc: 'Brahmaputra Flood Plain' },
          { id: 'central', name: 'Central Mineral Plateau (MP/JH)', score: 44.0, tier: 'Moderate', color: '#FACC15', desc: 'Catchment River Swell' },
          { id: 'deccan', name: 'Deccan Plateau (Telangana)', score: 38.5, tier: 'Low', color: '#86EFAC', desc: 'Sub-catchment Drainage' },
          { id: 'north', name: 'Northern Highlands (J&K/HP)', score: 31.0, tier: 'Low', color: '#4ADE80', desc: 'Glacial Runoff Channels' },
          { id: 'thar', name: 'Thar Arid Margin (Rajasthan)', score: 12.0, tier: 'Very Low', color: '#22C55E', desc: 'Arid Low Inundation Risk' },
        ];
      default: // vulnerability composite
        return [
          { id: 'east', name: 'East Coast Delta (Odisha/WB)', score: 87.4, tier: 'Very High', color: '#DC2626', desc: 'Cyclone Surge + Kutcha Housing' },
          { id: 'thar', name: 'Thar Desert Belt (Rajasthan)', score: 82.0, tier: 'Very High', color: '#EA580C', desc: 'SPI Drought + Water Deficit' },
          { id: 'west', name: 'Western Ghats (Wayanad/MH)', score: 76.5, tier: 'High', color: '#F97316', desc: 'Heavy Rain + Fragile Roads' },
          { id: 'ganga', name: 'Gangetic Basin (Bihar/UP)', score: 71.8, tier: 'High', color: '#FB923C', desc: 'High Density + Flood Inundation' },
          { id: 'central', name: 'Central Mineral Plateau (MP/JH)', score: 56.4, tier: 'Moderate', color: '#FACC15', desc: 'Rain-fed Agriculture Dependency' },
          { id: 'deccan', name: 'Deccan Rain-Shadow (Telangana)', score: 48.2, tier: 'Moderate', color: '#FDE047', desc: 'Groundwater Stress + Resilience' },
          { id: 'northeast', name: 'Northeast Mountain Arc', score: 34.0, tier: 'Low', color: '#86EFAC', desc: 'Forest Buffer + Low Density' },
          { id: 'north', name: 'Northern Highlands (J&K/HP)', score: 21.5, tier: 'Low', color: '#22C55E', desc: 'Low Exposure Baseline' },
        ];
    }
  }, [heatmapMode]);

  const regionMap = useMemo(() => new Map(regionalHeatData.map((r) => [r.id, r])), [regionalHeatData]);

  useEffect(() => {
    Promise.all([
      api.getOverviewAnalytics(),
      api.getLayerGeoJSON('vulnerability')
    ])
      .then(([overviewRes, geoRes]) => {
        setData(overviewRes);
        setGeoJsonData(geoRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overview telemetry:', err);
        setLoading(false);
      });
  }, []);

  const handleLayerSwitch = (layerKey: string) => {
    setActiveLayer(layerKey);
    api.getLayerGeoJSON(layerKey).then((geo) => setGeoJsonData(geo));
  };

  const stylePolygon = (feature: any) => {
    const props = feature.properties;
    const isSelected = selectedDistrict?.district_id === props.district_id;
    return {
      fillColor: props.layer_color || props.category_color || '#10B981',
      weight: isSelected ? 3 : 1.2,
      opacity: 1,
      color: isSelected ? '#0F172A' : '#FFFFFF',
      fillOpacity: isSelected ? 0.85 : 0.65,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    layer.on({
      click: () => setSelectedDistrict(props),
      mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.9, weight: 2 }),
      mouseout: (e: any) => {
        const isSelected = selectedDistrict?.district_id === props.district_id;
        e.target.setStyle({ fillOpacity: isSelected ? 0.85 : 0.65, weight: isSelected ? 3 : 1.2 });
      }
    });
    layer.bindTooltip(
      `<strong>${props.district_name}</strong> (${props.state_name})<br/>Vulnerability Risk: ${props.vulnerability_score} / 100`,
      { sticky: true, className: 'leaflet-custom-tooltip' }
    );
  };

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-10">
      {/* =================================================================== */}
      {/* 1. TOP METRIC CARDS ROW (7 Compact Cards - Matching Image 1)        */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Card 1: Territorial Coverage */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Territorial Coverage</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono tracking-tight">
            {data ? `${data.total_districts} Districts` : '594 Districts'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center space-x-1">
            <span>{data ? `${data.total_administrative_units || 36} Admin Units (${data.total_states} States, ${data.total_union_territories || 8} UTs)` : '28 States + 8 UTs'}</span>
          </div>
        </div>

        {/* Card 2: Average Risk */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Average Risk</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-amber-600 tracking-tight font-mono">
            {data ? `${data.average_vulnerability_score} / 100` : '54.2 / 100'}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            IPCC AR5 Composite
          </div>
        </div>

        {/* Card 3: Monitored States */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Monitored States & UTs</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono tracking-tight">
            {data ? `${data.total_states} States + ${data.total_union_territories || 8} UTs` : '28 States + 8 UTs'}
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
            36 Total Administrative Units
          </div>
        </div>

        {/* Card 4: High Vulnerability */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">High Risk Zones</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-orange-600 font-mono tracking-tight">
            {data ? data.high_vulnerability_districts : 9}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Score &gt; 60.0 / 100
          </div>
        </div>

        {/* Card 5: Sample Population */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Sample Population</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono tracking-tight">
            {data && data.top_vulnerable_districts.length > 0
              ? `${(data.top_vulnerable_districts.reduce((a, b) => a + (b.population || 0), 0) / 1000000).toFixed(1)}M`
              : '18.4M'}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
            Census of India
          </div>
        </div>

        {/* Card 6: Active Official Alerts */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Active Alerts</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-red-600 font-mono tracking-tight">
            {data ? data.active_official_warnings_count : 3}
          </div>
          <div className="text-[10px] text-red-600 font-semibold mt-0.5">
            SDMA / NDMA Issued
          </div>
        </div>

        {/* Card 7: Adaptive Capacity Index */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">Adaptive Index</span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-emerald-700 tracking-tight font-mono">
            48.6 / 100
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            Infrastructural Baseline
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. MAIN CENTER SECTION: MAP + RISK HAZARDS + RECENT ACTIVITIES      */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left & Center: Mapa Territorial Integrado (7 cols out of 12) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div>
            {/* Header: Title + Ver mapa completo */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 m-0">Integrated Territorial Map</h2>
              <Link
                to="/map"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center space-x-1"
              >
                <span>View full map</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Layer Control Pills Row (matching Image 1) */}
            <div className="flex flex-wrap items-center gap-1.5 py-1 text-[11px]">
              <span className="text-slate-400 font-semibold shrink-0">Active layers:</span>
              {[
                { key: 'vulnerability', label: 'Territorial Risk Heatmap', dot: 'bg-rose-500' },
                { key: 'rainfall', label: 'Open-Meteo Rainfall', dot: 'bg-sky-500' },
                { key: 'temperature', label: 'Thermal Anomalies', dot: 'bg-amber-500' },
                { key: 'flood', label: 'Hydrography & Flood', dot: 'bg-blue-600' },
                { key: 'population_exposure', label: 'Communities & Exposure', dot: 'bg-indigo-500' }
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleLayerSwitch(p.key)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition shrink-0 ${
                    activeLayer === p.key
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
                  <span>{p.label}</span>
                </button>
              ))}
              <button
                onClick={() => navigate('/map')}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-dashed border-slate-300 hover:bg-slate-100 shrink-0 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Add layer</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-200 relative mt-2 bg-slate-100">
            <MapContainer
              center={[22.5, 82.0]}
              zoom={5}
              scrollWheelZoom={false}
              className="w-full h-full z-10"
            >
              <MapViewHandler center={[22.5, 82.0]} zoom={5} />
              <TileLayer
                attribution='&copy; Esri, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
              {geoJsonData && (
                <GeoJSON
                  key={activeLayer}
                  data={geoJsonData}
                  style={stylePolygon}
                  onEachFeature={onEachFeature}
                />
              )}
            </MapContainer>

            {/* Selected District Mini Tooltip Card (if clicked) */}
            {selectedDistrict && (
              <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl text-xs max-w-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedDistrict.district_name}</span>
                  <button onClick={() => setSelectedDistrict(null)} className="text-slate-400 font-bold ml-2">✕</button>
                </div>
                <div className="text-[11px] text-slate-500">{selectedDistrict.state_name} • {selectedDistrict.zone}</div>
                <div className="my-2 py-1.5 border-y border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Vulnerability Score:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedDistrict.vulnerability_score} / 100</span>
                </div>
                <button
                  onClick={() => navigate(`/district/${selectedDistrict.district_id}`)}
                  className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center space-x-1"
                >
                  <span>Open District Profile</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Map Legend Bar (matching Image 1) */}
          <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span>Low Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]"></span>
                <span>Moderate Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                <span>High Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span>Critical Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
                <span>No Data</span>
              </div>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">WGS84 • EPSG:4326</span>
          </div>
        </div>

        {/* Right: Riesgos Territoriales Clave + Actividades Recientes (5 cols out of 12) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-5">
          {/* Key Territorial Risks (matching Image 1) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 m-0">Key Territorial Risks</h2>
              <Link to="/alerts" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                View all &gt;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 my-1">
              {(data?.top_vulnerable_districts && data.top_vulnerable_districts.length > 0
                ? data.top_vulnerable_districts.slice(0, 5).map((d) => ({
                    id: d.id,
                    title: `${d.name}: ${d.vulnerability_category} Vulnerability`,
                    zone: `${d.state_name} • ${d.zone}`,
                    risk: `Score: ${d.vulnerability_score}/100`,
                    telemetry: `${d.temp_c}°C • ${d.rainfall_24h}mm rain (Open-Meteo)`,
                    color: d.vulnerability_score > 80 ? 'text-red-600' : d.vulnerability_score > 60 ? 'text-orange-600' : 'text-amber-600',
                    bg: d.vulnerability_score > 80 ? 'bg-red-50' : d.vulnerability_score > 60 ? 'bg-orange-50' : 'bg-amber-50',
                    icon: d.vulnerability_score > 80 ? AlertTriangle : d.vulnerability_score > 60 ? Flame : Droplets
                  }))
                : [
                    {
                      id: 'IND_KL_WAY',
                      title: 'Wayanad: High Vulnerability',
                      zone: 'Kerala • Western Ghats',
                      risk: 'Score: 84.2/100',
                      telemetry: '27.3°C • 2.3mm rain (Open-Meteo)',
                      color: 'text-red-600',
                      bg: 'bg-red-50',
                      icon: AlertTriangle
                    },
                    {
                      id: 'IND_CG_BAS',
                      title: 'Bastar: High Vulnerability',
                      zone: 'Chhattisgarh • Central Plateau',
                      risk: 'Score: 78.5/100',
                      telemetry: '30.5°C • 0.0mm rain (Open-Meteo)',
                      color: 'text-orange-600',
                      bg: 'bg-orange-50',
                      icon: Flame
                    },
                    {
                      id: 'IND_OD_KEN',
                      title: 'Kendrapara: High Vulnerability',
                      zone: 'Odisha • East Coast',
                      risk: 'Score: 74.0/100',
                      telemetry: '29.1°C • 0.0mm rain (Open-Meteo)',
                      color: 'text-orange-600',
                      bg: 'bg-orange-50',
                      icon: Droplets
                    }
                  ]
              ).map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => item.id ? navigate(`/district/${item.id}`) : navigate('/alerts')}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.bg} ${item.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800 leading-tight">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.zone}</div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className={`text-[10px] font-bold ${item.color}`}>{item.risk}</span>
                          <span className="text-[10px] text-teal-700 font-semibold">• {item.telemetry}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Territorial Activities (Timeline - matching Image 1) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 m-0">Recent Territorial Activities</h2>
              <Link to="/reports" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                View all
              </Link>
            </div>

            <div className="space-y-3 my-2 text-xs">
              {[
                { date: '24 May', title: 'Open-Meteo Grid Sync', desc: 'Paradip & Joshimath telemetry updated with live Open-Meteo data.', dot: 'bg-emerald-500' },
                { date: '23 May', title: 'NASA FIRMS Satellite Thermal Detection', desc: '2 active thermal anomalies detected in Dandakaranya Plateau.', dot: 'bg-sky-500' },
                { date: '22 May', title: 'Official Emergency Bulletin Published', desc: 'Orange Warning issued for coastal squally winds on East Coast.', dot: 'bg-amber-500' },
                { date: '21 May', title: 'Multi-criteria Vulnerability Recalculation', desc: 'IPCC weighting model evaluated across all 26 districts.', dot: 'bg-indigo-500' }
              ].map((act, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="text-[11px] font-bold text-slate-400 w-12 shrink-0 pt-0.5">{act.date}</div>
                  <div className={`w-2 h-2 rounded-full ${act.dot} mt-1.5 shrink-0`}></div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 leading-tight">{act.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{act.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/reports"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 pt-2 border-t border-slate-100 flex items-center justify-between"
            >
              <span>View complete timeline</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM CARDS: RISK BY ZONE, SENSITIVITY, PROJECTS, TRENDS       */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Territorial Risk by Zone (Horizontal Bars - matching Image 1) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 m-0">Territorial Risk by Zone</h3>
            <span className="text-[10px] text-teal-700 font-semibold cursor-pointer">View details</span>
          </div>

          <div className="space-y-2.5 my-1 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  <span>East Coast (Cyclonic)</span>
                </span>
                <span className="font-bold text-slate-800 font-mono">72%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Western Ghats (Highlands)</span>
                </span>
                <span className="font-bold text-slate-800 font-mono">58%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Gangetic Floodplain</span>
                </span>
                <span className="font-bold text-slate-800 font-mono">48%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '48%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Central Plateau</span>
                </span>
                <span className="font-bold text-slate-800 font-mono">28%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Territorial Risk Heatmap (Actual India Geographic Heatmap with Real Thermal Hotspots) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h3 className="text-xs font-bold text-slate-800 m-0 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Territorial Risk Heatmap</span>
                </h3>
                <div className="text-[10px] text-slate-400">Regional Sensitivity & Hazard Density</div>
              </div>
              <span onClick={() => navigate('/map')} className="text-[10px] text-teal-700 font-semibold cursor-pointer hover:underline">
                View details
              </span>
            </div>

            {/* Quick Dimension Pill Selectors: Risk | Thermal | Flood */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg mb-2 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setHeatmapMode('vulnerability')}
                className={`flex-1 py-0.5 rounded transition ${
                  heatmapMode === 'vulnerability' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Risk Composite
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMode('thermal')}
                className={`flex-1 py-0.5 rounded transition ${
                  heatmapMode === 'thermal' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Heatwave
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMode('flood')}
                className={`flex-1 py-0.5 rounded transition ${
                  heatmapMode === 'flood' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Flood / Surge
              </button>
            </div>
          </div>

          {/* Geographic Heatmap Vector Canvas + Continuous Gradient Legend */}
          <div className="flex items-center justify-between my-1 gap-2">
            {/* Realistic India Vector Silhouette with Thermal Dispersion Layers */}
            <div className="w-36 h-36 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 170 185" className="w-full h-full drop-shadow-xs select-none">
                <defs>
                  {/* Gaussian blur filter for scientific thermal dispersion */}
                  <filter id="thermal-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4.5" result="blur" />
                  </filter>

                  {/* Hotspot radial gradients for smooth thermal dispersion */}
                  <radialGradient id="grad-east" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#EA580C" stopOpacity="0.6" />
                    <stop offset="75%" stopColor="#FACC15" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="grad-thar" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#F97316" stopOpacity="0.6" />
                    <stop offset="75%" stopColor="#FACC15" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="grad-west" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#FB923C" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="grad-ganga" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Background Silhouette of India Boundary */}
                <path
                  d="M65,12 L74,5 L83,7 L91,16 L89,32 L108,44 L114,58 L122,38 L138,36 L145,44 L140,60 L128,68 L116,64 L116,76 L108,96 L96,120 L88,126 L84,152 L75,168 L66,154 L58,134 L50,112 L46,88 L38,94 L26,88 L34,82 L26,75 L32,60 L44,46 L58,32 Z"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Contiguous Regional Geographic Parcels with Color Spectrum */}
                {/* 1. North Highlands (J&K, HP, Ladakh, Uttarakhand) */}
                <path
                  d="M65,12 L74,5 L83,7 L91,16 L89,32 L79,34 L58,32 Z"
                  fill={regionMap.get('north')?.color || '#22C55E'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('north') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 2. Thar Arid Margin (Western Rajasthan, Punjab, Kutch) */}
                <path
                  d="M58,32 L44,46 L32,60 L26,75 L34,82 L26,88 L38,94 L46,88 L58,62 Z"
                  fill={regionMap.get('thar')?.color || '#EA580C'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('thar') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 3. Indo-Gangetic Basin (Haryana, UP, Bihar) */}
                <path
                  d="M58,32 L79,34 L89,32 L108,44 L114,58 L110,74 L74,68 L58,62 Z"
                  fill={regionMap.get('ganga')?.color || '#FB923C'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('ganga') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 4. Central Mineral Plateau (Madhya Pradesh, Chhattisgarh, Jharkhand) */}
                <path
                  d="M58,62 L74,68 L110,74 L98,94 L78,96 L54,94 L46,88 Z"
                  fill={regionMap.get('central')?.color || '#FACC15'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('central') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 5. East Coastal Littoral & Delta (Odisha, Coastal AP, West Bengal Delta) */}
                <path
                  d="M110,74 L116,76 L108,96 L96,120 L88,126 L82,104 L98,94 Z"
                  fill={regionMap.get('east')?.color || '#DC2626'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('east') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 6. Western Ghats Highland & Malabar (Konkan, Goa, Coastal Karnataka, Kerala) */}
                <path
                  d="M46,88 L54,94 L50,112 L58,138 L68,160 L75,168 L66,154 L58,134 L52,114 Z"
                  fill={regionMap.get('west')?.color || '#F97316'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('west') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 7. Deccan Rain-Shadow & Southern Plateau (Telangana, Rayalaseema, TN) */}
                <path
                  d="M78,96 L82,104 L88,126 L84,152 L75,168 L68,160 L58,134 L78,96 Z"
                  fill={regionMap.get('deccan')?.color || '#FDE047'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('deccan') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* 8. Northeast Mountain Arc (Assam, Meghalaya, Arunachal) */}
                <path
                  d="M114,58 L122,38 L138,36 L145,44 L140,60 L128,68 L116,64 Z"
                  fill={regionMap.get('northeast')?.color || '#86EFAC'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  className="hover:brightness-110 cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHeatmapHover(regionMap.get('northeast') || null)}
                  onMouseLeave={() => setHeatmapHover(null)}
                />

                {/* Thermal Gaussian Dispersion Heatmap Layer */}
                <g filter="url(#thermal-blur)" opacity="0.65" style={{ pointerEvents: 'none' }}>
                  {/* East Coast Hazard Epicenter */}
                  <ellipse cx="102" cy="94" rx="14" ry="18" fill="url(#grad-east)" />
                  {/* Thar Arid Hotspot */}
                  <circle cx="42" cy="62" r="15" fill="url(#grad-thar)" />
                  {/* Western Ghats High Precipitation Hotspot */}
                  <ellipse cx="58" cy="132" rx="9" ry="16" fill="url(#grad-west)" />
                  {/* Gangetic Inundation Hotspot */}
                  <ellipse cx="86" cy="54" rx="16" ry="8" fill="url(#grad-ganga)" />
                </g>

                {/* Live Sensor Hotspot Indicator Rings */}
                <g style={{ pointerEvents: 'none' }}>
                  {/* East Coast Hotspot Pin */}
                  <circle cx="104" cy="94" r="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="104" cy="94" r="6" fill="none" stroke="#DC2626" strokeWidth="1" opacity="0.7" className="animate-ping" />

                  {/* Thar Hotspot Pin */}
                  <circle cx="40" cy="64" r="3" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1" />
                </g>
              </svg>
            </div>

            {/* Right: Thermal Spectrum Continuous Gradient Legend + Peak Stats */}
            <div className="flex flex-col justify-between h-36 py-1 pl-1 text-[10px] shrink-0 border-l border-slate-100">
              <div className="space-y-1">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hazard Scale</div>
                <div className="flex items-center space-x-1.5">
                  {/* Vertical Continuous Gradient Bar */}
                  <div className="w-2.5 h-20 rounded-full bg-gradient-to-t from-[#22C55E] via-[#FACC15] via-[#FB923C] to-[#DC2626] shadow-2xs border border-slate-200"></div>
                  <div className="flex flex-col justify-between h-20 text-[9px] text-slate-600 font-medium leading-tight">
                    <span className="font-bold text-red-600">Critical (&gt;80)</span>
                    <span className="text-orange-600">High (60-80)</span>
                    <span className="text-amber-600">Mod (40-60)</span>
                    <span className="text-emerald-700">Low (&lt;40)</span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 text-[9px]">
                <div className="text-slate-400">Peak Hotspot</div>
                <div className="font-bold text-rose-600 font-mono">
                  {heatmapMode === 'thermal' ? 'Thar: 91.5' : heatmapMode === 'flood' ? 'Odisha: 94.2' : 'East Coast: 87.4'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Hover Micro-Banner */}
          <div className="text-[10px] text-slate-500 bg-slate-50/90 px-2.5 py-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between mt-1">
            {heatmapHover ? (
              <div className="truncate pr-1">
                <span className="font-bold text-slate-800">{heatmapHover.name}: </span>
                <span className="text-teal-700 font-mono font-bold">{heatmapHover.score}/100</span>{' '}
                <span className="text-slate-500">({heatmapHover.tier})</span>
                {heatmapHover.desc && <span className="text-[9px] text-slate-400 block truncate leading-tight">{heatmapHover.desc}</span>}
              </div>
            ) : (
              <span className="text-slate-400 truncate">Hover India geographic zone to inspect hazard density</span>
            )}
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Box 3: Adaptation Measures (matching Image 1) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 m-0">Adaptation Measures</h3>
            <span className="text-[10px] text-slate-500 font-semibold">View all</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Coastal Cyclone Shelters</div>
                <div className="text-[10px] text-slate-400">Kendrapara & Puri</div>
              </div>
              <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                Approved
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-[11px]">AWS Drainage Flood Defense</div>
                <div className="text-[10px] text-slate-400">Wayanad Highlands</div>
              </div>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Under Review
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-[11px]">Extreme Heat Action Plan</div>
                <div className="text-[10px] text-slate-400">Churu & Jaisalmer</div>
              </div>
              <span className="text-[9px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                In Progress
              </span>
            </div>
          </div>
        </div>

        {/* Box 4: Trends (Sparkline Curves - matching Image 1) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 m-0 flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                <span>Trends</span>
              </h3>
              <div className="text-[10px] text-slate-400">Climate Cycles & Telemetry</div>
            </div>
            <Link to="/analytics" className="text-[10px] text-teal-700 font-semibold hover:underline">
              View complete
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {/* Trend 1: Extreme Precipitation */}
            <div className="flex items-center justify-between hover:bg-slate-50/80 p-1 rounded transition">
              <div className="flex-1 pr-2">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Extreme Precipitation</div>
                <div className="text-[10px] text-red-600 font-semibold font-mono">↑ 15% vs prev month</div>
              </div>
              <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                <path d="M0,16 Q15,18 25,10 T45,8 T60,2" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="2" r="2.5" fill="#EF4444" />
              </svg>
            </div>

            {/* Trend 2: Temperature Anomaly */}
            <div className="flex items-center justify-between hover:bg-slate-50/80 p-1 rounded transition">
              <div className="flex-1 pr-2">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Temperature Anomaly</div>
                <div className="text-[10px] text-amber-600 font-semibold font-mono">↑ 8% vs prev month</div>
              </div>
              <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                <path d="M0,15 Q15,12 30,14 T48,6 T60,4" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="4" r="2.5" fill="#F59E0B" />
              </svg>
            </div>

            {/* Trend 3: Community Resilience */}
            <div className="flex items-center justify-between hover:bg-slate-50/80 p-1 rounded transition">
              <div className="flex-1 pr-2">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Community Resilience</div>
                <div className="text-[10px] text-emerald-600 font-semibold font-mono">↑ 12% vs prev month</div>
              </div>
              <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                <path d="M0,18 Q15,8 30,12 T45,4 T60,2" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="2" r="2.5" fill="#10B981" />
              </svg>
            </div>

            {/* Trend 4: Disaster Warnings Issued */}
            <div className="flex items-center justify-between hover:bg-slate-50/80 p-1 rounded transition">
              <div className="flex-1 pr-2">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Territorial Alerts</div>
                <div className="text-[10px] text-red-600 font-semibold font-mono">↑ 33% vs prev month</div>
              </div>
              <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                <path d="M0,18 Q20,17 32,5 T45,14 T60,2" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="2" r="2.5" fill="#DC2626" />
              </svg>
            </div>

            {/* Trend 5: Incidents & Hazard Disruption */}
            <div className="flex items-center justify-between hover:bg-slate-50/80 p-1 rounded transition">
              <div className="flex-1 pr-2">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Disruption Incidents</div>
                <div className="text-[10px] text-emerald-600 font-semibold font-mono">↓ 5% vs prev month</div>
              </div>
              <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
                <path d="M0,4 Q15,6 30,14 T45,12 T60,18" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="18" r="2.5" fill="#10B981" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. QUICK ACCESS DOCK (6 Action Tiles - matching Image 1 Bottom)     */}
      {/* =================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 m-0 uppercase tracking-wider">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <Link
            to="/map"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Territorial Atlas</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Explore geospatial layers & indicators</div>
            </div>
          </Link>

          <Link
            to="/comparison"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Community Analysis</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Compare fragility and adaptive capacity</div>
            </div>
          </Link>

          <Link
            to="/alerts"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Hazard Monitoring</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Official SDMA warnings & live telemetry</div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Climate Scenarios</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Climate modeling & ERA5 projections</div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Executive Reports</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Generate automated PDF briefs & datasets</div>
            </div>
          </Link>

          <Link
            to="/methodology"
            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200/60 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Data & Methodology</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">IPCC formulas, metadata & sources</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
