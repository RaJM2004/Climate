import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Droplets,
  Thermometer,
  AlertTriangle,
  GitCompare,
  Building2,
  Compass
} from 'lucide-react';
import { api, API_BASE, DistrictSummary } from '../services/api';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const ReportsPage: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    api.getDistricts().then((data) => {
      setDistricts(data);
      if (data.length > 0) {
        const nagpur = data.find((d) => d.name.toLowerCase().includes('nagpur'));
        setSelectedDistrictId(nagpur ? nagpur.id : data[0].id);
      }
    });
  }, []);

  const handleDownloadPdf = (id?: string) => {
    const targetId = id || selectedDistrictId;
    window.location.href = `${API_BASE}/reports/pdf/${targetId}`;
  };

  const handleDownloadCsv = () => {
    window.location.href = `${API_BASE}/reports/export/csv`;
  };

  const handleDownloadExcel = () => {
    window.location.href = `${API_BASE}/reports/export/excel`;
  };

  const selectedDist = districts.find((d) => d.id === selectedDistrictId);

  // Available Thematic Reports Catalog
  const reportCatalog = [
    {
      id: 'national',
      title: 'National Vulnerability Assessment Report',
      category: 'National Overview',
      format: 'Excel / CSV',
      description: 'Comprehensive cross-sectional vulnerability scores, exposure rankings, and population statistics across all 594 districts and 36 States/UTs.',
      action: handleDownloadExcel,
      icon: Compass,
      color: 'text-sky-600 bg-sky-50'
    },
    {
      id: 'district_pdf',
      title: 'District Climate Vulnerability Brief (PDF)',
      category: 'District Level',
      format: 'ReportLab PDF',
      description: 'Publication-ready scientific brief with IPCC AR5 composite indices, 15 normalized indicators, Open-Meteo telemetry, and active disaster alerts.',
      action: () => handleDownloadPdf(),
      icon: FileText,
      color: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'vulnerability_dataset',
      title: 'IPCC AR5/AR6 Indicator Framework Dataset',
      category: 'Vulnerability Analysis',
      format: 'CSV (RFC 4180)',
      description: 'Clean tabular export containing all 15 indicators across Exposure (E), Sensitivity (S), and Adaptive Capacity (A) with raw units and normalized values.',
      action: handleDownloadCsv,
      icon: ShieldAlert,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      id: 'rainfall_climatology',
      title: 'Monsoon & Precipitation Climatology Report',
      category: 'Climate Monitoring',
      format: 'Excel (.xlsx)',
      description: 'Multi-decadal monthly rainfall normals (1991–2020), extreme precipitation frequency (EXP_RAIN), and 24-hour rainfall accumulations.',
      action: handleDownloadExcel,
      icon: Droplets,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'temperature_extremes',
      title: 'Thermal Extremes & Heat Exposure Ledger',
      category: 'Climate Monitoring',
      format: 'CSV (RFC 4180)',
      description: 'Historical days exceeding 35°C and 40°C thresholds, dry-bulb temperature observations, and projected warming anomalies.',
      action: handleDownloadCsv,
      icon: Thermometer,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      id: 'hazard_monitoring',
      title: 'Active Hazards & Satellite Hotspots Ledger',
      category: 'Hazard Monitoring',
      format: 'Excel (.xlsx)',
      description: 'Active satellite thermal anomaly points (NASA FIRMS MODIS/VIIRS 375m) and statutory emergency weather warnings issued by SDMAs/NDMA.',
      action: handleDownloadExcel,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Section 8: Reports, Datasets & Scientific Downloads</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Reports, Briefs & Environmental Data Exports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Generate publication-ready PDF briefs and export empirical indicator datasets in standardized CSV and Excel formats. 
          All figures are generated strictly from live database records with zero synthetic data.
        </p>
      </div>

      <SystemDistinctionBanner collapsed={true} />

      {/* Main Download Options Grid (Primary Quick Downloads) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Option 1: PDF District Brief Generator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">District Climate PDF Brief</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generates an academic-grade, publication-ready PDF brief using ReportLab. Includes composite vulnerability indices, Open-Meteo telemetry, and active disaster alerts.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Select District to Compile:
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state_name}) - Tier: {d.vulnerability_category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleDownloadPdf()}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Download District PDF Brief</span>
          </button>
        </div>

        {/* Option 2: Excel Multi-Sheet Workbook (.xlsx) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">National Excel Dataset (.xlsx)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export multi-sheet Excel workbook generated via OpenPyXL. Includes raw indicators, scores, 24h rainfall, demographics, and scientific methodology.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>• Sheet 1: 594 Districts Vulnerability & Indicators</div>
              <div>• Sheet 2: Methodology, Weights & Metadata</div>
              <div>• Format: OpenXML Spreadsheet (Excel 2016+)</div>
            </div>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Complete Excel (.xlsx)</span>
          </button>
        </div>

        {/* Option 3: Clean CSV Data Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Standard Delimited CSV</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Lightweight standard comma-separated text format ideal for importing into R, Python, QGIS, ArcGIS, or statistical modeling environments.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>• All 594 Constitutional Districts</div>
              <div>• All 15 Normalized Indicator Fields</div>
              <div>• Encoding: UTF-8 with RFC 4180 standard headers</div>
            </div>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Thematic Reports Catalog */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Scientific Reports & Thematic Data Ledgers
          </h2>
          <p className="text-xs text-slate-500">
            Select a specialized thematic ledger for spatial analysis, disaster risk reduction, or climatological modeling
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCatalog.map((rpt) => {
            const Icon = rpt.icon;
            return (
              <div
                key={rpt.id}
                className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rpt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                      {rpt.format}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{rpt.title}</h3>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{rpt.category}</div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">{rpt.description}</p>
                </div>

                <button
                  onClick={rpt.action}
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center space-x-1.5 transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Report</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Provenance & Limitations Documentation Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Report Methodology, Data Provenance & Limitations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Observation Dates & Provenance:</h4>
            <p>
              All downloaded reports document the exact observation timestamp and physical measurement unit. Weather model telemetry derives from the Open-Meteo High-Resolution NWP grid. Active fire detections derive from NASA FIRMS VIIRS/MODIS sensors. Population estimates derive from Census of India baselines projected with WorldPop factors.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Academic & Planning Disclaimer:</h4>
            <p>
              This platform generates vulnerability briefs for academic research, planning and vulnerability diagnosis. It strictly separates multi-decadal vulnerability baselines from short-term hazard monitoring. It does not replace statutory disaster declarations promulgated by the National Disaster Management Authority (NDMA) or state disaster authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
