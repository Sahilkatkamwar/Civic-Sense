// client/src/modules/report/AuthorityDashboard.jsx
// Owner: Tanush (Authority Dashboard)
import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchQueue = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/authority/complaints`)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data);
        if (data.length > 0 && !selectedComplaint) {
          setSelectedComplaint(data[0]);
        } else if (selectedComplaint) {
          const updated = data.find((c) => c.id === selectedComplaint.id);
          if (updated) setSelectedComplaint(updated);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching authority queue:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
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

      setMessage(`Status updated to ${newStatus} successfully!`);
      setStatusNote('');
      fetchQueue();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredList = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority_level !== filterPriority) return false;
    return true;
  });

  return (
    <div className="container page-wrapper">
      <div className="auth-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
          <span className="badge badge-critical">Official Portal</span>
          <span className="badge badge-low">Simulation Mode</span>
        </div>
        <h1 className="page-title">Municipal Authority Command Center</h1>
        <p className="page-subtitle">
          Real-time incident dispatch, triage queue sorted by dynamic algorithmic priority, and citizen resolution workflow.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card toolbar">
        <div className="toolbar-group">
          <label>Status Filter:</label>
          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label>Priority Filter:</label>
          <select
            className="form-select form-select-sm"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (70+)</option>
            <option value="high">High (40-69)</option>
            <option value="medium">Medium (20-39)</option>
            <option value="low">Low (&lt;20)</option>
          </select>
        </div>

        <button onClick={fetchQueue} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          🔄 Refresh Queue
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
                      onClick={() => {
                        setSelectedComplaint(c);
                        setMessage('');
                      }}
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
                        <span className={`badge badge-low status-pill`}>{c.status}</span>
                        {c.authenticity === 'suspicious' && (
                          <span className="badge badge-warning">Suspicious Photo</span>
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge badge-${selectedComplaint.priority_level}`}>
                      {selectedComplaint.priority_level} (Score: {selectedComplaint.priority_score})
                    </span>
                    <span className="badge badge-low">{selectedComplaint.status}</span>
                  </div>
                </div>

                {message && (
                  <div className={`alert-msg ${message.startsWith('Error') ? 'alert-err' : 'alert-ok'}`}>
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
                      {selectedComplaint.authenticity}
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
                        src={`${API_BASE}${selectedComplaint.photo_path}`}
                        alt="Evidence"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
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
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusUpdate('under_review')}
                      disabled={updating || selectedComplaint.status === 'under_review'}
                      title={selectedComplaint.status === 'under_review' ? 'Already in this status' : ''}
                    >
                      {selectedComplaint.status === 'in_progress' ? '↩ Return to Review' : 'Mark Under Review'}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={updating || selectedComplaint.status === 'in_progress' || selectedComplaint.status === 'resolved'}
                    >
                      Dispatch / In Progress
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: '#166534', borderColor: '#86efac', background: '#dcfce7' }}
                      onClick={() => handleStatusUpdate('resolved')}
                      disabled={updating || selectedComplaint.status === 'resolved'}
                    >
                      Mark Resolved
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={updating || selectedComplaint.status === 'rejected'}
                    >
                      Reject Complaint
                    </button>
                  </div>
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
        .toolbar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
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
          grid-template-columns: 1fr 1.2fr;
          gap: 1.5rem;
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
        @media (max-width: 900px) {
          .auth-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
