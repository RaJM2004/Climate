import React, { useState } from 'react';
import {
  Info,
  GraduationCap,
  Layers,
  Send,
  CheckCircle2,
  Mail,
  MapPin,
  ShieldCheck,
  Code
} from 'lucide-react';
import { SystemDistinctionBanner } from '../components/SystemDistinctionBanner';

export const AboutPage: React.FC = () => {
  const [feedback, setFeedback] = useState({
    name: '',
    role: 'STUDENT_EVALUATOR',
    email: '',
    comments: ''
  });
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.comments.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          About Community Climate Vulnerability Mapping
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Academic Capstone / College Project Specification, System Architecture & Peer Review
        </p>
      </div>

      <SystemDistinctionBanner />

      {/* Main Project Overview & Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Academic Scope & Architecture */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900 m-0">Project Scope & Academic Objectives</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This web platform was developed as a senior college software architecture and GIS climate data science project. It bridges the gap between complex multi-criteria climate assessments and grassroots community preparedness across India.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike generic weather applications, the platform establishes a strict architectural decoupling between <b>long-term structural climate vulnerability</b> (evaluated via IPCC AR5/AR6 multi-criteria models) and <b>current environmental hazard monitoring</b> (synoptic IMD telemetry, NASA GPM satellite precipitation, and NASA FIRMS active fire hotspots).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900 m-0">Technology Stack & Implementation Design</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs mb-1">Frontend Layer</span>
                <p className="text-slate-600 text-[11px]">
                  React 19, TypeScript, Vite, Tailwind CSS, Leaflet.js, React-Leaflet, and Recharts. Built for responsive performance and accessible contrast.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs mb-1">Backend & API Layer</span>
                <p className="text-slate-600 text-[11px]">
                  Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, APScheduler, and JWT authentication with role-based access control.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs mb-1">Spatial Engine & Database</span>
                <p className="text-slate-600 text-[11px]">
                  PostgreSQL with PostGIS for spatial polygon joins and queries, with an automatic zero-configuration SQLite fallback for portable college demonstrations.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs mb-1">Reporting & Exports</span>
                <p className="text-slate-600 text-[11px]">
                  ReportLab for compiled district PDF vulnerability briefs, and Pandas / OpenPyXL for multi-sheet Excel and CSV dataset downloads.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Project Team & Feedback Form */}
        <div className="space-y-6">
          {/* Project Credits Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Project Credits & Affiliation</h3>
            <div className="space-y-2 text-slate-600 text-[11px]">
              <div><b>Institution:</b> Department of Computer Science & Climate Studies</div>
              <div><b>Course:</b> Full-Stack Geospatial Software Architecture</div>
              <div><b>Evaluation Term:</b> Academic Year 2026</div>
              <div><b>Dataset Baseline:</b> IMD, NASA GPM, Copernicus ERA5, Census 2011</div>
            </div>
          </div>

          {/* Peer Review & Feedback Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Evaluator / Peer Review Form</h3>
            <p className="text-[11px] text-slate-500">
              Submit feedback or questions for college presentation defense
            </p>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Thank you! Your feedback has been recorded for the evaluation panel.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Your Name:</label>
                  <input
                    type="text"
                    required
                    value={feedback.name}
                    onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                    placeholder="Prof. / Reviewer Name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role / Department:</label>
                  <select
                    value={feedback.role}
                    onChange={(e) => setFeedback({ ...feedback, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="PROJECT_EXAMINER">Project Examiner</option>
                    <option value="FACULTY_GUIDE">Faculty Guide</option>
                    <option value="STUDENT_PEER">Student Peer</option>
                    <option value="RESEARCHER">Climate Researcher</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Feedback / Observations:</label>
                  <textarea
                    rows={3}
                    required
                    value={feedback.comments}
                    onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                    placeholder="Enter observations on UI, formula, spatial queries, or API performance..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Peer Review</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
