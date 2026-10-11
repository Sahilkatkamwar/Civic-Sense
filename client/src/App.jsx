// client/src/App.jsx
// Civic-Sense — AI-Powered Civic Intelligence Platform
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages & Feature Modules
import Home from './pages/Home';
import AuthorityDashboard from './modules/report/AuthorityDashboard';
import IncidentsTable from './modules/issues/IncidentsTable';
import AnalyticsDashboard from './modules/analytics/AnalyticsDashboard';
import IssueList from './modules/issues/IssueList';
import IssueDetail from './modules/issues/IssueDetail';
import ReportForm from './modules/report/ReportForm';
import TrackComplaint from './modules/report/TrackComplaint';
import NotFound from './pages/NotFound';

import './theme.css';

export default function App() {
  return (
    <Router>
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            {/* Municipal Executive Overview */}
            <Route path="/" element={<Home />} />

            {/* Municipal Operations & Authority Command */}
            <Route path="/authority" element={<AuthorityDashboard />} />

            {/* Incidents Registry & Table */}
            <Route path="/incidents" element={<IncidentsTable />} />

            {/* Municipal Risk Analytics */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />

            {/* Issue Directory & Safety Protocols */}
            <Route path="/issues" element={<IssueList />} />
            <Route path="/issues/:categoryId" element={<IssueDetail />} />

            {/* Field Hazard Reporting */}
            <Route path="/report" element={<ReportForm />} />
            <Route path="/report/:categoryId" element={<ReportForm />} />

            {/* Real-time Incident Tracking */}
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/track/:complaintId" element={<TrackComplaint />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
