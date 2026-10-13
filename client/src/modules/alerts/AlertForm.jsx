// client/src/modules/alerts/AlertForm.jsx
import React, { useState } from 'react';
import { Sparkles, X, Eye } from 'lucide-react';
import './alerts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ALERT_TYPES = [
  { value: 'water_cut', label: '💧 Water Supply Cut' },
  { value: 'power_cut', label: '⚡ Power Outage' },
  { value: 'road_closure', label: '🚧 Road Closure' },
  { value: 'waste_schedule', label: '🚛 Waste Schedule Change' },
  { value: 'maintenance', label: '🔧 Infrastructure Maintenance' },
  { value: 'safety', label: '⚠️ Public Safety Advisory' }
];

export default function AlertForm({ initialData = null, wards = [], onSave, onCancel, token }) {
  const isEditing = !!initialData;

  const [type, setType] = useState(initialData?.type || 'water_cut');
  const [severity, setSeverity] = useState(initialData?.severity || 'info');
  const [activeTab, setActiveTab] = useState('en');

  const [titleEn, setTitleEn] = useState(initialData?.title_en || '');
  const [titleHi, setTitleHi] = useState(initialData?.title_hi || '');
  const [titleMr, setTitleMr] = useState(initialData?.title_mr || '');

  const [bodyEn, setBodyEn] = useState(initialData?.body_en || '');
  const [bodyHi, setBodyHi] = useState(initialData?.body_hi || '');
  const [bodyMr, setBodyMr] = useState(initialData?.body_mr || '');

  const [allWards, setAllWards] = useState(initialData?.all_wards === 1 || false);
  const [selectedWardIds, setSelectedWardIds] = useState(() => {
    if (initialData?.wards) {
      return initialData.wards.map((w) => w.id || w);
    }
    return [];
  });

  const [publishNow, setPublishNow] = useState(!isEditing);
  const [startsAt, setStartsAt] = useState(() => {
    if (initialData?.starts_at) {
      return new Date(initialData.starts_at).toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  });
  const [endsAt, setEndsAt] = useState(() => {
    if (initialData?.ends_at) {
      return new Date(initialData.ends_at).toISOString().slice(0, 16);
    }
    return '';
  });

  const [translating, setTranslating] = useState(false);
  const [translateMsg, setTranslateMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!titleEn.trim() || !bodyEn.trim()) {
      alert('Please fill out the English Title and English Body first before auto-translating.');
      return;
    }

    setTranslating(true);
    setTranslateMsg('');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/alerts/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: titleEn, body: bodyEn })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Translation service failed');
      }

      if (data.translations) {
        setTitleHi(data.translations.hi?.title || titleHi);
        setBodyHi(data.translations.hi?.body || bodyHi);
        setTitleMr(data.translations.mr?.title || titleMr);
        setBodyMr(data.translations.mr?.body || bodyMr);
        setTranslateMsg('✨ Draft translations generated! Please review Hindi & Marathi tabs.');
      }
    } catch (err) {
      setTranslateMsg(`⚠️ ${err.message}. You can manually input Hindi & Marathi text.`);
    } finally {
      setTranslating(false);
    }
  };

  const handleWardToggle = (wardId) => {
    setSelectedWardIds((prev) =>
      prev.includes(wardId) ? prev.filter((id) => id !== wardId) : [...prev, wardId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!titleEn.trim() || !bodyEn.trim()) {
      setError('English title and body text are mandatory.');
      return;
    }

    if (!allWards && selectedWardIds.length === 0) {
      setError('Please select at least one ward jurisdiction or check "Target Whole City".');
      return;
    }

    setSubmitting(true);

    const payload = {
      type,
      severity,
      title_en: titleEn,
      title_hi: titleHi || null,
      title_mr: titleMr || null,
      body_en: bodyEn,
      body_hi: bodyHi || null,
      body_mr: bodyMr || null,
      allWards: allWards ? 1 : 0,
      wardIds: allWards ? [] : selectedWardIds,
      startsAt: publishNow ? new Date().toISOString() : new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      publishNow
    };

    try {
      const url = isEditing ? `${API_BASE}/api/alerts/${initialData.id}` : `${API_BASE}/api/alerts`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save alert');
      }

      onSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview helper values
  const previewTitle = activeTab === 'hi' && titleHi ? titleHi : activeTab === 'mr' && titleMr ? titleMr : titleEn || 'Announcement Title Preview';
  const previewBody = activeTab === 'hi' && bodyHi ? bodyHi : activeTab === 'mr' && bodyMr ? bodyMr : bodyEn || 'The body text of the alert advisory will be formatted here for citizens.';

  return (
    <div className="cs-alerts-modal-overlay">
      <div className="cs-alerts-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--gov-navy)' }}>
            {isEditing ? `Edit Municipal Alert #${initialData.id}` : 'Create Official Civic Alert'}
          </h2>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.65rem', borderRadius: 4, marginBottom: '1rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {translateMsg && (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.65rem', borderRadius: 4, marginBottom: '1rem', fontSize: '0.85rem' }}>
            {translateMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Type & Severity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Alert Type:
              </label>
              <select
                className="cs-radar-select"
                style={{ width: '100%' }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ALERT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Severity Level:
              </label>
              <select
                className="cs-radar-select"
                style={{ width: '100%' }}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="info">🔵 Informational (General notice)</option>
                <option value="warning">🟠 Warning (Scheduled disruption)</option>
                <option value="critical">🔴 Critical (Immediate public hazard)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Multilingual Content Tabs */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '1rem', marginBottom: '1rem', background: '#fafbfc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div className="cs-alerts-lang-tabs">
                <button
                  type="button"
                  className={`cs-alerts-lang-tab ${activeTab === 'en' ? 'cs-alerts-lang-tab-active' : ''}`}
                  onClick={() => setActiveTab('en')}
                >
                  English (Required)
                </button>
                <button
                  type="button"
                  className={`cs-alerts-lang-tab ${activeTab === 'hi' ? 'cs-alerts-lang-tab-active' : ''}`}
                  onClick={() => setActiveTab('hi')}
                >
                  हिन्दी {titleHi && '✓'}
                </button>
                <button
                  type="button"
                  className={`cs-alerts-lang-tab ${activeTab === 'mr' ? 'cs-alerts-lang-tab-active' : ''}`}
                  onClick={() => setActiveTab('mr')}
                >
                  मराठी {titleMr && '✓'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating}
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>{translating ? 'Translating via Grok...' : 'Auto-translate to Hindi & Marathi'}</span>
              </button>
            </div>

            {activeTab === 'en' && (
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Title (English):</label>
                  <input
                    type="text"
                    required
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Scheduled Water Pipeline Maintenance in Ward H/East"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Body (English):</label>
                  <textarea
                    required
                    rows={4}
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    value={bodyEn}
                    onChange={(e) => setBodyEn(e.target.value)}
                    placeholder="Detailed notice describing affected areas, timings, and municipal emergency arrangements..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'hi' && (
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>शीर्षक (हिन्दी):</label>
                  <input
                    type="text"
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    placeholder="वार्ड एच/पूर्व में पाइपलाइन मरम्मत..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>विवरण (हिन्दी):</label>
                  <textarea
                    rows={4}
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    value={bodyHi}
                    onChange={(e) => setBodyHi(e.target.value)}
                    placeholder="आपातकालीन जल आपूर्ति की स्थिति..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'mr' && (
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>शीर्षक (मराठी):</label>
                  <input
                    type="text"
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={titleMr}
                    onChange={(e) => setTitleMr(e.target.value)}
                    placeholder="प्रभाग एच/पूर्व मधील जलवाहिनी दुरुस्ती..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>तपशील (मराठी):</label>
                  <textarea
                    rows={4}
                    className="cs-radar-select"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    value={bodyMr}
                    onChange={(e) => setBodyMr(e.target.value)}
                    placeholder="पाणीपुरवठा बंद राहण्याबाबत सविस्तर माहिती..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Jurisdiction Targeting */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Municipal Wards:
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: '1rem' }}>
                <input
                  type="checkbox"
                  checked={allWards}
                  onChange={(e) => setAllWards(e.target.checked)}
                />
                <span style={{ fontWeight: 600, color: 'var(--gov-saffron)' }}>Whole City (All Wards)</span>
              </label>
            </div>

            {!allWards && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.4rem', maxHeight: 130, overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: 4, background: '#fff' }}>
                {wards.map((w) => {
                  const checked = selectedWardIds.includes(w.id);
                  return (
                    <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleWardToggle(w.id)}
                      />
                      <span>{w.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 4: Scheduling & Timing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Start Schedule:</label>
                <label style={{ fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>
              {!publishNow && (
                <input
                  type="datetime-local"
                  required={!publishNow}
                  className="cs-radar-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Expiration Date/Time (Optional):
              </label>
              <input
                type="datetime-local"
                className="cs-radar-select"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Citizen Live Preview Box */}
          <div style={{ marginBottom: '1.25rem', border: '1px dashed var(--border-strong)', borderRadius: 6, padding: '0.85rem', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={12} />
              <span>Live Citizen Preview ({activeTab.toUpperCase()})</span>
            </div>
            <div style={{ borderLeft: `4px solid ${severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#ea580c' : '#0b2545'}`, paddingLeft: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gov-navy)' }}>
                {previewTitle}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {previewBody}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onCancel} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: 120 }}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : publishNow ? 'Publish Now' : 'Schedule Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
