import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { DistrictProfilePage } from './pages/DistrictProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { VulnerabilityPage } from './pages/VulnerabilityPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="district/:id" element={<DistrictProfilePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="vulnerability" element={<VulnerabilityPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
