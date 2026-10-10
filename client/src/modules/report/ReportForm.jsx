// client/src/modules/report/ReportForm.jsx
// Owner: Tanush (Complaint Submission & Tracking Module)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ReportForm() {
  const { categoryId: urlCategoryId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(urlCategoryId || '');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (urlCategoryId && !selectedCategory) {
          setSelectedCategory(urlCategoryId);
        } else if (!selectedCategory && data.length > 0) {
          setSelectedCategory(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, [urlCategoryId]);

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error, using default city center:', err.message);
        // Fallback default coordinates (e.g. Mumbai civic center)
        setLatitude('19.076000');
        setLongitude('72.877700');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo change handler
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCategory) {
      setErrorMessage('Please select an issue category.');
      return;
    }
    if (!description || description.trim().length < 10) {
      setErrorMessage('Please provide a description of at least 10 characters.');
      return;
    }
    if (!latitude || !longitude) {
      setErrorMessage('Please capture your location coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category_id', selectedCategory);
      formData.append('description', description.trim());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      if (addressText) formData.append('address_text', addressText.trim());
      if (photoFile) formData.append('photo', photoFile);

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
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If submitted successfully, show Confirmation Screen
  if (submissionResult) {
    return (
      <div className="container page-wrapper">
        <div className="card confirmation-card">
          <div className="conf-icon">{submissionResult.duplicate ? '🔄' : '✅'}</div>
          
          <h2 className="conf-title">
            {submissionResult.duplicate ? 'Duplicate Report Merged!' : 'Complaint Filed Successfully!'}
          </h2>

          <p className="conf-message">
            {submissionResult.message || 'Your report has been securely registered in the municipal database.'}
          </p>

          <div className="conf-id-box">
            <span className="conf-id-label">Tracking Complaint ID:</span>
            <div className="conf-id-row">
              <span className="conf-id-code">{submissionResult.id}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(submissionResult.id);
                  alert('Copied Complaint ID: ' + submissionResult.id);
                }}
              >
                📋 Copy ID
              </button>
            </div>
          </div>

          <div className="conf-details-grid">
            <div className="conf-detail-item">
              <span className="det-label">Assigned Department</span>
              <span className="det-val">{submissionResult.authority_name || 'Municipal Works'}</span>
            </div>
            <div className="conf-detail-item">
              <span className="det-label">Initial Priority Level</span>
              <span className={`badge badge-${submissionResult.priority_level}`}>
                {submissionResult.priority_level} (Score: {submissionResult.priority_score})
              </span>
            </div>
            <div className="conf-detail-item">
              <span className="det-label">Status</span>
              <span className="badge badge-low">{submissionResult.status}</span>
            </div>
          </div>

          <div className="conf-actions">
            <Link to={`/track/${submissionResult.id}`} className="btn btn-primary btn-lg">
              🔍 Track Progress Now
            </Link>
            <button
              onClick={() => {
                setSubmissionResult(null);
                setDescription('');
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="btn btn-secondary"
            >
              File Another Report
            </button>
          </div>
        </div>

        <style>{`
          .confirmation-card {
            max-width: 680px;
            margin: 2rem auto;
            text-align: center;
            padding: 3rem 2rem;
            border-top: 6px solid var(--primary);
          }
          .conf-icon {
            font-size: 3.5rem;
            margin-bottom: 1rem;
          }
          .conf-title {
            font-size: 1.85rem;
            font-weight: 800;
            color: var(--text-main);
          }
          .conf-message {
            color: var(--text-muted);
            margin: 0.75rem 0 1.5rem;
            line-height: 1.5;
          }
          .conf-id-box {
            background: #f1f5f9;
            padding: 1.25rem;
            border-radius: var(--radius-md);
            margin-bottom: 1.5rem;
            border: 1px dashed var(--border-strong);
          }
          .conf-id-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-weight: 700;
            display: block;
            margin-bottom: 0.4rem;
          }
          .conf-id-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          .conf-id-code {
            font-size: 1.5rem;
            font-weight: 800;
            font-family: monospace;
            color: var(--primary);
            letter-spacing: 0.05em;
          }
          .conf-details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            text-align: left;
            margin-bottom: 2rem;
            background: #fafafa;
            padding: 1rem;
            border-radius: var(--radius-md);
          }
          .det-label {
            display: block;
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }
          .det-val {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--text-main);
          }
          .conf-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
          }
          @media (max-width: 600px) {
            .conf-details-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <div className="report-container">
        <div className="report-header">
          <span className="badge badge-low">Citizen Submission</span>
          <h1 className="page-title">Report a Civic Issue</h1>
          <p className="page-subtitle">
            Provide issue details, photograph the scene, and capture coordinates. Our smart duplicate engine
            will automatically correlate nearby incidents and escalate priority.
          </p>
        </div>

        {errorMessage && (
          <div className="card alert-error" style={{ background: '#fef2f2', borderColor: '#fca5a5', marginBottom: '1.5rem', color: '#991b1b' }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card form-card">
          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="category_select">
              1. Issue Category <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="category_select"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="" disabled>Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} (Severity: {c.severity_weight}/5)
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload with Preview */}
          <div className="form-group">
            <label className="form-label">
              2. Photograph the Issue <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="photo-upload-box">
              <input
                type="file"
                id="photo_input"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="photo_input" className="photo-upload-label">
                {photoPreview ? (
                  <div className="preview-container">
                    <img src={photoPreview} alt="Upload Preview" className="img-preview" />
                    <span className="btn btn-secondary btn-sm change-photo-btn">Change Photo</span>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span className="upload-instruction">Click or tap to snap / upload photo</span>
                    <span className="upload-hint">Supports Camera capture on mobile phones</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Location Capture */}
          <div className="form-group">
            <label className="form-label">
              3. Issue Location <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="location-action-bar">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetLocation}
                disabled={locating}
              >
                {locating ? '📡 Locating GPS...' : '📍 Use My Current Location'}
              </button>
              {latitude && longitude && (
                <span className="location-pill">
                  ✅ Coordinates: {latitude}, {longitude}
                </span>
              )}
            </div>

            <div className="grid-2" style={{ marginTop: '0.75rem' }}>
              <div>
                <label className="det-label">Latitude</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 19.076000"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="det-label">Longitude</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 72.877700"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label className="det-label">Street Address / Landmark (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Opposite Metro Pillar 42, Link Road"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="desc_input">
              4. Description (Min 10 characters) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="desc_input"
              className="form-control"
              rows="3"
              placeholder="Describe the problem, hazard level, and exact surroundings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            ></textarea>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {description.length}/10 characters minimum
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting & Analyzing Photo...' : '🚀 Submit Municipal Report'}
          </button>
        </form>
      </div>

      <style>{`
        .report-container {
          max-width: 680px;
          margin: 0 auto;
        }
        .report-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .form-card {
          padding: 2rem;
        }
        .photo-upload-box {
          border: 2px dashed var(--border-strong);
          border-radius: var(--radius-md);
          background: #f8fafc;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .photo-upload-box:hover {
          border-color: var(--primary);
        }
        .photo-upload-label {
          display: block;
          cursor: pointer;
          width: 100%;
        }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
          gap: 0.35rem;
        }
        .upload-icon {
          font-size: 2.5rem;
        }
        .upload-instruction {
          font-weight: 600;
          color: var(--text-main);
          font-size: 0.95rem;
        }
        .upload-hint {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .preview-container {
          position: relative;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .img-preview {
          max-height: 220px;
          border-radius: var(--radius-md);
          object-fit: cover;
          box-shadow: var(--shadow-sm);
        }
        .change-photo-btn {
          margin-top: 0.75rem;
        }
        .location-action-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .location-pill {
          font-size: 0.825rem;
          font-weight: 600;
          color: #166534;
          background: #dcfce7;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
        }
      `}</style>
    </div>
  );
}
