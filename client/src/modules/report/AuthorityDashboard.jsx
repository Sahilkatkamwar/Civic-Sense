// client/src/modules/report/AuthorityDashboard.jsx
// Owner: Tanush (Authority Dashboard)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_ICONS = {
  submitted: '📝',
  under_review: '🔍',
  in_progress: '🔧',
  resolved: '✅',
  rejected: '❌'
};

/**
 * Status transition buttons based on current status.
 * Per spec: submitted → under_review → in_progress → resolved (or rejected at any non-terminal step)
 */
const STATUS_ACTIONS = {
  submitted: [
    { status: 'under_review', label: 'Accept & Review', style: 'primary' },
    { status: 'rejected', label: 'Reject', style: 'danger' }
  ],
  under_review: [
    { status: 'in_progress', label: 'Dispatch / In Progress', style: 'primary' },
    { status: 'rejected', label: 'Reject', style: 'danger' }
  ],
  in_progress: [
    { status: 'resolved', label: 'Mark Resolved', style: 'success' },
    { status: 'under_review', label: '↩ Return to Review', style: 'secondary' },
    { status: 'rejected', label: 'Reject', style: 'danger' }
  ],
  resolved: [
    { status: 'under_review', label: '↩ Reopen for Review', style: 'secondary' }
  ],
  rejected: [
    { status: 'under_review', label: '↩ Reopen for Review', style: 'secondary' }
  ]
};

export default function AuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('Categories loading paused:', err.message));
  }, []);

  const fetchQueue = (showLoading = true) => {
    if (showLoading) setLoading(true);
    fetch(`${API_BASE}/api/authority/complaints`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setComplaints(list);
        if (list.length > 0 && !selectedComplaint) {
          selectComplaint(list[0]);
        } else if (selectedComplaint) {
          const updated = list.find((c) => c.id === selectedComplaint.id);
          if (updated) selectComplaint(updated);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching authority queue:', err);
        setLoading(false);
      });
  };

  // Fetch full detail (with status_history) for selected complaint
  const selectComplaint = (c) => {
    setSelectedComplaint(c);
    setMessage('');

    fetch(`${API_BASE}/api/complaints/${c.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDetailData(data))
      .catch(() => setDetailData(null));
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/authority/complaints`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setComplaints(list);
        if (list.length > 0) {
          setSelectedComplaint(list[0]);
          fetch(`${API_BASE}/api/complaints/${list[0].id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setDetailData(d))
            .catch(() => setDetailData(null));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Authority queue loading paused:', err.message);
        setLoading(false);
      });
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedComplaint) return;
    setUpdating(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/complaints/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || `Status changed to ${newStatus} by field officer`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setMessage(`✅ Status updated to "${newStatus.replace('_', ' ')}" successfully!`);
      setStatusNote('');
      fetchQueue();
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Client-side filtering
  const filteredList = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category_id !== filterCategory) return false;
    if (filterPriority !== 'all' && c.priority_level !== filterPriority) return false;
    return true;
  });

  // Count stats for quick summary
  const stats = {
    total: complaints.length,
    critical: complaints.filter(c => c.priority_level === 'critical').length,
    suspicious: complaints.filter(c => c.authenticity === 'suspicious').length,
    pending: complaints.filter(c => c.status === 'submitted').length,
  };

  const currentActions = selectedComplaint ? (STATUS_ACTIONS[selectedComplaint.status] || []) : [];

  return (
    <div className="container page-wrapper">
      <div className="auth-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <span className="gov-seal-box">सक्षम प्राधिकारी नियंत्रण कक्ष / MUNICIPAL DISPATCH DESK</span>
          <span className="badge badge-gov">PUBLIC SERVICE GUARANTEE ACT ALIGNED</span>
        </div>
        <h1 className="page-title">Municipal Authority Command & Dispatch Center</h1>
        <p className="page-subtitle">
          Centralized administrative command for municipal ward officers and field engineers. Review photographic evidence, assign field repair dispatches, and record statutory resolution audits.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
          <Link to="/authority/risk-radar" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎯 Open Risk Radar</span>
          </Link>
          <Link to="/authority/alerts" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📢 Manage Alerts</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="stats-bar">
        <div className="stat-chip">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-chip stat-critical">
          <span className="stat-value">{stats.critical}</span>
          <span className="stat-label">Critical</span>
        </div>
        <div className="stat-chip stat-pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        {stats.suspicious > 0 && (
          <div className="stat-chip stat-suspicious">
            <span className="stat-value">{stats.suspicious}</span>
            <span className="stat-label">Suspicious</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card toolbar">
        <div className="toolbar-group">
          <label>Status:</label>
          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">📝 Submitted</option>
            <option value="under_review">🔍 Under Review</option>
            <option value="in_progress">🔧 In Progress</option>
            <option value="resolved">✅ Resolved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label>Category:</label>
          <select
            className="form-select form-select-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label>Priority:</label>
          <select
            className="form-select form-select-sm"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">🔴 Critical (70+)</option>
            <option value="high">🟠 High (40-69)</option>
            <option value="medium">🟡 Medium (20-39)</option>
            <option value="low">⚪ Low (&lt;20)</option>
          </select>
        </div>

        <button onClick={fetchQueue} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading authority triage queue...</p>
        </div>
      ) : (
        <div className="auth-layout">
          {/* Left: Queue Table / List */}
          <div className="card queue-pane">
            <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Incident Queue ({filteredList.length})</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sorted by Priority Score</span>
            </h3>

            {filteredList.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '1rem 0' }}>No complaints match the selected filters.</p>
            ) : (
              <div className="complaint-list">
                {filteredList.map((c) => {
                  const isSelected = selectedComplaint && selectedComplaint.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`queue-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectComplaint(c)}
                    >
                      <div className="queue-item-header">
                        <span className="queue-id">{c.id}</span>
                        <span className={`badge badge-${c.priority_level}`}>
                          {c.priority_level} ({c.priority_score})
                        </span>
                      </div>

                      <div className="queue-item-body">
                        <span className="queue-cat">{c.category_icon} {c.category_name}</span>
                        <p className="queue-desc">{c.description}</p>
                      </div>

                      <div className="queue-item-footer">
                        <span className="queue-reports">👥 {c.report_count} reports</span>
                        <span className={`badge badge-${c.status === 'resolved' ? 'success' : c.status === 'rejected' ? 'critical' : 'low'}`}>
                          {STATUS_ICONS[c.status]} {c.status.replace('_', ' ')}
                        </span>
                        {c.authenticity === 'suspicious' && (
                          <span className="badge badge-warning">⚠️ Suspicious</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Complaint Detail & Status Update */}
          <div className="card detail-pane">
            {selectedComplaint ? (
              <div>
                <div className="detail-pane-header">
                  <div>
                    <h2 style={{ fontSize: '1.4rem' }}>{selectedComplaint.id}</h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Registered: {new Date(selectedComplaint.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${selectedComplaint.priority_level}`}>
                      {selectedComplaint.priority_level} (Score: {selectedComplaint.priority_score})
                    </span>
                    <span className={`badge badge-${selectedComplaint.status === 'resolved' ? 'success' : selectedComplaint.status === 'rejected' ? 'critical' : 'low'}`}>
                      {STATUS_ICONS[selectedComplaint.status]} {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {message && (
                  <div className={`alert-msg ${message.startsWith('❌') ? 'alert-err' : 'alert-ok'}`}>
                    {message}
                  </div>
                )}

                <div className="detail-fields">
                  <div className="field-row">
                    <strong>Category:</strong>
                    <span>{selectedComplaint.category_icon} {selectedComplaint.category_name}</span>
                  </div>
                  <div className="field-row">
                    <strong>Department:</strong>
                    <span>{selectedComplaint.authority_name} &bull; {selectedComplaint.authority_department}</span>
                  </div>
                  <div className="field-row">
                    <strong>Location:</strong>
                    <span>{selectedComplaint.address_text || `${selectedComplaint.latitude}, ${selectedComplaint.longitude}`}</span>
                  </div>
                  <div className="field-row">
                    <strong>Citizen Reports:</strong>
                    <span>{selectedComplaint.report_count} citizen(s) have confirmed this incident</span>
                  </div>
                  <div className="field-row">
                    <strong>Photo Authenticity:</strong>
                    <span className={`badge badge-${selectedComplaint.authenticity === 'verified' ? 'success' : 'warning'}`}>
                      {selectedComplaint.authenticity === 'verified' ? '✅' : '⚠️'} {selectedComplaint.authenticity}
                    </span>
                  </div>
                  <div className="field-row">
                    <strong>Description:</strong>
                    <p style={{ marginTop: '0.25rem', color: '#334155' }}>{selectedComplaint.description}</p>
                  </div>
                </div>

                {/* Photo Preview */}
                {selectedComplaint.photo_path && (
                  <div style={{ margin: '1rem 0' }}>
                    <strong>Attached Photo Evidence:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={selectedComplaint.photo_path.startsWith('http') ? selectedComplaint.photo_path : `${API_BASE}${selectedComplaint.photo_path.startsWith('/') ? '' : '/'}${selectedComplaint.photo_path}`}
                        alt="Evidence"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {/* Map */}
                {selectedComplaint.latitude && selectedComplaint.longitude && (
                  <div style={{ margin: '1rem 0' }}>
                    <strong>Location on Map:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      <MapContainer
                        key={selectedComplaint.id}
                        center={[selectedComplaint.latitude, selectedComplaint.longitude]}
                        zoom={16}
                        style={{ height: '180px', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[selectedComplaint.latitude, selectedComplaint.longitude]} />
                      </MapContainer>
                    </div>
                  </div>
                )}

                {/* Status History */}
                {detailData && detailData.status_history && detailData.status_history.length > 0 && (
                  <div style={{ margin: '1rem 0', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
                    <strong>Status History:</strong>
                    <div className="mini-timeline">
                      {detailData.status_history.map((step, idx) => (
                        <div key={step.id || idx} className="mini-timeline-item">
                          <span className="mini-step-status">
                            {STATUS_ICONS[step.status]} {step.status.replace('_', ' ')}
                          </span>
                          <span className="mini-step-time">{new Date(step.created_at).toLocaleString()}</span>
                          <span className="mini-step-note">{step.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Transition Control */}
                <div className="action-control-box">
                  <h4>Officer Status Action</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0.75rem' }}>
                    Current workflow stage: <strong style={{ textTransform: 'uppercase' }}>{selectedComplaint.status.replace('_', ' ')}</strong>
                  </p>

                  <div style={{ margin: '0.75rem 0' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add an officer note or dispatch resolution remarks..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </div>

                  <div className="status-buttons">
                    {currentActions.map((action) => {
                      let btnClass = 'btn btn-sm ';
                      if (action.style === 'primary') btnClass += 'btn-primary';
                      else if (action.style === 'danger') btnClass += 'btn-danger';
                      else if (action.style === 'success') btnClass += 'btn-outline';
                      else btnClass += 'btn-secondary';

                      const successStyle = action.style === 'success'
                        ? { color: '#166534', borderColor: '#86efac', background: '#dcfce7' }
                        : {};

                      return (
                        <button
                          key={action.status}
                          className={btnClass}
                          style={successStyle}
                          onClick={() => handleStatusUpdate(action.status)}
                          disabled={updating}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  {currentActions.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No further status transitions available for this state.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8' }}>Select a complaint from the queue to view details and update its status.</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .stats-bar {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .stat-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.6rem 1.25rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          min-width: 80px;
        }
        .stat-chip .stat-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .stat-chip .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-muted);
        }
        .stat-critical .stat-value { color: #dc2626; }
        .stat-critical { border-color: #fca5a5; background: #fef2f2; }
        .stat-pending .stat-value { color: #2563eb; }
        .stat-pending { border-color: var(--primary-border); background: #eff6ff; }
        .stat-suspicious .stat-value { color: #d97706; }
        .stat-suspicious { border-color: #fde047; background: #fef9c3; }
        .toolbar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .auth-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 1.5rem;
          width: 100%;
        }
        .queue-pane, .detail-pane {
          min-width: 0;
        }
        .queue-pane {
          max-height: 800px;
          overflow-y: auto;
        }
        .queue-item {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .queue-item:hover {
          border-color: var(--primary);
          background: #f8fafc;
        }
        .queue-item.selected {
          border-color: var(--primary);
          background: #eff6ff;
          box-shadow: 0 0 0 1px var(--primary);
        }
        .queue-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .queue-id {
          font-family: monospace;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .queue-cat {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);
        }
        .queue-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin: 0.25rem 0 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .queue-item-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
          flex-wrap: wrap;
        }
        .detail-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .field-row {
          font-size: 0.9rem;
          margin-bottom: 0.6rem;
        }
        .field-row strong {
          display: inline-block;
          width: 140px;
          color: #475569;
        }
        .action-control-box {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }
        .status-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .alert-msg {
          padding: 0.6rem 0.9rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .alert-ok {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .alert-err {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        .mini-timeline {
          margin-top: 0.5rem;
        }
        .mini-timeline-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.825rem;
          display: flex;
          gap: 0.75rem;
          align-items: baseline;
          flex-wrap: wrap;
        }
        .mini-timeline-item:last-child {
          border-bottom: none;
        }
        .mini-step-status {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          min-width: 110px;
        }
        .mini-step-time {
          font-size: 0.7rem;
          color: #94a3b8;
          min-width: 140px;
        }
        .mini-step-note {
          color: #475569;
          flex: 1;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .auth-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stats-bar {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .stat-chip {
            min-width: unset;
            padding: 0.5rem;
          }
          .toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          .toolbar-group {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .field-row strong {
            display: block;
            width: 100%;
            margin-bottom: 0.2rem;
          }
          .status-buttons {
            flex-direction: column;
          }
          .status-buttons .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
