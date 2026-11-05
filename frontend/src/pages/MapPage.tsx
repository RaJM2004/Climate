import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Settings,
  Thermometer,
  Droplets,
  Sun,
  Snowflake,
  RotateCcw,
  Camera,
  Share2,
  Bookmark,
  FileText,
  ChevronDown,
  Users,
  Search,
  Maximize2,
  Layers,
  MapPin,
  Flame,
  Radio
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api, API_BASE } from '../services/api';

// Map view handler with smooth flyTo
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [activeVariable, setActiveVariable] = useState<string>('hot_weather'); // 'temperature', 'precipitation', 'hot_weather', 'cold_weather'
  const [timeHorizon, setTimeHorizon] = useState<string>('hist_recent'); // 'hist_early', 'hist_recent', 'proj_near', 'proj_far'
  const [basemapStyle, setBasemapStyle] = useState<'light' | 'satellite'>('light'); // Default to light carto matching user screenshot

  // Selected district for right inspector panel (defaulting to Nagpur, Maharashtra)
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [districtDetail, setDistrictDetail] = useState<any | null>(null);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.1458, 79.0882]); // Default Nagpur
  const [mapZoom, setMapZoom] = useState<number>(7);

  useEffect(() => {
    // Map active variable to backend layer
    const layerMap: Record<string, string> = {
      hot_weather: 'temperature',
      temperature: 'temperature',
      precipitation: 'rainfall',
      cold_weather: 'vulnerability'
    };
    const reqLayer = layerMap[activeVariable] || 'vulnerability';

    api.getLayerGeoJSON(reqLayer).then((data) => {
      setGeoJsonData(data);
      // Select queried district or fallback to Nagpur
      const query = searchParams.get('search') || searchParams.get('district_id');
      let targetFeature: any = null;
      if (query) {
        const q = query.toLowerCase().trim();
        targetFeature = data.features?.find((f: any) => {
          const p = f.properties || {};
          return (
            p.district_id?.toLowerCase() === q ||
            p.id?.toLowerCase() === q ||
            p.district_name?.toLowerCase()?.includes(q) ||
            p.name?.toLowerCase()?.includes(q) ||
            p.district_code?.toLowerCase() === q
          );
        });
      }
      if (!targetFeature && !selectedDistrict) {
        targetFeature = data.features?.find(
          (f: any) => f.properties?.district_name?.toLowerCase().includes('nagpur')
        );
      }
      if (targetFeature?.properties) {
        setSelectedDistrict(targetFeature.properties);
        setMapCenter([targetFeature.properties.centroid_lat, targetFeature.properties.centroid_lng]);
        setMapZoom(query ? 8 : 7);
      } else if (!selectedDistrict && data.features?.[0]) {
        setSelectedDistrict(data.features[0].properties);
        setMapCenter([data.features[0].properties.centroid_lat, data.features[0].properties.centroid_lng]);
      }
    });
  }, [activeVariable]);

  // Handle URL query parameters (?search=... or ?district_id=...) when they change dynamically
  useEffect(() => {
    if (!geoJsonData?.features) return;
    const query = searchParams.get('search') || searchParams.get('district_id');
    if (!query) return;

    const q = query.toLowerCase().trim();
    const match = geoJsonData.features.find((f: any) => {
      const p = f.properties || {};
      return (
        p.district_id?.toLowerCase() === q ||
        p.id?.toLowerCase() === q ||
        p.district_name?.toLowerCase()?.includes(q) ||
        p.name?.toLowerCase()?.includes(q) ||
        p.district_code?.toLowerCase() === q
      );
    });

    if (match?.properties) {
      setSelectedDistrict(match.properties);
      if (match.properties.centroid_lat && match.properties.centroid_lng) {
        setMapCenter([match.properties.centroid_lat, match.properties.centroid_lng]);
        setMapZoom(8);
      }
    }
  }, [searchParams, geoJsonData]);

  // Fetch live district details and climate trends whenever selected district changes
  useEffect(() => {
    if (!selectedDistrict) return;
    const dId = selectedDistrict.district_id || selectedDistrict.id;
    if (!dId) return;

    setLoadingDetail(true);
    api.getDistrictDetail(dId)
      .then((detail) => {
        setDistrictDetail(detail);
        setLoadingDetail(false);
      })
      .catch((err) => {
        console.warn('Failed to load district detail:', err);
        setLoadingDetail(false);
      });

    api.getClimateTrends(dId)
      .then((trends) => {
        if (trends?.trends) {
          setTrendsData(trends.trends);
        }
      })
      .catch((err) => {
        console.warn('Failed to load trends:', err);
      });
  }, [selectedDistrict?.district_id, selectedDistrict?.id]);

  // Filtered district list for dropdown
  const districtList = useMemo(() => {
    if (!geoJsonData?.features) return [];
    return geoJsonData.features
      .map((f: any) => f.properties)
      .filter((p: any) => p && p.district_name)
      .sort((a: any, b: any) => (a.district_name || '').localeCompare(b.district_name || ''));
  }, [geoJsonData]);

  // Handle polygon style dynamically based on activeVariable
  const styleFeature = (feature: any) => {
    const props = feature.properties;
    const isSelected =
      selectedDistrict?.district_id === props.district_id ||
      selectedDistrict?.district_name === props.district_name;

    let fill = '#FB923C';
    let selectedFill = '#EA580C';
    let strokeColor = '#94A3B8';
    let selectedStroke = '#9A3412';

    if (activeVariable === 'precipitation') {
      const rain = props.rainfall_24h ?? props.rainfall_mm_24h ?? 0;
      if (rain > 25) fill = '#1D4ED8';
      else if (rain > 10) fill = '#2563EB';
      else if (rain > 2) fill = '#60A5FA';
      else fill = '#BAE6FD';

      selectedFill = '#1D4ED8';
      selectedStroke = '#1E3A8A';
    } else if (activeVariable === 'cold_weather') {
      const temp = props.temp_c ?? props.temp_current_c ?? 28;
      if (temp < 15) fill = '#0369A1';
      else if (temp < 22) fill = '#0284C7';
      else if (temp < 28) fill = '#38BDF8';
      else fill = '#E0F2FE';

      selectedFill = '#0284C7';
      selectedStroke = '#075985';
    } else {
      // Hot weather or temperature
      const temp = props.temp_c ?? props.temp_current_c ?? 32;
      if (temp > 40) fill = '#DC2626';
      else if (temp > 35) fill = '#EA580C';
      else if (temp > 30) fill = '#F97316';
      else fill = '#FBBF24';

      selectedFill = '#EA580C';
      selectedStroke = '#9A3412';
    }

    return {
      fillColor: isSelected ? selectedFill : fill,
      weight: isSelected ? 3 : 0.8,
      opacity: isSelected ? 1 : 0.45,
      color: isSelected ? selectedStroke : strokeColor,
      fillOpacity: isSelected ? 0.70 : 0.22,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    layer.on({
      click: () => {
        setSelectedDistrict(props);
        setMapCenter([props.centroid_lat, props.centroid_lng]);
        setMapZoom(7);
      },
      mouseover: (e: any) => {
        const isSelected = selectedDistrict?.district_id === props.district_id;
        if (!isSelected) {
          e.target.setStyle({ fillOpacity: 0.55, weight: 1.8 });
        }
      },
      mouseout: (e: any) => {
        const isSelected = selectedDistrict?.district_id === props.district_id;
        e.target.setStyle({ fillOpacity: isSelected ? 0.70 : 0.18, weight: isSelected ? 2.5 : 0.8 });
      }
    });
  };

  const handleSelectDistrictById = (dId: string) => {
    const match = geoJsonData?.features?.find(
      (f: any) => f.properties?.district_id === dId || f.id === dId
    );
    if (match) {
      setSelectedDistrict(match.properties);
      setMapCenter([match.properties.centroid_lat, match.properties.centroid_lng]);
      setMapZoom(7);
    }
  };

  // Simulated CMIP6 Projection data matching Reference Image line chart
  const projectionTrend = [
    { year: 2000, historical: 82, projected: null },
    { year: 2005, historical: 110, projected: null },
    { year: 2010, historical: 95, projected: null },
    { year: 2015, historical: 122, projected: null },
    { year: 2020, historical: 105, projected: 105 },
    { year: 2025, historical: null, projected: 118 },
    { year: 2030, historical: null, projected: 124 },
    { year: 2035, historical: null, projected: 135 },
    { year: 2040, historical: null, projected: 128 },
    { year: 2045, historical: null, projected: 146 },
    { year: 2050, historical: null, projected: 154 },
    { year: 2055, historical: null, projected: 148 },
    { year: 2060, historical: null, projected: 168 },
    { year: 2065, historical: null, projected: 178 },
    { year: 2070, historical: null, projected: 185 },
    { year: 2075, historical: null, projected: 172 },
    { year: 2080, historical: null, projected: 202 },
    { year: 2085, historical: null, projected: 195 },
    { year: 2090, historical: null, projected: 218 }
  ];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col space-y-2 max-w-[1700px] mx-auto">
      {/* =================================================================== */}
      {/* TOP HEADER: ATLAS DROPDOWN + DISTRICT SEARCH + TIMELINE TABS        */}
      {/* =================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <button className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition">
            <span>Atlas</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Quick District Selector (All 594 Districts in India) */}
          <div className="flex items-center space-x-2 bg-slate-100/90 rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDistrict?.district_id || ''}
              onChange={(e) => handleSelectDistrictById(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[220px]"
            >
              <option value="">Select District (594 across India)...</option>
              {districtList.map((d: any, idx: number) => (
                <option key={d.district_id || idx} value={d.district_id}>
                  {d.district_name} ({d.state_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Horizon Toggle Pills (matching Reference Image) */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Historical Group */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 px-2 font-semibold">Historical (ERA5 & Open-Meteo):</span>
            <button
              onClick={() => setTimeHorizon('hist_early')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                timeHorizon === 'hist_early' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              1981–2010
            </button>
            <button
              onClick={() => setTimeHorizon('hist_recent')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                timeHorizon === 'hist_recent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              2011–2024
            </button>
          </div>

          {/* Projected Group */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 px-2 font-semibold">Projected (CMIP6):</span>
            <button
              onClick={() => setTimeHorizon('proj_near')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                timeHorizon === 'proj_near' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              2031–2050
            </button>
            <button
              onClick={() => setTimeHorizon('proj_far')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                timeHorizon === 'proj_far' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              2051–2070
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SPLIT SCREEN: LEFT GIS MAP CANVAS + RIGHT INSPECTION PANEL (Image 2) */}
      {/* =================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Map Container (8 cols out of 12) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full z-10"
          >
            <MapViewController center={mapCenter} zoom={mapZoom} />

            {/* Dynamic Basemap Layer */}
            {basemapStyle === 'light' ? (
              <>
                <TileLayer
                  attribution='&copy; Esri, HERE, Garmin, INCREMENT P, METI/NASA, USGS'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
                <TileLayer
                  attribution='&copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            {/* GeoJSON Feature Layer for 594 Districts */}
            {geoJsonData && (
              <GeoJSON
                key={`${activeVariable}-${timeHorizon}-${basemapStyle}`}
                data={geoJsonData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}

            {/* Pinned District Marker directly on GPS centroid (Locking Pin to Nagpur) */}
            {selectedDistrict && selectedDistrict.centroid_lat && selectedDistrict.centroid_lng && (
              <Marker
                position={[selectedDistrict.centroid_lat, selectedDistrict.centroid_lng]}
                icon={L.divIcon({
                  className: 'custom-district-pin',
                  html: `
                    <div style="
                      background: #FFFFFF;
                      padding: 5px 12px;
                      border-radius: 8px;
                      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
                      border: 1px solid #CBD5E1;
                      font-size: 12px;
                      font-weight: 800;
                      color: #0F172A;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      white-space: nowrap;
                      transform: translate(-50%, -100%);
                      margin-top: -8px;
                    ">
                      <span>${selectedDistrict.district_name || 'Nagpur'}</span>
                      <span style="color: #94A3B8; font-size: 10px;">✕</span>
                    </div>
                  `,
                  iconSize: [0, 0]
                })}
              />
            )}
          </MapContainer>

          {/* Floating Left Vertical Toolbar (matching Reference Image) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-md">
            <button
              onClick={() => setBasemapStyle((s) => (s === 'light' ? 'satellite' : 'light'))}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition flex items-center justify-center group relative"
              title={basemapStyle === 'light' ? 'Switch to Satellite Imagery' : 'Switch to Light Cartographic'}
            >
              <Layers className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setActiveVariable('temperature')}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeVariable === 'temperature' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature</span>
            </button>
            <button
              onClick={() => setActiveVariable('precipitation')}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeVariable === 'precipitation' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Precipitation</span>
            </button>
            <button
              onClick={() => setActiveVariable('hot_weather')}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeVariable === 'hot_weather' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Hot Weather</span>
            </button>
            <button
              onClick={() => setActiveVariable('cold_weather')}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeVariable === 'cold_weather' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              <span>Cold Weather</span>
            </button>
            <button
              onClick={() => {
                setMapCenter([21.1458, 79.0882]);
                setMapZoom(7);
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition flex items-center justify-center"
              title="Reset View to Nagpur"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Right Map Controls (Bookmark, Camera, Share, Zoom) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-md">
            <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Bookmark className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Camera className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Share2 className="w-4 h-4" /></button>
            <div className="w-full h-px bg-slate-200 my-0.5"></div>
            <button onClick={() => setMapZoom((z) => Math.min(z + 1, 12))} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold">+</button>
            <button onClick={() => setMapZoom((z) => Math.max(z - 1, 4))} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold">-</button>
          </div>

          {/* Bottom-Left Floating Color Legend Card (matching Reference Image) */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-md text-xs w-72">
            <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-1">
              <span>
                {activeVariable === 'precipitation'
                  ? '24-Hour Rainfall Accumulation (mm)'
                  : activeVariable === 'cold_weather'
                  ? 'Cold Wave Days (days/year)'
                  : 'Days With Max Temp > 35°C (days/year)'}
              </span>
              <Maximize2 className="w-3 h-3 text-slate-400 cursor-pointer" />
            </div>
            <span className="text-[10px] text-slate-500 block mb-2">Number of districts: 100%</span>

            {/* Horizontal Segmented Bar matching active variable */}
            {activeVariable === 'precipitation' ? (
              <div className="grid grid-cols-3 gap-0.5 rounded overflow-hidden h-4">
                <div className="bg-[#BAE6FD] text-slate-800 text-[9px] font-bold flex items-center justify-center">&lt; 5 mm</div>
                <div className="bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">5–25 mm</div>
                <div className="bg-[#1D4ED8] text-white text-[9px] font-bold flex items-center justify-center">&gt; 25 mm</div>
              </div>
            ) : activeVariable === 'cold_weather' ? (
              <div className="grid grid-cols-3 gap-0.5 rounded overflow-hidden h-4">
                <div className="bg-[#38BDF8] text-slate-800 text-[9px] font-bold flex items-center justify-center">&lt; 15°C</div>
                <div className="bg-[#0284C7] text-white text-[9px] font-bold flex items-center justify-center">15–22°C</div>
                <div className="bg-[#0369A1] text-white text-[9px] font-bold flex items-center justify-center">&gt; 22°C</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 rounded overflow-hidden h-4">
                <div className="bg-[#EA580C] text-white text-[9px] font-bold flex items-center justify-center">95–98</div>
                <div className="bg-[#C2410C] text-white text-[9px] font-bold flex items-center justify-center">98–120</div>
                <div className="bg-[#7C2D12] text-white text-[9px] font-bold flex items-center justify-center">120–132</div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT INSPECTOR PANEL (4 cols out of 12 - matching Reference Image) */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div>
            {/* District Title & Population */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 m-0">
                  {districtDetail?.name || selectedDistrict?.district_name || 'Nagpur'}, {districtDetail?.state_name || selectedDistrict?.state_name || 'Maharashtra'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {districtDetail?.zone || selectedDistrict?.zone || 'Central Plateau'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-mono">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {(districtDetail?.population?.total_population || (typeof districtDetail?.population === 'number' ? districtDetail.population : null) || selectedDistrict?.population || 5565414).toLocaleString('en-IN')}{' '}
                  Residents
                </span>
              </div>
            </div>

            {/* Top Climate Concerns (bullets matching active variable) */}
            <div className="my-3 space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 block">Top climate concerns:</span>
              {activeVariable === 'precipitation' ? (
                <>
                  <div className="flex items-center space-x-2 text-blue-700 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Monsoon Inundation & Flash Flood (Score: {districtDetail?.indicators?.flood_exposure ? Math.round(districtDetail.indicators.flood_exposure) : 88}/100)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sky-700 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Rainfall Extremes Exposure (Score: {districtDetail?.indicators?.rainfall_extremes ? Math.round(districtDetail.indicators.rainfall_extremes) : 82}/100)</span>
                  </div>
                </>
              ) : activeVariable === 'cold_weather' ? (
                <>
                  <div className="flex items-center space-x-2 text-cyan-700 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                    <span>Winter Cold Wave & Dense Fog Hazard (Score: 68/100)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Agricultural Frost Risk (Score: 54/100)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    <span>Extreme Heat Wave Index (Score: {districtDetail?.indicators?.heat_exposure ? Math.round(districtDetail.indicators.heat_exposure) : 92}/100)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-600 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    <span>Drought & Aridity Stress (Score: {districtDetail?.indicators?.drought_exposure ? Math.round(districtDetail.indicators.drought_exposure) : 76}/100)</span>
                  </div>
                </>
              )}
            </div>

            {/* Real-time Open-Meteo Telemetry Badge */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 my-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span className="font-bold flex items-center space-x-1.5">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>Real-time Telemetry (Open-Meteo)</span>
                </span>
                <span className="text-[10px] text-teal-700 font-semibold font-mono">
                  {districtDetail?.current_weather?.station_name || 'Live Surface Grid'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-1">
                <div>
                  Surface Temp:{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {districtDetail?.current_weather?.temp_current_c ?? selectedDistrict?.temp_c ?? 33.5}°C
                  </span>
                </div>
                <div>
                  24h Rain:{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {districtDetail?.current_weather?.rainfall_mm_24h ?? selectedDistrict?.rainfall_24h ?? 0.0} mm
                  </span>
                </div>
                <div>
                  Rel. Humidity:{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {districtDetail?.current_weather?.humidity_pct ?? 48}%
                  </span>
                </div>
                <div>
                  Sky Condition:{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {districtDetail?.current_weather?.weather_condition ?? 'Fair / Clear'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Chart (Precipitation BarChart vs Thermal LineChart) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  {activeVariable === 'precipitation'
                    ? 'Monthly Rainfall & Climatological Normal (mm)'
                    : 'Days with Maximum Temperature Greater than 35°C'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeVariable === 'precipitation' ? 'Open-Meteo ERA5' : '1980–2090 CMIP6'}
                </span>
              </div>

              <div className="h-44 w-full bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  {activeVariable === 'precipitation' ? (
                    <BarChart
                      data={
                        trendsData.length > 0
                          ? trendsData
                          : [
                              { month: 'Jan', rainfall_mm: 12, normal_rainfall_mm: 14 },
                              { month: 'Feb', rainfall_mm: 16, normal_rainfall_mm: 15 },
                              { month: 'Mar', rainfall_mm: 18, normal_rainfall_mm: 17 },
                              { month: 'Apr', rainfall_mm: 22, normal_rainfall_mm: 24 },
                              { month: 'May', rainfall_mm: 48, normal_rainfall_mm: 45 },
                              { month: 'Jun', rainfall_mm: 165, normal_rainfall_mm: 150 },
                              { month: 'Jul', rainfall_mm: 290, normal_rainfall_mm: 280 },
                              { month: 'Aug', rainfall_mm: 275, normal_rainfall_mm: 260 },
                              { month: 'Sep', rainfall_mm: 180, normal_rainfall_mm: 170 },
                              { month: 'Oct', rainfall_mm: 55, normal_rainfall_mm: 50 },
                              { month: 'Nov', rainfall_mm: 18, normal_rainfall_mm: 15 },
                              { month: 'Dec', rainfall_mm: 8, normal_rainfall_mm: 10 }
                            ]
                      }
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} mm`, '']}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px' }}
                      />
                      <Bar dataKey="rainfall_mm" fill="#2563EB" radius={[3, 3, 0, 0]} name="Observed Rainfall (mm)" />
                      <Bar dataKey="normal_rainfall_mm" fill="#93C5FD" radius={[3, 3, 0, 0]} name="Baseline Normal" />
                    </BarChart>
                  ) : (
                    <LineChart data={projectionTrend}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis domain={[60, 240]} tick={{ fill: '#64748B', fontSize: 9 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} days`, '']}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px' }}
                      />
                      <Line type="monotone" dataKey="historical" stroke="#2563EB" strokeWidth={2} dot={false} name="Historical (ERA5 Baseline)" />
                      <Line type="monotone" dataKey="projected" stroke="#EC4899" strokeWidth={2} dot={false} name="Projected (CMIP6)" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Extreme Events Risk Profile List */}
            <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
              <span className="font-bold text-slate-800 block">Extreme events risk profile</span>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Flood hazard score:</span>
                <span className="font-bold text-red-600 font-mono">
                  {districtDetail?.indicators?.flood_exposure ? `${Math.round(districtDetail.indicators.flood_exposure)} / 100` : '88 / 100'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Extreme heat index:</span>
                <span className="font-bold text-red-600 font-mono">
                  {districtDetail?.indicators?.heat_exposure ? `${Math.round(districtDetail.indicators.heat_exposure)} / 100` : '92 / 100'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Adaptive capacity:</span>
                <span className="font-bold text-teal-700 font-mono">
                  {districtDetail?.vulnerability?.adaptive_capacity_score ? `${Math.round(districtDetail.vulnerability.adaptive_capacity_score)} / 100` : '54 / 100'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Links & PDF Download */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <a
              href={`${API_BASE}/reports/pdf/${selectedDistrict?.district_id || 'IND_MH_NAG'}`}
              download
              className="w-full py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Download Official Brief (PDF)</span>
            </a>

            <button
              onClick={() => navigate(`/district/${selectedDistrict?.district_id || 'IND_MH_NAG'}`)}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <span>View Full Detailed Profile →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
