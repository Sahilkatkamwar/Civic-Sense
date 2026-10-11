// client/src/pages/Home.jsx
// Owner: Sahil (Team Lead) - Home Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CategoryCard from '../modules/issues/CategoryCard';
import MiniMap from '../components/MiniMap';
import { howItWorksSteps, faqs } from '../content/text';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    in_progress: 0,
    under_review: 0,
    citizen_reports: 0
  });
  const [categories, setCategories] = useState([]);
  const [topComplaints, setTopComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);

  useEffect(() => {
    // Fetch live stats
    fetch(`${API_BASE}/api/complaints/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load stats:', err));

    // Fetch categories preview
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Failed to load categories:', err));

    // Fetch top priority complaints
    fetch(`${API_BASE}/api/complaints?sort=priority`)
      .then((res) => res.json())
      .then((data) => {
        setAllComplaints(data);
        setTopComplaints(data.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load priority complaints:', err);
      });
  }, []);

  return (
    <div className="home-root">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <span className="pulse-dot"></span> Next-Gen Citizen Civic Response System
          </div>
          <h1 className="hero-title">
            Spot a problem in your city? <br />
            <span className="hero-gradient">Snap it. Report it. Track it.</span>
          </h1>
          <p className="hero-description">
            Civic Sense routes municipal hazards directly to responsible departments, uses computer-assisted
            duplicate detection to eliminate noise, and escalates priority with every citizen report.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-primary btn-lg">
              🚨 Report an Issue Now
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg">
              🔍 Track Your Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Live Stats Strip */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-number">{stats.total || 0}</span>
              <span className="stat-label">Total Registered Issues</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number stat-green">{stats.resolved || 0}</span>
              <span className="stat-label">Issues Resolved</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number stat-blue">{stats.in_progress || 0}</span>
              <span className="stat-label">In Progress / Dispatched</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number stat-amber">{stats.citizen_reports || 0}</span>
              <span className="stat-label">Total Citizen Confirmations</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Issue Types Preview */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-low">Issue Directory</span>
            <h2 className="section-title">Common Civic Issues Handled</h2>
            <p className="section-subtitle">
              Every issue is categorized and routed automatically to its responsible municipal department.
            </p>
          </div>

          <div className="grid-3">
            {categories.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>

          <div className="text-center" style={{ marginTop: '2.5rem' }}>
            <Link to="/issues" className="btn btn-outline btn-lg">
              View All Categories & Guidance &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="section-padding bg-subtle-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-low">Workflow</span>
            <h2 className="section-title">How Civic Sense Works</h2>
            <p className="section-subtitle">
              Simple 4-step workflow from citizen sighting to verified resolution.
            </p>
          </div>

          <div className="grid-4 steps-grid">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="card step-card">
                <div className="step-num-badge">0{step.step}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Top Priority Issues & Live Map */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-critical">Dynamic Priority Triage</span>
            <h2 className="section-title">Top Priority Issues Under Triage</h2>
            <p className="section-subtitle">
              Ranked dynamically by severity weight, number of citizen reports, and duration open.
            </p>
          </div>

          <div className="grid-2 priority-layout">
            {/* Top 3 List */}
            <div className="priority-list">
              {topComplaints.length === 0 ? (
                <div className="card text-center" style={{ padding: '2rem' }}>
                  <p>No open complaints at the moment.</p>
                </div>
              ) : (
                topComplaints.map((c, index) => (
                  <div key={c.id} className="card priority-item-card card-hover">
                    <div className="priority-item-top">
                      <div className="rank-badge">#{index + 1}</div>
                      <div>
                        <span className="priority-code">{c.id}</span>
                        <h4 className="priority-cat">{c.category_icon} {c.category_name}</h4>
                      </div>
                      <span className={`badge badge-${c.priority_level}`} style={{ marginLeft: 'auto' }}>
                        {c.priority_level} ({c.priority_score})
                      </span>
                    </div>

                    <p className="priority-item-desc">{c.description}</p>

                    <div className="priority-item-footer">
                      <span>📍 {c.address_text || `${c.latitude}, ${c.longitude}`}</span>
                      <span>👥 {c.report_count} citizen report(s)</span>
                      <Link to={`/track/${c.id}`} className="priority-track-link">
                        Track &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}

              <div style={{ marginTop: '1rem' }}>
                <Link to="/authority" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  View Full Municipal Dispatch Queue &rarr;
                </Link>
              </div>
            </div>

            {/* Mini Map */}
            <div>
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Live Geospatial Incident Map</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Interactive pins & popups</span>
              </div>
              <MiniMap complaints={allComplaints} />
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="section-padding bg-subtle-section">
        <div className="container" style={{ maxWidth: '850px' }}>
          <div className="section-header">
            <span className="badge badge-low">Knowledge Base</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Learn how our duplicate algorithms, priority calculations, and municipal routing operate.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card faq-card">
                <h4 className="faq-question">❓ {faq.question}</h4>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .hero-section {
          background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
          padding: 4.5rem 0 3.5rem;
          text-align: center;
          border-bottom: 1px solid var(--border);
        }
        .hero-container {
          max-width: 820px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #ffffff;
          padding: 0.35rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          border: 1px solid var(--primary-border);
          box-shadow: var(--shadow-sm);
          margin-bottom: 1.5rem;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: var(--accent);
          border-radius: 50%;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 1.25rem;
        }
        .hero-gradient {
          background: linear-gradient(90deg, #1e40af, #0284c7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .stats-section {
          margin-top: -1.75rem;
          position: relative;
          z-index: 10;
        }
        .stats-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem 2rem;
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          display: block;
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .stat-green { color: #16a34a; }
        .stat-blue { color: #2563eb; }
        .stat-amber { color: #d97706; }
        .stat-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-divider {
          width: 1px;
          height: 48px;
          background: var(--border);
        }
        .section-padding {
          padding: 4.5rem 0;
        }
        .bg-subtle-section {
          background-color: #f1f5f9;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .section-header {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 3rem;
        }
        .section-title {
          font-size: 2.1rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0.5rem 0 0.75rem;
          letter-spacing: -0.02em;
        }
        .section-subtitle {
          color: var(--text-muted);
          font-size: 1.05rem;
          line-height: 1.5;
        }
        .step-card {
          position: relative;
          padding: 2rem 1.5rem;
          text-align: center;
        }
        .step-num-badge {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: #94a3b8;
          font-family: monospace;
        }
        .step-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .step-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .step-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .priority-item-card {
          margin-bottom: 1rem;
          border: 1px solid var(--border);
        }
        .priority-item-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.65rem;
        }
        .rank-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #eff6ff;
          color: var(--primary);
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .priority-code {
          font-family: monospace;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          display: block;
        }
        .priority-cat {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .priority-item-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .priority-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.775rem;
          color: #64748b;
          border-top: 1px solid var(--border);
          padding-top: 0.65rem;
        }
        .priority-track-link {
          font-weight: 700;
          color: var(--primary);
        }
        .faq-card {
          margin-bottom: 1rem;
        }
        .faq-question {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.4rem;
        }
        .faq-answer {
          font-size: 0.925rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.2rem;
          }
          .stats-card {
            flex-direction: column;
            gap: 1.25rem;
          }
          .stat-divider {
            display: none;
          }
          .priority-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
