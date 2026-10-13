import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Clock,
  Ban,
  CheckCircle,
  LogOut,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import AlertForm from './AlertForm';
import './alerts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AlertsManagePage() {
  const [alerts, setAlerts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [extendAlert, setExtendAlert] = useState(null);
  const [extendDateTime, setExtendDateTime] = useState('');
  const [extendNote, setExtendNote] = useState('');
  const [official, setOfficial] = useState(null);

  const navigate = useNavigate();
  const token = sessionStorage.getItem('cs_official_token');

  const handleLogout = () => {
    sessionStorage.removeItem('cs_official_token');
    sessionStorage.removeItem('cs_official_user');
    navigate('/authority/login');
  };

  const fetchWards = () => {
    fetch(`${API_BASE}/api/wards`)
      .then((res) => res.json())
      .then((data) => setWards(data))
      .catch((err) => console.error('Error fetching wards:', err));
  };

  const fetchAlerts = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/alerts/manage/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading alerts for management:', err);
        setLoading(false);
      });
  };

  // Verify auth on mount
  useEffect(() => {
    if (!token) {
      navigate('/authority/login');
      return;
    }

    try {
      const user = JSON.parse(sessionStorage.getItem('cs_official_user') || '{}');
      setOfficial(user);
    } catch {
      // ignore
    }

    fetchWards();
    fetchAlerts();
  }, [token]);

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this alert as RESOLVED? Citizens will see the resolved status notice.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert: ' + err.message);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Reason for cancelling this alert:', 'Work postponed by department');
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchAlerts();
    } catch (err) {
      alert('Failed to cancel alert: ' + err.message);
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendDateTime) return;
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${extendAlert.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ endsAt: extendDateTime, note: extendNote })
      });
      if (res.ok) {
        setExtendAlert(null);
        setExtendDateTime('');
        setExtendNote('');
        fetchAlerts();
      }
    } catch (err) {
      alert('Failed to extend alert: ' + err.message);
    }
  };

  return (
    <div className="cs-alerts-admin-page">
      {/* Top Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Link to="/authority" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ArrowLeft size={13} />
              <span>Authority Command Desk</span>
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span className="gov-seal-pill" style={{ fontSize: '0.7rem' }}>
              OFFICIAL BROADCAST DESK
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--gov-navy)' }}>
            Civic Alerts Management Console
          </h1>
          {official && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Signed in as: <strong>{official.name}</strong> ({official.email})
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { setEditingAlert(null); setShowForm(true); }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Create New Alert</span>
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626', borderColor: '#fecaca' }}
            title="Log out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Engagement Stats Help Note (Honest Stats per spec) */}
      <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.75rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        📊 <strong>Engagement Metrics Note:</strong> "In-app views" represents unique citizen clients who viewed or received the announcement in the web app. SMS, Email, and Push Broadcast integrations are planned for future deployment phases.
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--gov-navy)' }} />
          <span>Loading municipal announcements...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <p>No alerts recorded yet. Click "Create New Alert" to publish your first announcement.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="cs-alerts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Jurisdiction</th>
                <th>Schedule</th>
                <th>In-App Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td><strong>#{alert.id}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{alert.type.replace('_', ' ')}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', maxWidth: 260 }}>
                      {alert.title_en}
                    </div>
                    {alert.title_hi && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {alert.title_hi}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`cs-radar-badge cs-radar-badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: alert.status === 'active' ? '#dcfce7' :
                                    alert.status === 'scheduled' ? '#e0f2fe' :
                                    alert.status === 'resolved' ? '#f1f5f9' :
                                    alert.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                        color: alert.status === 'active' ? '#166534' :
                               alert.status === 'scheduled' ? '#0369a1' :
                               alert.status === 'resolved' ? '#475569' :
                               alert.status === 'cancelled' ? '#991b1b' : '#374151'
                      }}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {alert.all_wards ? 'Whole City' : `${alert.wards?.length || 0} ward(s)`}
                  </td>
                  <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    <div>From: {new Date(alert.starts_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    {alert.ends_at && (
                      <div>To: {new Date(alert.ends_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    <span title="Unique in-app citizen reads">
                      👁️ {alert.stats?.reads ?? alert.readsCount ?? 0}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setEditingAlert(alert); setShowForm(true); }}
                        className="btn btn-outline"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        title="Edit Details"
                      >
                        <Edit2 size={12} />
                      </button>

                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={() => { setExtendAlert(alert); setExtendDateTime(alert.ends_at ? new Date(alert.ends_at).toISOString().slice(0, 16) : ''); }}
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            title="Extend Duration"
                          >
                            <Clock size={12} />
                          </button>
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#16a34a', borderColor: '#bbf7d0' }}
                            title="Mark Resolved"
                          >
                            <CheckCircle size={12} />
                          </button>
                          <button
                            onClick={() => handleCancel(alert.id)}
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fecaca' }}
                            title="Cancel Alert"
                          >
                            <Ban size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <AlertForm
          initialData={editingAlert}
          wards={wards}
          token={token}
          onSave={() => { setShowForm(false); setEditingAlert(null); fetchAlerts(); }}
          onCancel={() => { setShowForm(false); setEditingAlert(null); }}
        />
      )}

      {/* Extend Duration Modal */}
      {extendAlert && (
        <div className="cs-alerts-modal-overlay">
          <div className="cs-alerts-modal-content" style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--gov-navy)' }}>
              Extend Alert Duration #{extendAlert.id}
            </h3>
            <form onSubmit={handleExtendSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  New Expiration Date/Time:
                </label>
                <input
                  type="datetime-local"
                  required
                  className="cs-radar-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={extendDateTime}
                  onChange={(e) => setExtendDateTime(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Update Note for Citizens (Optional):
                </label>
                <input
                  type="text"
                  className="cs-radar-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={extendNote}
                  onChange={(e) => setExtendNote(e.target.value)}
                  placeholder="e.g. Repairs prolonged due to heavy rainfall"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setExtendAlert(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
