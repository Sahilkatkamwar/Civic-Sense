// client/src/modules/report/TrackComplaint.jsx
// Real-Time Citizen Tracking & Timeline Audit
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  ThumbsUp,
  Camera,
  Video,
  History,
  ShieldCheck,
  AlertTriangle,
  Check
} from 'lucide-react';
import {
  getCategoryConfig,
  getPriorityConfig,
  getStatusConfig,
  formatFullDateTime
} from '../../utils/civicHelpers';
import BeforeAfterSlider from './BeforeAfterSlider';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper to get or generate anonymous client ID
function getClientId() {
  let id = localStorage.getItem('cs_client_id');
  if (!id) {
    id = 'client_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('cs_client_id', id);
  }
  return id;
}

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted', sub: 'Logged to queue' },
  { key: 'under_review', label: 'Under Review', sub: 'Assigned to field unit' },
  { key: 'in_progress', label: 'In Progress', sub: 'Active repair crew' },
  { key: 'resolved', label: 'Resolved', sub: 'Audited & closed' }
];

export default function TrackComplaint() {
  const { complaintId: urlComplaintId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(urlComplaintId || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(Boolean(urlComplaintId));
  const [error, setError] = useState(null);
  const [supporting, setSupporting] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [hasEndorsed, setHasEndorsed] = useState(false);

  // Citizen Verification State
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [userVote, setUserVote] = useState(null); // 'confirm' | 'dispute' | null

  const sampleIds = ['CS-2026-00001', 'CS-2026-00002', 'CS-2026-00003', 'CS-2026-00004'];

  const fetchComplaint = (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);
    setSupportMsg('');
    setVerifyMsg('');

    const clientId = getClientId();
    fetch(`${API_BASE}/api/complaints/${id.trim()}?clientId=${clientId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Complaint ID "${id}" was not found in our records. Please verify the format (e.g. CS-2026-00001).`);
          }
          throw new Error('Unable to connect to municipal complaint service.');
        }
        return res.json();
      })
      .then((data) => {
        setComplaint(data);
        if (data.user_verification) {
          setUserVote(data.user_verification);
        } else {
          const localVote = localStorage.getItem('cs_vote_' + data.id);
          if (localVote) setUserVote(localVote);
        }

        if (data.user_endorsed) {
          setHasEndorsed(true);
        } else {
          const localEndorsed = localStorage.getItem('cs_endorsed_' + data.id);
          if (localEndorsed) setHasEndorsed(true);
        }

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
    }
  };

  const handleSupport = async () => {
    if (!complaint || supporting) return;
    setSupporting(true);
    setSupportMsg('');

    try {
      const clientId = getClientId();
      const res = await fetch(`${API_BASE}/api/complaints/${complaint.id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add confirmation');
      }
      setHasEndorsed(true);
      localStorage.setItem('cs_endorsed_' + complaint.id, 'true');
      setSupportMsg(data.message || 'Thank you! Your endorsement has been counted.');
      fetchComplaint(complaint.id);
    } catch (err) {
      setSupportMsg(`Error: ${err.message}`);
    } finally {
      setSupporting(false);
    }
  };

  const handleVerify = async (action) => {
    if (!complaint || verifying) return;
    setVerifying(true);
    setVerifyMsg('');

    try {
      const clientId = getClientId();
      const res = await fetch(`${API_BASE}/api/complaints/${complaint.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, clientId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record verification');
      }

      setUserVote(action);
      localStorage.setItem('cs_vote_' + complaint.id, action);
      setVerifyMsg(data.message);
      fetchComplaint(complaint.id);
    } catch (err) {
      setVerifyMsg(`❌ ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const catConfig = complaint ? getCategoryConfig(complaint.category_id) : null;
  const prioConfig = complaint ? getPriorityConfig(complaint.priority_level) : null;
  const statConfig = complaint ? getStatusConfig(complaint.status) : null;
  const CatIcon = catConfig ? catConfig.icon : null;
  const StatIcon = statConfig ? statConfig.icon : null;

  // Determine current step index
  const currentStepIndex =
    complaint?.status === 'resolved' ? 4 :
    complaint?.status === 'in_progress' ? 3 :
    complaint?.status === 'under_review' ? 2 :
    complaint?.status === 'submitted' ? 1 :
    0;

  return (
    <div className="container page-wrapper">
      {/* Search Bar Header */}
      <div className="track-header">
        <div className="breadcrumb-row">
          <span>नागरिक सेवाएं / Citizen Services</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">शिकायत स्थिति जांच / Grievance Redressal Tracker</span>
        </div>
        <div className="gov-seal-box" style={{ marginBottom: '0.65rem' }}>
          केन्द्रीय लोक शिकायत निवारण एवं निगरानी प्रणाली / CPGRAMS COMPLIANT
        </div>
        <h1 className="page-heading">Track Public Grievance Status (शिकायत स्थिति जांचें)</h1>
        <p className="page-subtitle">
          Official statutory grievance docket lookup. View verified photographic evidence, assigned municipal ward officer, and complete audited resolution lifecycle.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="track-search-form">
          <div className="search-bar-wrap">
            <Search size={18} className="search-bar-icon" />
            <input
              type="text"
              className="search-bar-input"
              placeholder="Enter Complaint ID (e.g., CS-2026-00001)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Searching Registry...' : 'Track Status'}
          </button>
        </form>

        {/* Sample quick tags */}
        <div className="sample-tags-row">
          <span className="sample-label">Sample Active Records:</span>
          {sampleIds.map((id) => (
            <button
              key={id}
              type="button"
              className="sample-tag-btn"
              onClick={() => {
                setSearchId(id);
                navigate(`/track/${id}`);
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card track-error-card">
          <AlertOctagon size={28} className="text-red-500 mb-2" />
          <h3 className="error-title">Incident Record Not Found</h3>
          <p className="error-desc">{error}</p>
          <div className="error-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchId('CS-2026-00001');
                navigate('/track/CS-2026-00001');
              }}
            >
              Try Sample Record CS-2026-00001
            </button>
            <Link to="/report" className="btn btn-primary btn-sm">
              Log a New Complaint
            </Link>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !complaint && (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving incident telemetry from database...</p>
        </div>
      )}

      {/* Complaint details */}
      {complaint && (
        <div className="track-result-grid">
          {/* Left Column: Progress Stepper, Metadata & Audit History */}
          <div className="track-left-col">
            {/* Status Stepper Card */}
            <div className="card track-stepper-card">
              <div className="stepper-header">
                <div>
                  <span className="stepper-id-label">Official Record Code</span>
                  <div className="stepper-id-val">{complaint.id}</div>
                </div>
                <div className="stepper-status-badge" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${prioConfig.badgeClass}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    {prioConfig.label} ({complaint.priority_score || 0})
                  </span>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: statConfig.bgColor,
                      color: statConfig.color,
                      borderColor: statConfig.borderColor,
                      fontSize: '0.8rem',
                      padding: '4px 10px'
                    }}
                  >
                    <StatIcon size={14} />
                    {statConfig.label}
                  </span>
                </div>
              </div>

              {/* Step indicator */}
              <div className="stepper-progress-bar">
                {PIPELINE_STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex > idx + 1;
                  const isCurrent = currentStepIndex === idx + 1;

                  return (
                    <div
                      key={step.key}
                      className={`step-milestone ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}
                    >
                      <div className="step-circle">
                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span className="step-label-main">{step.label}</span>
                      <span className="step-label-sub">{step.sub}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proof of Resolution & Citizen Verification Card */}
            {(complaint.resolution_photo_path || complaint.status === 'resolved') && (
              <div className="card proof-card" style={{ marginBottom: '1.5rem', border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} className="text-emerald-600" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>
                      Proof of Resolution & Citizen Audit (नागरिक सत्यापन)
                    </h3>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    STATUTORY REPAIR AUDIT
                  </span>
                </div>

                {complaint.dispute_reopened === 1 && (
                  <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>
                    <strong>⚠️ TICKET REOPENED BY CITIZEN CONSENSUS:</strong> 3 residents disputed the official repair proof. The complaint has been automatically reopened and escalated to <strong>{prioConfig.label.toUpperCase()}</strong> priority for field reinspection.
                  </div>
                )}

                {/* Interactive Before & After Slider */}
                <BeforeAfterSlider
                  beforeImg={complaint.photo_path ? (complaint.photo_path.startsWith('http') ? complaint.photo_path : `${API_BASE}${complaint.photo_path.startsWith('/') ? '' : '/'}${complaint.photo_path}`) : '/uploads/sample-pothole.jpg'}
                  afterImg={complaint.resolution_photo_path ? (complaint.resolution_photo_path.startsWith('http') ? complaint.resolution_photo_path : `${API_BASE}${complaint.resolution_photo_path.startsWith('/') ? '' : '/'}${complaint.resolution_photo_path}`) : '/uploads/sample-resolved-pothole.jpg'}
                  resolvedAt={complaint.resolved_at}
                  resolutionNote={complaint.resolution_note}
                  categoryName={complaint.category_name}
                />

                {/* Citizen Verification Action Panel */}
                <div className="citizen-verification-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        Are you near this site? Verify the repair work
                      </h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                        Democratic civic audit: If 3 local citizens dispute, the complaint automatically reopens with elevated priority.
                      </p>
                    </div>

                    {/* Live Counters */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '3px 8px', borderRadius: '4px' }}>
                        ✅ {complaint.confirm_count || 0} Confirmed Fixed
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: (complaint.dispute_count > 0 ? '#b91c1c' : '#64748b'), background: (complaint.dispute_count > 0 ? '#fee2e2' : '#f1f5f9'), border: '1px solid ' + (complaint.dispute_count > 0 ? '#fca5a5' : '#e2e8f0'), padding: '3px 8px', borderRadius: '4px' }}>
                        ⚠️ {complaint.dispute_count || 0}/3 Disputed
                      </span>
                    </div>
                  </div>

                  {verifyMsg && (
                    <div style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', margin: '0.75rem 0', background: verifyMsg.startsWith('❌') ? '#fef2f2' : '#ecfdf5', color: verifyMsg.startsWith('❌') ? '#991b1b' : '#065f46', border: '1px solid ' + (verifyMsg.startsWith('❌') ? '#fca5a5' : '#a7f3d0') }}>
                      {verifyMsg}
                    </div>
                  )}

                  {/* Verification Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: userVote === 'confirm' ? '#059669' : '#10b981', color: '#ffffff', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                      onClick={() => handleVerify('confirm')}
                      disabled={verifying || userVote !== null}
                    >
                      {userVote === 'confirm' ? <Check size={15} /> : <CheckCircle2 size={15} />}
                      {userVote === 'confirm' ? '✓ You Confirmed Fixed' : '✅ Confirm Fixed'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: userVote === 'dispute' ? '#b91c1c' : '#ef4444', color: '#ffffff', borderColor: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                      onClick={() => handleVerify('dispute')}
                      disabled={verifying || userVote !== null}
                    >
                      <AlertTriangle size={15} />
                      {userVote === 'dispute' ? '⚠️ You Disputed Repair' : '⚠️ Dispute / Still Broken'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit History Timeline Card */}
            <div className="card audit-card">
              <div className="audit-header">
                <History size={16} className="text-slate-500" />
                <h3 className="audit-title">Official Municipal Audit Trail</h3>
              </div>

              <div className="timeline-list">
                {complaint.status_history && complaint.status_history.length > 0 ? (
                  complaint.status_history.map((hist, idx) => {
                    const histStat = getStatusConfig(hist.status);
                    const HistIcon = histStat.icon;

                    return (
                      <div key={idx} className="timeline-item">
                        <div
                          className="timeline-icon-box"
                          style={{ backgroundColor: histStat.bgColor, color: histStat.color }}
                        >
                          <HistIcon size={13} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-top-row">
                            <span className="timeline-status-name">
                              Status set to <strong>{histStat.label}</strong>
                            </span>
                            <span className="timeline-time">
                              {formatFullDateTime(hist.created_at)}
                            </span>
                          </div>
                          <p className="timeline-note">{hist.note || 'Internal status updated.'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No audit records registered yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Evidence, Location & Support */}
          <div className="track-right-col">
            {/* Incident Details Card */}
            <div className="card incident-meta-card">
              <div className="meta-card-head">
                <div
                  className="meta-cat-icon"
                  style={{ backgroundColor: catConfig.bgColor, color: catConfig.color }}
                >
                  <CatIcon size={20} />
                </div>
                <div>
                  <h3 className="meta-cat-title">{complaint.category_name || catConfig.name}</h3>
                  <span className="meta-dept-name">{complaint.authority_name || catConfig.department}</span>
                </div>
              </div>

              <p className="meta-desc-text">{complaint.description}</p>

              {complaint.photo_path && (
                <div className="track-photo-container">
                  {/\.(webm|mp4|mov|ogg)$/i.test(complaint.photo_path) || complaint.photo_path.includes('video-') ? (
                    <video
                      src={complaint.photo_path.startsWith('http') ? complaint.photo_path : `${API_BASE}${complaint.photo_path.startsWith('/') ? '' : '/'}${complaint.photo_path}`}
                      controls
                      playsInline
                      className="track-photo-img"
                      style={{ maxHeight: '380px', objectFit: 'contain', background: '#000000', width: '100%' }}
                    />
                  ) : (
                    <img
                      src={complaint.photo_path.startsWith('http') ? complaint.photo_path : `${API_BASE}${complaint.photo_path.startsWith('/') ? '' : '/'}${complaint.photo_path}`}
                      alt="Geotagged Evidence"
                      className="track-photo-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="photo-caption-bar">
                    {/\.(webm|mp4|mov|ogg)$/i.test(complaint.photo_path) || complaint.photo_path.includes('video-') ? (
                      <>
                        <Video size={12} />
                        <span>Geotagged Field Video Recording Evidence</span>
                      </>
                    ) : (
                      <>
                        <Camera size={12} />
                        <span>Geotagged Perceptual Hash Evidence</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Citizen Community Endorsement ("Impacts Me Too") */}
              <div className="support-endorse-box">
                <div style={{ flex: 1 }}>
                  <div className="support-box-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>⚡ Community Endorsement</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.02em' }}>
                      🔥 {complaint.report_count || 1} local residents affected
                    </span>
                  </div>
                  <div className="support-box-sub">
                    {hasEndorsed ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        ✓ You and {(complaint.report_count || 1) - 1} other local residents have endorsed this issue.
                      </span>
                    ) : (
                      <span>
                        Impacted by this hazard? One-click endorsement directly boosts municipal priority without re-submitting.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${hasEndorsed ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleSupport}
                  disabled={supporting || hasEndorsed || complaint.status === 'resolved'}
                  style={hasEndorsed ? { borderColor: '#10b981', color: '#059669', background: '#ecfdf5', fontWeight: 700 } : { fontWeight: 700 }}
                >
                  <ThumbsUp size={14} />
                  {supporting ? 'Endorsing...' : hasEndorsed ? '✓ Endorsed (+1)' : '⚡ Impacts Me Too (+1)'}
                </button>
              </div>

              {supportMsg && (
                <div className="support-feedback-alert">{supportMsg}</div>
              )}

              {/* Location Map Preview */}
              <div className="track-location-section">
                <div className="loc-label-row">
                  <MapPin size={14} className="text-primary" />
                  <span className="loc-address-text">{complaint.address_text || 'GPS Coordinates'}</span>
                </div>

                {complaint.latitude && complaint.longitude && (
                  <div className="track-map-wrap">
                    <MapContainer
                      center={[complaint.latitude, complaint.longitude]}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ width: '100%', height: '180px', borderRadius: 'var(--radius-md)' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[complaint.latitude, complaint.longitude]}>
                        <Popup>
                          <strong>{complaint.id}</strong><br />
                          {complaint.category_name}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .track-header {
          margin-bottom: 2rem;
        }
        .track-search-form {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          max-width: 680px;
        }
        .search-bar-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
        }
        .search-bar-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }
        .search-bar-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          font-family: var(--font-mono);
          font-size: 0.95rem;
          background: #ffffff;
        }
        .sample-tags-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.85rem;
          font-size: 0.775rem;
          flex-wrap: wrap;
        }
        .sample-label {
          color: var(--text-muted);
        }
        .sample-tag-btn {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .sample-tag-btn:hover {
          background-color: var(--primary-light);
          border-color: var(--primary);
        }
        .track-error-card {
          padding: 2.5rem;
          text-align: center;
          max-width: 580px;
          margin: 2rem auto;
        }
        .error-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .error-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .error-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
        }
        .track-result-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
          gap: 1.75rem;
          align-items: flex-start;
          width: 100%;
        }
        .track-left-col, .track-right-col {
          min-width: 0;
        }
        .track-left-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .track-stepper-card {
          padding: 1.5rem;
        }
        .stepper-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }
        .stepper-id-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .stepper-id-val {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .stepper-progress-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          position: relative;
        }
        .step-milestone {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .step-milestone:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 15px;
          left: 50%;
          width: 100%;
          height: 2px;
          background-color: var(--border);
          z-index: 1;
        }
        .step-completed:not(:last-child)::after {
          background-color: var(--resolved-indicator);
        }
        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--bg-subtle);
          border: 2px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-muted);
          position: relative;
          z-index: 2;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        .step-completed .step-circle {
          background-color: #dcfce7;
          border-color: #16a34a;
          color: #16a34a;
        }
        .step-current .step-circle {
          background-color: #f0f9ff;
          border-color: #0284c7;
          color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
        }
        .step-label-main {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.15rem;
        }
        .step-label-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        /* Audit Timeline */
        .audit-card {
          padding: 1.5rem;
        }
        .audit-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .audit-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
          padding-left: 0.5rem;
        }
        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          position: relative;
        }
        .timeline-icon-box {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .timeline-content {
          flex: 1;
        }
        .timeline-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          font-size: 0.8125rem;
        }
        .timeline-status-name {
          color: var(--text-main);
        }
        .timeline-time {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .timeline-note {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.45;
          background-color: var(--bg-subtle);
          padding: 0.45rem 0.65rem;
          border-radius: 4px;
          margin-top: 0.35rem;
        }

        /* Right Column */
        .track-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .incident-meta-card {
          padding: 1.25rem;
        }
        .meta-card-head {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.85rem;
        }
        .meta-cat-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .meta-cat-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .meta-dept-name {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .meta-desc-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 1rem;
        }
        .track-photo-container {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 1rem;
          border: 1px solid var(--border);
        }
        .track-photo-img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          display: block;
        }
        .photo-caption-bar {
          position: absolute;
          bottom: 6px;
          left: 6px;
          background: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.68rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .support-endorse-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius-md);
          padding: 0.75rem;
          margin-bottom: 1rem;
        }
        .support-box-title {
          font-size: 0.775rem;
          font-weight: 700;
          color: #166534;
        }
        .support-box-sub {
          font-size: 0.72rem;
          color: #15803d;
        }
        .support-feedback-alert {
          background-color: #f0fdf4;
          color: #166534;
          padding: 0.45rem 0.65rem;
          border-radius: 4px;
          font-size: 0.775rem;
          margin-bottom: 1rem;
        }
        .track-location-section {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .loc-label-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: var(--text-main);
          font-weight: 600;
        }
        .loc-address-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .track-map-wrap {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        @media (max-width: 960px) {
          .track-result-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stepper-progress-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          .step-milestone::after {
            display: none !important;
          }
          .track-search-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
