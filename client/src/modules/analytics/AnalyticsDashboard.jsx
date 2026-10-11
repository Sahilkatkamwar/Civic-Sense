// client/src/modules/analytics/AnalyticsDashboard.jsx
// Municipal Risk & Operational Analytics
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  Layers
} from 'lucide-react';
import {
  getCategoryConfig,
  getPriorityConfig
} from '../../utils/civicHelpers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AnalyticsDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    in_progress: 0,
    under_review: 0,
    citizen_reports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/complaints?sort=priority`).then((r) => r.json()),
      fetch(`${API_BASE}/api/complaints/stats`).then((r) => r.json())
    ])
      .then(([complaintsData, statsData]) => {
        setComplaints(complaintsData);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container page-wrapper text-center">
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Computing real-time municipal risk analytics...</p>
      </div>
    );
  }

  const total = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const underReviewCount = complaints.filter((c) => c.status === 'under_review').length;
  const submittedCount = complaints.filter((c) => c.status === 'submitted').length;
  const totalConfirmations = stats.citizen_reports || complaints.reduce((sum, c) => sum + (c.report_count || 1), 0);
  const duplicatesMerged = Math.max(0, totalConfirmations - total);

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Category counts
  const categoryCounts = {};
  complaints.forEach((c) => {
    categoryCounts[c.category_id] = (categoryCounts[c.category_id] || 0) + 1;
  });

  // Priority counts
  const priorityCounts = {
    critical: complaints.filter((c) => c.priority_level === 'critical').length,
    high: complaints.filter((c) => c.priority_level === 'high').length,
    medium: complaints.filter((c) => c.priority_level === 'medium').length,
    low: complaints.filter((c) => c.priority_level === 'low').length
  };

  // Department counts
  const deptCounts = {};
  complaints.forEach((c) => {
    const dept = c.authority_name || 'General Municipal';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <div className="breadcrumb-row">
            <span>केंद्रीय सांख्यिकी / Municipal Analytics Cell</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">प्रशासनिक दक्षता रिपोर्ट / Governance Telemetry</span>
          </div>
          <div className="gov-seal-box" style={{ marginBottom: '0.5rem' }}>
            सार्वजनिक जवाबदेही एवं निवारण सांख्यिकी / PUBLIC ACCOUNTABILITY AUDIT
          </div>
          <h1 className="page-heading">Municipal Governance & Redressal Analytics</h1>
          <p className="page-subtitle">
            Authoritative performance metrics derived from municipal dockets, perceptual hash deduplication efficiency, and statutory SLA disposal rates.
          </p>
        </div>

        <Link to="/incidents" className="btn btn-primary">
          View Incident Register &rarr;
        </Link>
      </div>

      {/* KPI Metrics Grid */}
      <div className="analytics-kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">Active Ticket Load</span>
            <Layers size={16} className="text-sky-600" />
          </div>
          <div className="kpi-value">{total}</div>
          <div className="kpi-hint">
            <span>Deduplicated municipal tickets</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">Resolution Efficiency</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="kpi-value text-emerald-600">{resolutionRate}%</div>
          <div className="kpi-hint">
            <span>{resolvedCount} of {total} hazards resolved</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">Critical Public Hazards</span>
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="kpi-value text-red-600">{priorityCounts.critical}</div>
          <div className="kpi-hint">
            <span>Require immediate line dispatch</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">Duplicate Noise Prevented</span>
            <Users size={16} className="text-amber-600" />
          </div>
          <div className="kpi-value text-amber-600">{duplicatesMerged}</div>
          <div className="kpi-hint">
            <span>Merged via perceptual dHash & GPS</span>
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown Grid */}
      <div className="charts-grid">
        {/* Category Distribution */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Incident Volume by Category</h3>
            <span className="chart-badge">Live Triage Data</span>
          </div>
          <p className="chart-desc">
            Distribution of reported public hazards across civic domains.
          </p>

          <div className="bars-list">
            {Object.entries(categoryCounts).map(([catId, count]) => {
              const cat = getCategoryConfig(catId);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const CatIcon = cat.icon;

              return (
                <div key={catId} className="bar-row">
                  <div className="bar-meta-left">
                    <CatIcon size={14} style={{ color: cat.color }} />
                    <span className="bar-name">{cat.name}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                  <div className="bar-meta-right">
                    <span className="bar-count">{count}</span>
                    <span className="bar-pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Risk Priority Severity Mix</h3>
            <span className="chart-badge">Algorithmic Scoring</span>
          </div>
          <p className="chart-desc">
            Hazards prioritized using severity weight, report density, and duration.
          </p>

          <div className="bars-list">
            {Object.entries(priorityCounts).map(([level, count]) => {
              const prio = getPriorityConfig(level);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={level} className="bar-row">
                  <div className="bar-meta-left">
                    <span className="status-dot" style={{ backgroundColor: prio.color }}></span>
                    <span className="bar-name">{prio.label}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: prio.color }}
                    ></div>
                  </div>
                  <div className="bar-meta-right">
                    <span className="bar-count">{count}</span>
                    <span className="bar-pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Pipeline */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Operational Status Pipeline</h3>
            <span className="chart-badge">Triage Velocity</span>
          </div>
          <p className="chart-desc">
            Progress of incidents through municipal review and field repair cycles.
          </p>

          <div className="pipeline-steps">
            <div className="pipeline-step">
              <div className="pipeline-number">{submittedCount}</div>
              <div className="pipeline-label">Submitted</div>
              <div className="pipeline-sub">Awaiting verification</div>
            </div>
            <div className="pipeline-arrow">&rarr;</div>
            <div className="pipeline-step">
              <div className="pipeline-number text-sky-600">{underReviewCount}</div>
              <div className="pipeline-label">Under Review</div>
              <div className="pipeline-sub">Assigned to inspector</div>
            </div>
            <div className="pipeline-arrow">&rarr;</div>
            <div className="pipeline-step">
              <div className="pipeline-number text-amber-600">{inProgressCount}</div>
              <div className="pipeline-label">In Progress</div>
              <div className="pipeline-sub">Field repair active</div>
            </div>
            <div className="pipeline-arrow">&rarr;</div>
            <div className="pipeline-step">
              <div className="pipeline-number text-emerald-600">{resolvedCount}</div>
              <div className="pipeline-label">Resolved</div>
              <div className="pipeline-sub">Closed & audited</div>
            </div>
          </div>
        </div>

        {/* Department Workload */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Department Workload Distribution</h3>
            <span className="chart-badge">Routing Engine</span>
          </div>
          <p className="chart-desc">
            Automatic routing of tickets to dedicated municipal branches.
          </p>

          <div className="dept-workload-list">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={dept} className="dept-row-item">
                  <div className="dept-name-box">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="dept-name-text">{dept}</span>
                  </div>
                  <div className="dept-bar-group">
                    <div className="bar-track" style={{ height: '6px' }}>
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: '#0284c7' }}
                      ></div>
                    </div>
                  </div>
                  <span className="dept-count-badge">{count} tickets</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .analytics-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .analytics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .kpi-card {
          padding: 1.25rem;
        }
        .kpi-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .kpi-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .kpi-value {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-main);
          margin-bottom: 0.35rem;
        }
        .kpi-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .chart-card {
          padding: 1.5rem;
        }
        .chart-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }
        .chart-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .chart-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--primary);
          background: var(--primary-light);
          padding: 2px 7px;
          border-radius: 4px;
        }
        .chart-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .bars-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8125rem;
        }
        .bar-meta-left {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          width: 170px;
          flex-shrink: 0;
        }
        .bar-name {
          color: var(--text-main);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-track {
          flex: 1;
          height: 8px;
          background-color: var(--bg-subtle);
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .bar-meta-right {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          width: 60px;
          justify-content: flex-end;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .bar-count {
          font-weight: 700;
          color: var(--text-main);
        }
        .bar-pct {
          color: var(--text-muted);
        }
        .pipeline-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 0.5rem;
        }
        .pipeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .pipeline-number {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.35rem;
        }
        .pipeline-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 0.15rem;
        }
        .pipeline-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .pipeline-arrow {
          font-size: 1.25rem;
          color: var(--text-subtle);
        }
        .dept-workload-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .dept-row-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8125rem;
        }
        .dept-name-box {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          width: 180px;
          flex-shrink: 0;
        }
        .dept-name-text {
          color: var(--text-main);
          font-weight: 500;
        }
        .dept-bar-group {
          flex: 1;
        }
        .dept-count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-subtle);
          padding: 2px 7px;
          border-radius: 4px;
        }

        @media (max-width: 1024px) {
          .analytics-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .analytics-kpi-grid {
            grid-template-columns: 1fr;
          }
          .pipeline-steps {
            flex-direction: column;
            gap: 1rem;
          }
          .pipeline-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
