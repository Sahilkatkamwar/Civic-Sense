// client/src/modules/report/TrackComplaint.jsx
// Owner: Tanush (Complaint Tracking)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function TrackComplaint() {
  const { complaintId: urlComplaintId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(urlComplaintId || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const fetchComplaint = (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <span className="complaint-code">{complaint.id}</span>
                <span className={`badge badge-${complaint.priority_level}`}>
                  {complaint.priority_level} Priority (Score: {complaint.priority_score})
                </span>
                <span className={`badge badge-${complaint.status}`}>
                  {complaint.status.replace('_', ' ')}
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
                        Authenticity: {complaint.authenticity}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="photo-placeholder">No photo uploaded</div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline-section">
            <h3 style={{ marginBottom: '1.25rem' }}>Status & Resolution Timeline</h3>
            <div className="timeline">
              {complaint.status_history && complaint.status_history.map((step, idx) => (
                <div key={step.id || idx} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-top">
                      <span className="timeline-status badge badge-low">
                        {step.status.replace('_', ' ')}
                      </span>
                      <span className="timeline-time">
                        {new Date(step.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="timeline-note">{step.note}</p>
                  </div>
                </div>
              ))}
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
        .timeline-section {
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
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
        .timeline-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }
        .timeline-time {
          font-size: 0.75rem;
          color: #64748b;
        }
        .timeline-note {
          font-size: 0.9rem;
          color: #334155;
        }
      `}</style>
    </div>
  );
}
