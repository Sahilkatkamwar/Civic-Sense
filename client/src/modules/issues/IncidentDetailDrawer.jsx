// client/src/modules/issues/IncidentDetailDrawer.jsx
// Incident Evidence & Operational Action Drawer
import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  Users,
  MapPin,
  Camera,
  Video,
  ShieldAlert,
  Send,
  ThumbsUp
} from 'lucide-react';
import {
  getCategoryConfig,
  getPriorityConfig,
  getStatusConfig,
  formatFullDateTime
} from '../../utils/civicHelpers';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function IncidentDetailDrawer({
  incident,
  onClose,
  onStatusUpdated,
  onSupportAdded
}) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [supporting, setSupporting] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  if (!incident) return null;

  const catConfig = getCategoryConfig(incident.category_id);
  const prioConfig = getPriorityConfig(incident.priority_level);
  const statConfig = getStatusConfig(incident.status);

  const CategoryIcon = catConfig.icon;
  const StatusIcon = statConfig.icon;

  // Allowed transitions
  const allowedTransitions = incident.allowed_transitions || (
    incident.status === 'submitted' ? ['under_review', 'rejected'] :
    incident.status === 'under_review' ? ['in_progress', 'rejected'] :
    incident.status === 'in_progress' ? ['resolved', 'under_review', 'rejected'] :
    incident.status === 'resolved' ? ['under_review'] :
    ['under_review']
  );

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setStatusError('Please select a target status transition.');
      return;
    }

    setSubmittingStatus(true);
    setStatusError('');
    setStatusSuccess('');

    try {
      const res = await fetch(`${API_BASE}/api/complaints/${incident.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          note: statusNote.trim() || `Operational status transitioned to ${selectedStatus}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setStatusSuccess(`Status successfully updated to "${selectedStatus}". Audit log recorded.`);
      setSelectedStatus('');
      setStatusNote('');
      if (onStatusUpdated) {
        onStatusUpdated(data);
      }
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleSupportIncident = async () => {
    setSupporting(true);
    setSupportMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${incident.id}/support`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to support incident');
      }
      setSupportMessage(data.message || 'Support recorded! Priority updated.');
      if (onSupportAdded) {
        onSupportAdded(data);
      }
    } catch (err) {
      setSupportMessage(`Error: ${err.message}`);
    } finally {
      setSupporting(false);
    }
  };

  return (
    <div className="detail-drawer-root">
      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-header-left">
          <div
            className="drawer-cat-icon"
            style={{ backgroundColor: catConfig.bgColor, color: catConfig.color }}
          >
            <CategoryIcon size={20} />
          </div>
          <div>
            <div className="drawer-id-row">
              <span className="gov-seal-box" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                GOVT DOCKET
              </span>
              <span className="drawer-id">{incident.id}</span>
              <span className={`badge ${prioConfig.badgeClass}`}>
                {prioConfig.label}
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: statConfig.bgColor,
                  color: statConfig.color,
                  borderColor: statConfig.borderColor
                }}
              >
                <StatusIcon size={12} />
                {statConfig.label}
              </span>
            </div>
            <h3 className="drawer-title">{incident.category_name || catConfig.name}</h3>
          </div>
        </div>
        <button className="drawer-close-btn" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Location & Department Banner */}
        <div className="location-banner">
          <div className="loc-item">
            <MapPin size={15} className="loc-icon" />
            <span className="loc-text">{incident.address_text || 'Coordinates available'}</span>
          </div>
          <div className="loc-coords">
            GPS: {incident.latitude ? incident.latitude.toFixed(5) : '0.00000'},{' '}
            {incident.longitude ? incident.longitude.toFixed(5) : '0.00000'}
          </div>
          <div className="dept-row">
            <Building2 size={14} className="dept-icon" />
            <span>Assigned Department: <strong>{incident.authority_name || catConfig.department}</strong></span>
          </div>
        </div>

        {/* Priority & Score Card */}
        <div className="priority-info-card">
          <div className="prio-card-header">
            <div className="prio-score-display">
              <span className="prio-score-number" style={{ color: prioConfig.color }}>
                {incident.priority_score || 0}
              </span>
              <span className="prio-score-denom">/ 100</span>
            </div>
            <div className="prio-score-meta">
              <span className="prio-score-label">Priority Rating</span>
              <span className="prio-score-assessment">{prioConfig.description}</span>
            </div>
          </div>

          <div className="prio-meter-track">
            <div
              className="prio-meter-fill"
              style={{
                width: `${Math.min(incident.priority_score || 0, 100)}%`,
                backgroundColor: prioConfig.color
              }}
            ></div>
          </div>

          <div className="prio-stats-row">
            <div className="prio-stat-pill">
              <span className="ps-lbl">Citizen Reports:</span>
              <span className="ps-val">{incident.report_count || 1}</span>
            </div>
            <div className="prio-stat-pill">
              <span className="ps-lbl">Severity Weight:</span>
              <span className="ps-val">{incident.severity_weight || catConfig.severityWeight}/5</span>
            </div>
            <div className="prio-stat-pill">
              <span className="ps-lbl">Authenticity:</span>
              <span className="ps-val" style={{ textTransform: 'capitalize' }}>{incident.authenticity || 'Verified'}</span>
            </div>
          </div>
        </div>

        {/* Department Action Recommendation */}
        <div className="action-recommendation-box">
          <div className="rec-header">
            <ShieldAlert size={16} className="text-amber-600" />
            <span className="rec-title">Department Standard Action</span>
          </div>
          <p className="rec-text">{catConfig.recommendedAction}</p>
        </div>

        {/* Citizen Description & Photo Evidence */}
        <div className="evidence-section">
          <h4 className="section-mini-heading">Field Evidence</h4>
          <p className="description-text">{incident.description}</p>

          {incident.photo_path ? (
            <div className="photo-container">
              {/\.(webm|mp4|mov|ogg)$/i.test(incident.photo_path) || incident.photo_path.includes('video-') ? (
                <video
                  src={incident.photo_path.startsWith('http') ? incident.photo_path : `${API_BASE}${incident.photo_path.startsWith('/') ? '' : '/'}${incident.photo_path}`}
                  controls
                  playsInline
                  className="evidence-img"
                  style={{ maxHeight: '260px', width: '100%', objectFit: 'contain', background: '#000000' }}
                />
              ) : (
                <img
                  src={incident.photo_path.startsWith('http') ? incident.photo_path : `${API_BASE}${incident.photo_path.startsWith('/') ? '' : '/'}${incident.photo_path}`}
                  alt="Field evidence"
                  className="evidence-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="photo-tag">
                {/\.(webm|mp4|mov|ogg)$/i.test(incident.photo_path) || incident.photo_path.includes('video-') ? (
                  <>
                    <Video size={12} />
                    <span>Geotagged Video</span>
                  </>
                ) : (
                  <>
                    <Camera size={12} />
                    <span>Geotagged Photo</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="photo-placeholder">
              <Camera size={20} className="text-slate-400" />
              <span>No media provided with this submission</span>
            </div>
          )}

          <div className="meta-footer-info">
            <div className="meta-item">
              <Calendar size={13} />
              <span>Reported: {formatFullDateTime(incident.created_at)}</span>
            </div>
            <div className="meta-item">
              <Users size={13} />
              <span>Citizen Confirmations: <strong>{incident.report_count || 1}</strong></span>
            </div>
          </div>
        </div>

        {/* Proof of Resolution ("After" Photo) Preview if Resolved */}
        {incident.resolution_photo_path && (
          <div style={{ margin: '1rem 0', padding: '0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#065f46' }}>🏆 Verified Proof of Resolution ("After" Photo):</strong>
              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>AUDITED</span>
            </div>
            <img
              src={incident.resolution_photo_path.startsWith('http') ? incident.resolution_photo_path : `${API_BASE}${incident.resolution_photo_path.startsWith('/') ? '' : '/'}${incident.resolution_photo_path}`}
              alt="Resolution Proof"
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #10b981' }}
            />
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#047857' }}>
              <strong>Remarks:</strong> {incident.resolution_note || 'Official repair work completed.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: '#059669' }}>✅ {incident.confirm_count || 0} Confirmed Fixed</span>
              <span style={{ color: (incident.dispute_count > 0 ? '#dc2626' : '#64748b') }}>
                ⚠️ {incident.dispute_count || 0}/3 Disputed
              </span>
            </div>
          </div>
        )}

        {/* Support / Upvote verification button */}
        <div className="citizen-endorse-box">
          <div className="endorse-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span className="endorse-title">⚡ Community Endorsement</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '1px 6px', borderRadius: '999px' }}>
                🔥 {incident.report_count || 1} local residents affected
              </span>
            </div>
            <span className="endorse-sub">Directly boosts algorithmic priority without re-submitting</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSupportIncident}
            disabled={supporting || incident.status === 'resolved' || incident.status === 'rejected'}
            style={{ fontWeight: 700 }}
          >
            <ThumbsUp size={14} />
            {supporting ? 'Endorsing...' : `⚡ Impacts Me Too (+1)`}
          </button>
        </div>
        {supportMessage && (
          <div className="action-feedback-msg feedback-info">{supportMessage}</div>
        )}

        {/* Status Transition Control */}
        <div className="status-management-section">
          <h4 className="section-mini-heading">Triage Status Transition</h4>
          <p className="status-management-desc">
            Update operational state according to municipal dispatch protocol.
          </p>

          <form onSubmit={handleUpdateStatus} className="status-update-form">
            <div className="form-group">
              <label className="form-label">Target Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Select Allowed Next Transition...</option>
                {allowedTransitions.map((st) => (
                  <option key={st} value={st}>
                    &rarr; {getStatusConfig(st).label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Operational Note / Work Order ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Crew dispatched with repair truck #14"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            {statusError && (
              <div className="action-feedback-msg feedback-error">{statusError}</div>
            )}
            {statusSuccess && (
              <div className="action-feedback-msg feedback-success">{statusSuccess}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={submittingStatus || !selectedStatus}
            >
              <Send size={15} />
              {submittingStatus ? 'Updating Audit Log...' : 'Commit Status Update'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .detail-drawer-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-left: 1px solid var(--border);
          overflow-y: auto;
        }
        .drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
          background-color: #fafbfc;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .drawer-header-left {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .drawer-cat-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .drawer-id-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
        }
        .drawer-id {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .drawer-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.01em;
        }
        .drawer-close-btn {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.35rem;
          color: var(--text-muted);
          cursor: pointer;
        }
        .drawer-close-btn:hover {
          background: var(--bg-subtle);
          color: var(--text-main);
        }
        .drawer-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .location-banner {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.8125rem;
        }
        .loc-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-main);
          font-weight: 600;
        }
        .loc-icon {
          color: var(--primary);
          flex-shrink: 0;
        }
        .loc-coords {
          font-family: var(--font-mono);
          color: var(--text-muted);
          font-size: 0.75rem;
          padding-left: 1.4rem;
        }
        .dept-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-secondary);
          padding-top: 0.3rem;
          border-top: 1px dashed var(--border-strong);
        }
        .dept-icon {
          color: var(--text-muted);
        }
        .priority-info-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
          box-shadow: var(--shadow-xs);
        }
        .prio-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .prio-score-display {
          display: flex;
          align-items: baseline;
          gap: 0.15rem;
        }
        .prio-score-number {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }
        .prio-score-denom {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .prio-score-meta {
          display: flex;
          flex-direction: column;
        }
        .prio-score-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }
        .prio-score-assessment {
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .prio-meter-track {
          width: 100%;
          height: 6px;
          background: var(--bg-subtle);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.85rem;
        }
        .prio-meter-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .prio-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.4rem;
        }
        .prio-stat-pill {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          font-size: 0.7rem;
        }
        .ps-lbl {
          color: var(--text-muted);
        }
        .ps-val {
          font-weight: 700;
          color: var(--text-main);
        }
        .action-recommendation-box {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-md);
          padding: 0.85rem;
        }
        .rec-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.35rem;
        }
        .rec-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #92400e;
        }
        .rec-text {
          font-size: 0.825rem;
          color: #78350f;
          line-height: 1.45;
        }
        .evidence-section {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
        }
        .section-mini-heading {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          margin-bottom: 0.6rem;
        }
        .description-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.85rem;
        }
        .photo-container {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
          max-height: 220px;
          margin-bottom: 0.75rem;
        }
        .evidence-img {
          width: 100%;
          height: 100%;
          max-height: 220px;
          object-fit: cover;
          display: block;
        }
        .photo-tag {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .photo-placeholder {
          height: 80px;
          background-color: var(--bg-subtle);
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        .meta-footer-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .citizen-endorse-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius-md);
          padding: 0.75rem;
        }
        .endorse-left {
          display: flex;
          flex-direction: column;
        }
        .endorse-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #166534;
        }
        .endorse-sub {
          font-size: 0.72rem;
          color: #15803d;
        }
        .status-management-section {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
        }
        .status-management-desc {
          font-size: 0.775rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        .action-feedback-msg {
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          margin-bottom: 0.75rem;
        }
        .feedback-error {
          background-color: var(--critical-bg);
          color: var(--critical-text);
          border: 1px solid var(--critical-border);
        }
        .feedback-success {
          background-color: var(--resolved-bg);
          color: var(--resolved-text);
          border: 1px solid var(--resolved-border);
        }
        .feedback-info {
          background-color: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
      `}</style>
    </div>
  );
}
