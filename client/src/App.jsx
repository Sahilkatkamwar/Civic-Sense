// client/src/App.jsx
// Owner: Sahil (Team Lead) - Master Route Configuration & Layout
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages & Modules
import Home from './pages/Home';
import IssueList from './modules/issues/IssueList';
import IssueDetail from './modules/issues/IssueDetail';
import ReportForm from './modules/report/ReportForm';
import TrackComplaint from './modules/report/TrackComplaint';
import AuthorityDashboard from './modules/report/AuthorityDashboard';
import NotFound from './pages/NotFound';

import './theme.css';

export default function App() {
  return (
    <Router>
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Sahil - Home */}
            <Route path="/" element={<Home />} />

            {/* Sujal - Issue Explorer */}
            <Route path="/issues" element={<IssueList />} />
            <Route path="/issues/:categoryId" element={<IssueDetail />} />

            {/* Tanush - Complaint Submission */}
            <Route path="/report" element={<ReportForm />} />
            <Route path="/report/:categoryId" element={<ReportForm />} />

            {/* Tanush - Tracking */}
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/track/:complaintId" element={<TrackComplaint />} />

            {/* Tanush - Authority Command Center */}
            <Route path="/authority" element={<AuthorityDashboard />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
