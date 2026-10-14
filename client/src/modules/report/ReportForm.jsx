// client/src/modules/report/ReportForm.jsx
// Citizen & Operator Field Hazard Submission
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Copy,
  Check,
  X,
  Camera,
  Video,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import LiveMediaCaptureModal from './LiveMediaCaptureModal';
import {
  getCategoryConfig
} from '../../utils/civicHelpers';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function LocationMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    }
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          onPositionChange(e.target.getLatLng());
        }
      }}
    />
  );
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function ReportForm() {
  const { categoryId: urlCategoryId } = useParams();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(urlCategoryId || '');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [mapPosition, setMapPosition] = useState({ lat: 19.0760, lng: 72.8777 });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState('photo'); // 'photo' | 'video'

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setCategories(data);
        if (urlCategoryId) {
          setSelectedCategory(urlCategoryId);
        } else if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      })
      .catch((err) => console.warn('Categories loading paused:', err.message));
  }, [urlCategoryId]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapPosition({ lat, lng });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed, keeping default coordinates:', err);
        setLocating(false);
        setErrorMessage('Could not retrieve device GPS. You can drag the pin on the map directly.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapPositionChange = (latlng) => {
    setLatitude(latlng.lat);
    setLongitude(latlng.lng);
    setMapPosition(latlng);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) {
        setErrorMessage('Please select a valid image (JPEG, PNG, WEBP) or video file (MP4, WEBM).');
        return;
      }
      setPhotoFile(file);
      setErrorMessage('');

      if (isVid) {
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLiveCapture = ({ file, previewUrl }) => {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setErrorMessage('');
    setCameraModalOpen(false);
  };

  const handleRemoveMedia = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openLiveCamera = (initialMode = 'photo') => {
    setCameraInitialMode(initialMode);
    setCameraModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCategory) {
      setErrorMessage('Please select a hazard category.');
      return;
    }

    if (!description || description.trim().length < 10) {
      setErrorMessage('Description must be at least 10 characters long.');
      return;
    }

    if (!latitude || !longitude) {
      setErrorMessage('Please specify location coordinates.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category_id', selectedCategory);
      formData.append('description', description.trim());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      if (addressText.trim()) {
        formData.append('address_text', addressText.trim());
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      setSubmissionResult(data);
    } catch (err) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submissionResult?.id) {
      navigator.clipboard.writeText(submissionResult.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedCatConfig = getCategoryConfig(selectedCategory);
  const SelectedIcon = selectedCatConfig.icon;

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div className="form-page-header">
        <div className="breadcrumb-row">
          <span>नागरिक सेवाएं / Citizen Services</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">शिकायत प्रपत्र / Form 1-A</span>
        </div>
        <div className="gov-seal-box" style={{ marginBottom: '0.65rem' }}>
          लोक सेवा गारंटी अधिनियम 2011 / PUBLIC SERVICE GUARANTEE ACT COMPLIANT
        </div>
        <h1 className="page-heading">Lodge Public Civic Grievance (नागरिक शिकायत प्रपत्र)</h1>
        <p className="page-subtitle">
          Direct field intake to competent municipal departments. Submissions are protected by perceptual photographic deduplication, GPS geotagging, and statutory time-bound SLA resolution.
        </p>
      </div>

      {/* Submission Success / Duplicate Notification */}
      {submissionResult ? (
        <div className="card result-card">
          {submissionResult.duplicate ? (
            /* Duplicate Merged Notice */
            <div className="duplicate-alert-box">
              <div className="dup-icon-box">
                <Flame size={24} className="text-amber-600" />
              </div>
              <div className="dup-content">
                <span className="badge badge-high" style={{ marginBottom: '0.4rem' }}>
                  Smart Duplicate Detected & Merged
                </span>
                <h2 className="dup-title">
                  Existing Hazard Ticket Found within 50m
                </h2>
                <p className="dup-desc">
                  {submissionResult.message ||
                    `This issue was already reported under ID ${submissionResult.id}. Our perceptual hashing engine confirmed identical coordinates and photo signature. We linked your report and elevated the issue's priority.`}
                </p>

                <div className="dup-id-box">
                  <div className="dup-id-left">
                    <span className="dup-id-label">Unified Municipal Ticket ID:</span>
                    <span className="dup-id-text">{submissionResult.id}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyId}
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="dup-meta-chips">
                  <span className="chip-item">
                    Target Authority: <strong>{submissionResult.authority_name || 'Municipal Cell'}</strong>
                  </span>
                  <span className="chip-item">
                    Priority Escalated to: <strong>{submissionResult.priority_level?.toUpperCase()}</strong>
                  </span>
                  <span className="chip-item">
                    Score: <strong>{submissionResult.priority_score}</strong>
                  </span>
                </div>

                <div className="dup-actions-row">
                  <Link to={`/track/${submissionResult.id}`} className="btn btn-primary">
                    Track Consolidated Issue &rarr;
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmissionResult(null);
                      setDescription('');
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Report Another Hazard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* New Ticket Created Notice */
            <div className="success-alert-box">
              <div className="succ-icon-box">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <div className="succ-content">
                <span className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
                  Report Successfully Registered
                </span>
                <h2 className="succ-title">New Municipal Ticket Issued</h2>
                <p className="succ-desc">
                  Your civic incident report has been verified and routed to <strong>{submissionResult.authority_name || 'Responsible Department'}</strong>.
                </p>

                <div className="dup-id-box">
                  <div className="dup-id-left">
                    <span className="dup-id-label">Tracking Identification Code:</span>
                    <span className="dup-id-text">{submissionResult.id}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyId}
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="dup-meta-chips">
                  <span className="chip-item">
                    Initial Status: <strong>SUBMITTED</strong>
                  </span>
                  <span className="chip-item">
                    Priority Rating: <strong>{submissionResult.priority_level?.toUpperCase()}</strong>
                  </span>
                  <span className="chip-item">
                    Score: <strong>{submissionResult.priority_score}</strong>
                  </span>
                </div>

                <div className="dup-actions-row">
                  <Link to={`/track/${submissionResult.id}`} className="btn btn-primary">
                    Open Real-Time Tracking &rarr;
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmissionResult(null);
                      setDescription('');
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Report Another Hazard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Submission Form */
        <div className="report-form-layout">
          <form onSubmit={handleSubmit} className="report-main-form card">
            {errorMessage && (
              <div className="form-error-banner">
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Category Selector */}
            <div className="form-group">
              <label className="form-label">Hazard Category & Domain</label>
              <div className="category-select-grid">
                {categories.map((cat) => {
                  const cfg = getCategoryConfig(cat.id);
                  const Icon = cfg.icon;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`cat-pill-option ${isSelected ? 'cat-pill-selected' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <div
                        className="cat-pill-icon"
                        style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="cat-pill-meta">
                        <span className="cat-pill-name">{cat.name}</span>
                        <span className="cat-pill-dept">{cfg.department}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Field Evidence Media (Photo or Video) */}
            <div className="form-group">
              <div className="evidence-header-row">
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Field Evidence Media (साक्ष्य फोटो या वीडियो){' '}
                  <span className="text-slate-400 font-normal">(Optional but recommended)</span>
                </label>
                <span className="evidence-live-chip">
                  <Sparkles size={12} className="text-amber-500" />
                  Live Camera Enabled
                </span>
              </div>

              {/* Hidden file input for device browse */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />

              {photoPreview ? (
                /* Media Attached Preview Card */
                <div className="media-preview-card">
                  <div className="media-preview-viewer">
                    {photoFile && photoFile.type && photoFile.type.startsWith('video/') ? (
                      <video
                        src={photoPreview}
                        controls
                        playsInline
                        className="attached-media-preview attached-video"
                      />
                    ) : (
                      <img
                        src={photoPreview}
                        alt="Evidence Preview"
                        className="attached-media-preview attached-img"
                      />
                    )}
                  </div>

                  <div className="media-preview-info-bar">
                    <div className="media-preview-details">
                      <div className="media-type-pill">
                        {photoFile && photoFile.type && photoFile.type.startsWith('video/') ? (
                          <>
                            <Video size={13} className="text-blue-600" />
                            <span>Video Clip</span>
                          </>
                        ) : (
                          <>
                            <Camera size={13} className="text-amber-600" />
                            <span>Photo Evidence</span>
                          </>
                        )}
                      </div>
                      <span className="media-preview-name">
                        {photoFile ? photoFile.name : 'Attached Evidence'} &bull;{' '}
                        {photoFile ? `${(photoFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                      </span>
                    </div>

                    <div className="media-preview-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openLiveCamera(photoFile?.type?.startsWith('video/') ? 'video' : 'photo')}
                        title="Retake with live camera"
                      >
                        <RefreshCw size={13} /> Retake
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm text-red-600"
                        onClick={handleRemoveMedia}
                        title="Remove attached evidence"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3 Action Buttons / Selector Grid */
                <div className="evidence-capture-grid">
                  {/* Option 1: Live Photo Snap */}
                  <button
                    type="button"
                    className="evidence-option-card live-photo-card"
                    onClick={() => openLiveCamera('photo')}
                  >
                    <div className="option-icon-box photo-icon-box">
                      <Camera size={24} />
                    </div>
                    <div className="option-text-box">
                      <strong className="option-title">📸 Live Camera Photo</strong>
                      <span className="option-desc">Snap instant photo with viewfinder framing</span>
                    </div>
                    <span className="option-tag">Instant Snap</span>
                  </button>

                  {/* Option 2: Live Video Recording */}
                  <button
                    type="button"
                    className="evidence-option-card live-video-card"
                    onClick={() => openLiveCamera('video')}
                  >
                    <div className="option-icon-box video-icon-box">
                      <Video size={24} />
                    </div>
                    <div className="option-text-box">
                      <strong className="option-title">🎥 Live Camera Video</strong>
                      <span className="option-desc">Record up to 30s video with sound</span>
                    </div>
                    <span className="option-tag tag-video">Max 30s</span>
                  </button>

                  {/* Option 3: Upload from Device */}
                  <button
                    type="button"
                    className="evidence-option-card browse-device-card"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="option-icon-box browse-icon-box">
                      <UploadCloud size={24} />
                    </div>
                    <div className="option-text-box">
                      <strong className="option-title">📁 Upload from Device</strong>
                      <span className="option-desc">Select existing photo or video file</span>
                    </div>
                    <span className="option-tag">Browse Files</span>
                  </button>
                </div>
              )}

              <div className="form-hint" style={{ marginTop: '0.45rem' }}>
                Perceptual hash dHash and GPS geotagging are automatically attached to your media for municipal duplicate detection.
              </div>
            </div>

            {/* 3. Incident Description */}
            <div className="form-group">
              <label className="form-label">Hazard Description & Nearby Reference</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describe the issue clearly (e.g., Snapped high-voltage cable sparking near West Pillar 42, blocking pedestrian walkway)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              <div className="form-hint">
                Minimum 10 characters required. Include prominent landmarks to guide field teams.
              </div>
            </div>

            {/* 4. Location & Map Pin */}
            <div className="form-group">
              <div className="location-label-row">
                <label className="form-label">Geographic Location</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleGetLocation}
                  disabled={locating}
                >
                  <Navigation size={13} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Acquiring GPS...' : 'Use My Current Location'}
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Street address or nearby landmark (e.g., Station Road East Gate Bus Stop)"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                style={{ marginBottom: '0.65rem' }}
              />

              {/* Interactive Pin-Drop Leaflet Map */}
              <div className="report-map-wrapper">
                <MapContainer
                  center={[latitude, longitude]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap position={mapPosition} />
                  <LocationMarker
                    position={mapPosition}
                    onPositionChange={handleMapPositionChange}
                  />
                </MapContainer>
                <div className="map-coords-badge">
                  GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)} &bull; Drag pin to adjust
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="btn btn-saffron btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Analyzing & Triaging Submission...' : 'Submit Grievance to Municipal Docket (शिकायत दर्ज करें)'}
            </button>
          </form>

          {/* Sidebar Guidance & Emergency Helpline */}
          <div className="report-sidebar">
            <div className="card sidebar-guidance-card">
              <div className="sidebar-cat-header">
                <div
                  className="sidebar-cat-icon"
                  style={{ backgroundColor: selectedCatConfig.bgColor, color: selectedCatConfig.color }}
                >
                  <SelectedIcon size={20} />
                </div>
                <div>
                  <h3 className="sidebar-cat-title">{selectedCatConfig.name}</h3>
                  <span className="sidebar-cat-dept">{selectedCatConfig.department}</span>
                </div>
              </div>

              <div className="sidebar-guidance-body">
                <h4 className="guidance-section-title">Official Reporting Protocol</h4>
                <p className="guidance-desc">{selectedCatConfig.description}</p>
                <div className="rec-action-chip">
                  <span className="rec-chip-lbl">Target Action:</span>
                  <span className="rec-chip-val">{selectedCatConfig.recommendedAction}</span>
                </div>
              </div>
            </div>

            <div className="card emergency-callout-card">
              <div className="emergency-callout-header">
                <AlertTriangle size={18} className="text-red-600" />
                <h4 className="emergency-callout-title">Immediate Life Hazards?</h4>
              </div>
              <p className="emergency-callout-text">
                For sparking high-voltage power lines or catastrophic collapses, keep 10+ meters away and immediately notify the emergency desks:
              </p>
              <div className="emergency-numbers-list">
                <div className="em-num-row">
                  <span>Electrical Grid Helpline:</span>
                  <strong>1912</strong>
                </div>
                <div className="em-num-row">
                  <span>Universal Emergency:</span>
                  <strong>112</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Live Camera Photo & Video Capture Modal */}
      <LiveMediaCaptureModal
        isOpen={cameraModalOpen}
        initialMode={cameraInitialMode}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleLiveCapture}
      />

      <style>{`
        .form-page-header {
          margin-bottom: 2rem;
        }
        .report-form-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
          gap: 1.75rem;
          align-items: flex-start;
          width: 100%;
        }
        .report-main-form, .report-sidebar {
          min-width: 0;
        }
        .report-main-form {
          padding: 1.75rem;
        }
        .form-error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--critical-bg);
          color: var(--critical-text);
          border: 1px solid var(--critical-border);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          margin-bottom: 1.25rem;
        }
        .category-select-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        .cat-pill-option {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.85rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
          background: #ffffff;
        }
        .cat-pill-option:hover {
          border-color: var(--primary);
        }
        .cat-pill-selected {
          border-color: var(--primary) !important;
          background-color: #f0f9ff !important;
          box-shadow: 0 0 0 1px var(--primary);
        }
        .cat-pill-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cat-pill-meta {
          display: flex;
          flex-direction: column;
        }
        .cat-pill-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .cat-pill-dept {
          font-size: 0.68rem;
          color: var(--text-muted);
        }
        .evidence-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .evidence-live-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .evidence-capture-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .evidence-option-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.1rem 0.85rem;
          background: #ffffff;
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
        }
        .evidence-option-card:hover {
          border-color: var(--gov-saffron);
          background: #fffaf5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(194, 65, 12, 0.08);
        }
        .option-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.6rem;
          transition: transform 0.18s ease;
        }
        .evidence-option-card:hover .option-icon-box {
          transform: scale(1.08);
        }
        .photo-icon-box {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #ffedd5;
        }
        .video-icon-box {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }
        .browse-icon-box {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .option-text-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 0.5rem;
        }
        .option-title {
          font-size: 0.8125rem;
          color: var(--text-main);
          font-weight: 700;
        }
        .option-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .option-tag {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 7px;
          border-radius: 4px;
          margin-top: auto;
        }
        .option-tag.tag-video {
          background: #dbeafe;
          color: #1e40af;
        }

        /* Attached Media Preview */
        .media-preview-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .media-preview-viewer {
          background: #090e17;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          max-height: 260px;
        }
        .attached-media-preview {
          max-height: 240px;
          max-width: 100%;
          border-radius: 6px;
          object-fit: contain;
        }
        .media-preview-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border-top: 1px solid var(--border-subtle);
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .media-preview-details {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .media-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          border: 1px solid var(--border);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .media-preview-name {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .media-preview-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .location-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.4rem;
        }
        .report-map-wrapper {
          position: relative;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .map-coords-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-family: var(--font-mono);
          z-index: 500;
        }

        /* Sidebar */
        .report-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .sidebar-guidance-card {
          padding: 1.25rem;
        }
        .sidebar-cat-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-cat-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-cat-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .sidebar-cat-dept {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .guidance-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 0.4rem;
        }
        .guidance-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 0.85rem;
        }
        .rec-action-chip {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .rec-chip-lbl {
          font-weight: 700;
          color: var(--text-muted);
          font-size: 0.68rem;
          text-transform: uppercase;
        }
        .rec-chip-val {
          color: var(--text-main);
        }
        .emergency-callout-card {
          background-color: #fff1f2;
          border: 1px solid #fecdd3;
          padding: 1.25rem;
        }
        .emergency-callout-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.5rem;
        }
        .emergency-callout-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #9f1239;
        }
        .emergency-callout-text {
          font-size: 0.8rem;
          color: #881337;
          line-height: 1.45;
          margin-bottom: 0.75rem;
        }
        .emergency-numbers-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.8rem;
        }
        .em-num-row {
          display: flex;
          justify-content: space-between;
          color: #9f1239;
        }

        /* Result View */
        .result-card {
          padding: 2.5rem;
          max-width: 720px;
          margin: 0 auto;
        }
        .duplicate-alert-box, .success-alert-box {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
        }
        .dup-icon-box {
          width: 48px;
          height: 48px;
          background: #fef3c7;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .succ-icon-box {
          width: 48px;
          height: 48px;
          background: #dcfce7;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dup-content, .succ-content {
          flex: 1;
        }
        .dup-title, .succ-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .dup-desc, .succ-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 1.25rem;
        }
        .dup-id-box {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.85rem 1.15rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .dup-id-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.15rem;
        }
        .dup-id-text {
          font-family: var(--font-mono);
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--primary);
        }
        .dup-meta-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .chip-item {
          background-color: #fafbfc;
          border: 1px solid var(--border);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          color: var(--text-secondary);
        }
        .dup-actions-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .report-form-layout {
            grid-template-columns: 1fr;
          }
          .category-select-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .result-card {
            padding: 1.25rem 1rem;
          }
          .duplicate-alert-box, .success-alert-box {
            flex-direction: column;
            gap: 0.75rem;
          }
          .dup-actions-row {
            flex-direction: column;
            width: 100%;
          }
          .dup-actions-row .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
