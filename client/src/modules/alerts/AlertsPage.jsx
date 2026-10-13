import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Droplet,
  Zap,
  Truck,
  Wrench,
  ShieldAlert,
  Info,
  Clock,
  History,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import AlertBanner from './AlertBanner';
import { getOrCreateClientId } from './alertUtils';
import './alerts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TYPE_CONFIG = {
  water_cut: { label: 'Water Supply Cut', icon: Droplet, tagClass: 'cs-alerts-tag-water' },
  power_cut: { label: 'Power Cut', icon: Zap, tagClass: 'cs-alerts-tag-power' },
  road_closure: { label: 'Road Closure', icon: Truck, tagClass: 'cs-alerts-tag-road' },
  waste_schedule: { label: 'Waste Collection', icon: Truck, tagClass: 'cs-alerts-tag-waste' },
  maintenance: { label: 'Scheduled Maintenance', icon: Wrench, tagClass: 'cs-alerts-tag-maint' },
  safety: { label: 'Safety Warning', icon: ShieldAlert, tagClass: 'cs-alerts-tag-safety' }
};

export default function AlertsPage() {
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(() => localStorage.getItem('cs_ward') || '');
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('cs_alert_lang') || 'en');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wards list
  useEffect(() => {
    fetch(`${API_BASE}/api/wards`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWards(Array.isArray(data) ? data : []))
      .catch(() => setWards([]));
  }, []);

  // Save selected ward and language to localStorage
  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
    if (wardId) {
      localStorage.setItem('cs_ward', wardId);
    } else {
      localStorage.removeItem('cs_ward');
    }
  };

  const handleLangChange = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('cs_alert_lang', lang);
  };

  const fetchAlerts = () => {
    setLoading(true);
    const url = selectedWard
      ? `${API_BASE}/api/alerts?ward=${encodeURIComponent(selectedWard)}`
      : `${API_BASE}/api/alerts`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);

        // Record read status for fetched alerts
        const clientId = getOrCreateClientId();
        const readAlerts = JSON.parse(localStorage.getItem('cs_read_alerts') || '[]');
        const updatedReadAlerts = [...new Set([...readAlerts])];

        data.forEach((alert) => {
          if (!updatedReadAlerts.includes(alert.id)) {
            updatedReadAlerts.push(alert.id);
            fetch(`${API_BASE}/api/alerts/${alert.id}/read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId })
            }).catch(() => {});
          }
        });

        localStorage.setItem('cs_read_alerts', JSON.stringify(updatedReadAlerts));
      })
      .catch((err) => {
        console.error('Error fetching alerts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedWard]);

  return (
    <div className="cs-alerts-page">
      {/* Header */}
      <div className="cs-alerts-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span className="gov-seal-box" style={{ background: '#0b2545', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            आधिकारिक सूचना केंद्र / OFFICIAL CIVIC ADVISORIES
          </span>
          <span className="badge badge-gov" style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            VERIFIED MUNICIPAL BROADCASTS
          </span>
        </div>
        <h1 className="cs-alerts-title">Civic Alerts & Notices</h1>
        <p className="cs-alerts-subtitle">
          Real-time official announcements, planned utility outages, road closures, and municipal services schedules targeted to your ward.
        </p>
      </div>

      {/* Control Bar: Ward Selector and Language Selector */}
      <div className="cs-alerts-control-bar">
        <div className="cs-alerts-control-group">
          <label className="cs-alerts-label">
            <MapPin size={15} className="text-amber-600" />
            <span>Target Jurisdiction / Ward:</span>
          </label>
          <select
            className="cs-alerts-select"
            value={selectedWard}
            onChange={(e) => handleWardChange(e.target.value)}
          >
            <option value="">Whole City Only (City-wide)</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="cs-alerts-control-group">
          <span className="cs-alerts-label">Announcement Language:</span>
          <div className="cs-alerts-lang-tabs">
            <button
              type="button"
              className={`cs-alerts-lang-tab ${currentLang === 'en' ? 'cs-alerts-lang-tab-active' : ''}`}
              onClick={() => handleLangChange('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`cs-alerts-lang-tab ${currentLang === 'hi' ? 'cs-alerts-lang-tab-active' : ''}`}
              onClick={() => handleLangChange('hi')}
            >
              हिन्दी
            </button>
            <button
              type="button"
              className={`cs-alerts-lang-tab ${currentLang === 'mr' ? 'cs-alerts-lang-tab-active' : ''}`}
              onClick={() => handleLangChange('mr')}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner (dismissible, only for critical alerts) */}
      <AlertBanner criticalAlerts={alerts} currentLang={currentLang} />

      {/* Alerts Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <span>Loading official announcements...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 0.5rem', display: 'block' }} />
          <h3>No Active Alerts for this Jurisdiction</h3>
          <p style={{ fontSize: '0.9rem' }}>
            There are currently no active emergency notices, road closures, or scheduled utility cuts reported for your selected area.
          </p>
        </div>
      ) : (
        <div className="cs-alerts-list">
          {alerts.map((alert) => {
            const typeConf = TYPE_CONFIG[alert.type] || {
              label: alert.type.replace('_', ' '),
              icon: Info,
              tagClass: 'cs-alerts-tag-maint'
            };
            const Icon = typeConf.icon;

            const isResolvedOrCancelled = alert.status === 'resolved' || alert.status === 'cancelled';
            const cardClass = `cs-alerts-card ${
              isResolvedOrCancelled
                ? 'cs-alerts-card-resolved'
                : alert.severity === 'critical'
                ? 'cs-alerts-card-critical'
                : alert.severity === 'warning'
                ? 'cs-alerts-card-warning'
                : 'cs-alerts-card-info'
            }`;

            // Multi-language text fallback to English
            const title = currentLang === 'hi' && alert.title_hi
              ? alert.title_hi
              : currentLang === 'mr' && alert.title_mr
              ? alert.title_mr
              : alert.title_en;

            const body = currentLang === 'hi' && alert.body_hi
              ? alert.body_hi
              : currentLang === 'mr' && alert.body_mr
              ? alert.body_mr
              : alert.body_en;

            return (
              <div key={alert.id} className={cardClass}>
                <div className="cs-alerts-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`cs-alerts-type-tag ${typeConf.tagClass}`}>
                      <Icon size={12} />
                      <span>{typeConf.label}</span>
                    </span>

                    {isResolvedOrCancelled ? (
                      <span className="cs-radar-badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                        {alert.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className={`cs-radar-badge cs-radar-badge-${alert.severity}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #{alert.id}
                  </span>
                </div>

                <h3 className="cs-alerts-card-title">{title}</h3>
                <p className="cs-alerts-card-body">{body}</p>

                {/* Affected Wards */}
                <div className="cs-alerts-wards-pills">
                  {alert.all_wards ? (
                    <span className="cs-alerts-ward-pill" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                      🌍 City-wide (All Wards Affected)
                    </span>
                  ) : alert.wards && alert.wards.length > 0 ? (
                    alert.wards.map((w) => (
                      <span key={w.id} className="cs-alerts-ward-pill">
                        📍 {w.name}
                      </span>
                    ))
                  ) : null}
                </div>

                {/* Timeline Change Log if present */}
                {alert.updates && alert.updates.length > 0 && (
                  <div className="cs-alerts-timeline">
                    <div className="cs-alerts-timeline-title">
                      <History size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      <span>Official Updates & Change Log:</span>
                    </div>
                    {alert.updates.map((u, i) => (
                      <div key={i} className="cs-alerts-timeline-entry">
                        <span>{u.note}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginLeft: '8px' }}>
                          ({new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Meta: Starts, Ends, In-App Views */}
                <div className="cs-alerts-card-meta">
                  <span className="cs-alerts-meta-item">
                    <Calendar size={13} />
                    <span>Effective: {new Date(alert.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </span>
                  {alert.ends_at && (
                    <span className="cs-alerts-meta-item">
                      <Clock size={13} />
                      <span>Until: {new Date(alert.ends_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
