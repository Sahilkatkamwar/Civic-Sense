// client/src/modules/report/TrackComplaint.jsx
// Owner: Tanush (Complaint Tracking)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

const STATUS_COLORS = {
  submitted: '#64748b',
  under_review: '#2563eb',
  in_progress: '#d97706',
  resolved: '#16a34a',
  rejected: '#dc2626'
};

export default function TrackComplaint() {
  const { complaintId: urlComplaintId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(urlComplaintId || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [supporting, setSupporting] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');

  const fetchComplaint = (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setSupportMsg('');

    fetch(`${API_BASE}/api/complaints/${id.trim()}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Complaint ID "${id}" was not found in our records. Please verify the format (e.g. CS-2026-00001).`);
          }
          throw new Error('Unable to connect to complaint service.');
        }
        return res.json();
      })
      .then((data) => {
        setComplaint(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setComplaint(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (urlComplaintId) {
      setSearchId(urlComplaintId);
      fetchComplaint(urlComplaintId);
    }
  }, [urlComplaintId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/track/${searchId.trim()}`);
      fetchComplaint(searchId.trim());
    }
  };

  // "I face this too" support handler
  const handleSupport = async () => {
    if (!complaint || supporting) return;
    setSupporting(true);
    setSupportMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaint.id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add support');
      }

      setSupportMsg(data.message);
      // Refresh complaint data
      fetchComplaint(complaint.id);
    } catch (err) {
      setSupportMsg(`Error: ${err.message}`);
    } finally {
      setSupporting(false);
    }
  };

  // Determine which timeline step is "active" (latest)
  const getTimelineStepStyle = (step, idx, total) => {
    const isLatest = idx === total - 1;
    const color = STATUS_COLORS[step.status] || '#64748b';
    return { color, isLatest };
  };

  return (
    <div className="container page-wrapper">
      <div className="track-header">
        <span className="badge badge-low">Citizen Verification</span>
        <h1 className="page-title">Track Complaint Status</h1>
        <p className="page-subtitle">
          Enter your unique tracking token to inspect live resolution progress, department actions, and priority history.
        </p>
      </div>

      <div className="track-search-box card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="form-control track-input"
            placeholder="Enter Complaint ID (e.g. CS-2026-00001)..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Track Status'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-state text-center" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Retrieving complaint records and status history...</p>
        </div>
      )}

      {error && (
        <div className="card error-card" style={{ maxWidth: '680px', margin: '2rem auto', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔍❌</span>
          <h3 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Complaint Not Found</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{error}</p>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/report" className="btn btn-primary btn-sm">
              File a New Complaint
            </Link>
          </div>
        </div>
      )}

      {complaint && (
        <div className="complaint-details card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
          {/* Header Bar */}
          <div className="det-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <span className="complaint-code">{complaint.id}</span>
                <span className={`badge badge-${complaint.priority_level}`}>
                  {complaint.priority_level} Priority (Score: {complaint.priority_score})
                </span>
                <span className={`badge badge-${complaint.status === 'resolved' ? 'success' : complaint.status === 'rejected' ? 'critical' : 'low'}`}>
                  {STATUS_ICONS[complaint.status]} {complaint.status.replace('_', ' ')}
                </span>
              </div>
              <span className="complaint-meta">
                Filed on {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>

            <div className="report-count-pill">
              <span className="count-number">{complaint.report_count}</span>
              <span className="count-label">Citizens Reported</span>
            </div>
          </div>

          {/* Grid Overview */}
          <div className="grid-2 det-grid">
            <div>
              <div className="info-block">
                <span className="label">Category:</span>
                <p className="val">
                  {complaint.category_icon} {complaint.category_name || complaint.category_id}
                </p>
              </div>
              <div className="info-block">
                <span className="label">Responsible Authority:</span>
                <p className="val">{complaint.authority_name || 'Municipal Works'}</p>
                <span className="sub-val">{complaint.authority_department}</span>
              </div>
              <div className="info-block">
                <span className="label">Location:</span>
                <p className="val">{complaint.address_text || `${complaint.latitude}, ${complaint.longitude}`}</p>
              </div>
              <div className="info-block">
                <span className="label">Description:</span>
                <p className="val-desc">{complaint.description}</p>
              </div>
            </div>

            <div>
              {complaint.photo_path ? (
                <div className="photo-box">
                  <span className="label">Citizen Photo Evidence</span>
                  <img
                    src={`${API_BASE}${complaint.photo_path}`}
                    alt="Complaint photo"
                    className="complaint-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {complaint.authenticity && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className={`badge badge-${complaint.authenticity === 'verified' ? 'success' : 'warning'}`}>
                        {complaint.authenticity === 'verified' ? '✅' : '⚠️'} Authenticity: {complaint.authenticity}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="photo-placeholder">No photo uploaded</div>
              )}

              {/* Mini Map showing complaint location */}
              {complaint.latitude && complaint.longitude && (
                <div style={{ marginTop: '1rem' }}>
                  <span className="label">Location on Map</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <MapContainer
                      center={[complaint.latitude, complaint.longitude]}
                      zoom={16}
                      style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[complaint.latitude, complaint.longitude]} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* "I face this too" Support Button */}
          {complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
            <div className="support-section">
              <button
                className="btn btn-outline support-btn"
                onClick={handleSupport}
                disabled={supporting}
              >
                {supporting ? '⏳ Adding your support...' : '🤝 I Face This Too — Add My Report'}
              </button>
              <p className="support-info">
                Click to add your voice. More citizen reports = higher priority for authorities.
              </p>
              {supportMsg && (
                <div className={`support-msg ${supportMsg.startsWith('Error') ? 'err' : 'ok'}`}>
                  {supportMsg}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="timeline-section">
            <h3 style={{ marginBottom: '1.25rem' }}>Status & Resolution Timeline</h3>
            <div className="timeline">
              {complaint.status_history && complaint.status_history.map((step, idx) => {
                const { color, isLatest } = getTimelineStepStyle(step, idx, complaint.status_history.length);
                return (
                  <div key={step.id || idx} className={`timeline-item ${isLatest ? 'timeline-latest' : ''}`}>
                    <div className="timeline-marker" style={{ background: color }}></div>
                    <div className="timeline-content">
                      <div className="timeline-top">
                        <span className="timeline-status-badge" style={{ background: color + '18', color: color, borderColor: color + '40' }}>
                          {STATUS_ICONS[step.status] || '📋'} {step.status.replace('_', ' ')}
                        </span>
                        <span className="timeline-time">
                          {new Date(step.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="timeline-note">{step.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .track-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .track-search-box {
          max-width: 600px;
          margin: 0 auto 2rem;
          padding: 1.25rem;
        }
        .search-form {
          display: flex;
          gap: 0.75rem;
        }
        .track-input {
          font-family: monospace;
          font-size: 1.1rem !important;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .complaint-code {
          font-size: 1.4rem;
          font-weight: 800;
          font-family: monospace;
          color: var(--primary);
        }
        .complaint-meta {
          font-size: 0.8rem;
          color: #64748b;
        }
        .det-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }
        .report-count-pill {
          background: #eff6ff;
          border: 1px solid var(--primary-border);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          text-align: center;
          flex-shrink: 0;
        }
        .count-number {
          display: block;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--primary);
        }
        .count-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
        }
        .det-grid {
          margin-bottom: 2rem;
        }
        .info-block {
          margin-bottom: 1rem;
        }
        .label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.2rem;
        }
        .val {
          font-weight: 600;
          color: var(--text-main);
          font-size: 1.05rem;
        }
        .sub-val {
          font-size: 0.8rem;
          color: #64748b;
        }
        .val-desc {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.5;
        }
        .complaint-img {
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          margin-top: 0.35rem;
        }
        .photo-placeholder {
          height: 160px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: #94a3b8;
        }
        .support-section {
          padding: 1.25rem 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .support-btn {
          font-size: 1rem;
          padding: 0.75rem 1.5rem;
        }
        .support-info {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
        }
        .support-msg {
          margin-top: 0.75rem;
          padding: 0.5rem 0.9rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          display: inline-block;
        }
        .support-msg.ok {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .support-msg.err {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        .timeline-section {
          padding-top: 1.5rem;
        }
        .timeline {
          position: relative;
          padding-left: 1.5rem;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: #e2e8f0;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .timeline-item.timeline-latest {
          margin-bottom: 0;
        }
        .timeline-marker {
          position: absolute;
          left: -1.5rem;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--primary);
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 1px #cbd5e1;
        }
        .timeline-item.timeline-latest .timeline-marker {
          width: 16px;
          height: 16px;
          box-shadow: 0 0 0 2px currentColor, 0 0 8px rgba(30,64,175,0.25);
        }
        .timeline-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .timeline-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
        }
        .timeline-time {
          font-size: 0.75rem;
          color: #64748b;
        }
        .timeline-note {
          font-size: 0.9rem;
          color: #334155;
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
        @media (max-width: 640px) {
          .det-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .search-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
