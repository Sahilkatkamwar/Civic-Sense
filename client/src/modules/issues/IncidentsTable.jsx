// client/src/modules/issues/IncidentsTable.jsx
// Professional Municipal Incidents Data Table
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  ArrowUpDown,
  Eye,
  MapPin,
  Users,
  ExternalLink,
  Building2,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  getCategoryConfig,
  getPriorityConfig,
  getStatusConfig,
  formatRelativeTime,
  formatFullDateTime
} from '../../utils/civicHelpers';
import IncidentDetailDrawer from './IncidentDetailDrawer';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function IncidentsTable() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortField, setSortField] = useState('priority_score');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const [resComplaints, resCategories] = await Promise.all([
        fetch(`${API_BASE}/api/complaints?sort=priority`),
        fetch(`${API_BASE}/api/categories`)
      ]);
      const dataComplaints = resComplaints.ok ? await resComplaints.json() : [];
      const dataCategories = resCategories.ok ? await resCategories.json() : [];

      setComplaints(Array.isArray(dataComplaints) ? dataComplaints : []);
      setCategories(Array.isArray(dataCategories) ? dataCategories : []);
    } catch (err) {
      console.warn('Failed to load incidents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Sort
  const processedComplaints = complaints
    .filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterPriority !== 'all' && c.priority_level !== filterPriority) return false;
      if (filterCategory !== 'all' && c.category_id !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mId = c.id?.toLowerCase().includes(q);
        const mAddr = c.address_text?.toLowerCase().includes(q);
        const mDesc = c.description?.toLowerCase().includes(q);
        const mDept = c.authority_name?.toLowerCase().includes(q);
        if (!mId && !mAddr && !mDesc && !mDept) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div className="table-page-header">
        <div>
          <div className="breadcrumb-row">
            <span>केंद्रीय नगर निगम / Central Municipal Operations</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">सार्वजनिक शिकायत रजिस्टर / Ward Incident Register</span>
          </div>
          <h1 className="page-heading">Official Municipal Ward Incident Register</h1>
          <p className="page-subtitle">
            Statutory register of citizen-lodged grievances, verified duplicate tickets, and municipal inspection states under the Public Service Guarantee Act.
          </p>
        </div>

        <div className="table-header-actions">
          <Link to="/authority" className="btn btn-secondary">
            Authority Command
          </Link>
          <Link to="/report" className="btn btn-saffron">
            <Plus size={15} />
            Lodge Citizen Grievance
          </Link>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="table-filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by ID (CS-2026-...), street, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            className="table-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="table-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Risk</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            className="table-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchIncidents}
            title="Refresh Table"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="cursor-pointer">
                <div className="th-content">
                  <span>Incident ID</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Category & Hazard</th>
              <th>Location / Address</th>
              <th onClick={() => handleSort('priority_score')} className="cursor-pointer">
                <div className="th-content">
                  <span>Risk Score</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort('report_count')} className="cursor-pointer">
                <div className="th-content">
                  <span>Reports</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Status</th>
              <th>Department</th>
              <th onClick={() => handleSort('created_at')} className="cursor-pointer">
                <div className="th-content">
                  <span>Submitted</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <span style={{ color: 'var(--text-muted)' }}>Loading incident records...</span>
                </td>
              </tr>
            ) : processedComplaints.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <Layers className="empty-state-icon" size={32} />
                    <div className="empty-state-title">No incidents match the active filters</div>
                    <div className="empty-state-desc">
                      Reset your search query or filters to view all recorded municipal hazards.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              processedComplaints.map((item) => {
                const cat = getCategoryConfig(item.category_id);
                const prio = getPriorityConfig(item.priority_level);
                const stat = getStatusConfig(item.status);
                const CatIcon = cat.icon;
                const StatIcon = stat.icon;

                return (
                  <tr key={item.id} className="table-row-hover">
                    <td>
                      <span className="incident-id-mono">{item.id}</span>
                    </td>
                    <td>
                      <div className="table-cat-cell">
                        <div
                          className="table-cat-icon-badge"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          <CatIcon size={14} />
                        </div>
                        <div className="table-cat-meta">
                          <span className="table-cat-name">{item.category_name || cat.name}</span>
                          <span className="table-cat-snippet">{item.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="table-location-cell">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="table-loc-text">{item.address_text || 'Coordinates available'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-risk-cell">
                        <span className={`badge ${prio.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                          {prio.shortLabel} ({item.priority_score || 0})
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.report_count > 1 ? (
                        <span className="table-multi-reports-badge">
                          <Users size={11} />
                          {item.report_count} Verified
                        </span>
                      ) : (
                        <span className="table-single-report-badge">1 Citizen</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: stat.bgColor,
                          color: stat.color,
                          borderColor: stat.borderColor,
                          fontSize: '0.72rem'
                        }}
                      >
                        <StatIcon size={11} />
                        {stat.label}
                      </span>
                    </td>
                    <td>
                      <div className="table-dept-cell">
                        <Building2 size={12} className="text-slate-400" />
                        <span>{item.authority_name || cat.department}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-time-text" title={formatFullDateTime(item.created_at)}>
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedIncident(item)}
                          title="Open Evidence Drawer"
                        >
                          <Eye size={13} />
                          Inspect
                        </button>
                        <Link
                          to={`/track/${item.id}`}
                          className="btn btn-ghost btn-sm"
                          title="Open Public Tracking View"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-in Evidence Detail Drawer */}
      {selectedIncident && (
        <div className="table-drawer-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="table-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <IncidentDetailDrawer
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
              onStatusUpdated={() => {
                fetchIncidents();
              }}
              onSupportAdded={() => {
                fetchIncidents();
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        .table-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .breadcrumb-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        .page-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          max-width: 650px;
        }
        .table-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .table-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 380px;
        }
        .search-box .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }
        .search-box .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2rem;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          background: #ffffff;
        }
        .filter-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .table-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          color: var(--text-secondary);
          background-color: #ffffff;
        }
        .th-content {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .incident-id-mono {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary);
        }
        .table-cat-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          max-width: 280px;
        }
        .table-cat-icon-badge {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .table-cat-meta {
          display: flex;
          flex-direction: column;
        }
        .table-cat-name {
          font-weight: 600;
          font-size: 0.8125rem;
          color: var(--text-main);
        }
        .table-cat-snippet {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .table-location-cell {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          max-width: 200px;
        }
        .table-loc-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .table-multi-reports-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #fee2e2;
          color: #991b1b;
          font-weight: 700;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .table-single-report-badge {
          background: var(--bg-subtle);
          color: var(--text-muted);
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .table-dept-cell {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .table-time-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .table-actions-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.35rem;
        }
        .table-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
        }
        .table-drawer-panel {
          width: 480px;
          max-width: 100vw;
          height: 100%;
          background: #ffffff;
          box-shadow: var(--shadow-xl);
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .incidents-filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .filter-controls {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .table-select {
            width: 100%;
          }
          .search-box {
            min-width: unset;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
