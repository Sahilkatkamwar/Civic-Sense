// client/src/modules/alerts/AlertBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getOrCreateClientId } from './alertUtils';
import './alerts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AlertBell() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlertsSummary = () => {
    const savedWard = localStorage.getItem('cs_ward');
    const url = savedWard
      ? `${API_BASE}/api/alerts?ward=${encodeURIComponent(savedWard)}`
      : `${API_BASE}/api/alerts`;

    fetch(url)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) return;
        setAlerts(data);

        // Check read IDs in localStorage
        const readIds = JSON.parse(localStorage.getItem('cs_read_alerts') || '[]');
        const unread = data.filter((a) => !readIds.includes(a.id));
        setUnreadCount(unread.length);
      })
      .catch(() => {
        // Silently handle offline/reconnecting state to prevent console spam
      });
  };

  useEffect(() => {
    fetchAlertsSummary();
    const interval = setInterval(fetchAlertsSummary, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAlertClick = (alert) => {
    const clientId = getOrCreateClientId();
    const readIds = JSON.parse(localStorage.getItem('cs_read_alerts') || '[]');
    if (!readIds.includes(alert.id)) {
      const updated = [...readIds, alert.id];
      localStorage.setItem('cs_read_alerts', JSON.stringify(updated));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      fetch(`${API_BASE}/api/alerts/${alert.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      }).catch(() => {});
    }
    setDropdownOpen(false);
  };

  return (
    <div className="cs-alerts-bell-container" ref={containerRef}>
      <button
        type="button"
        className="cs-alerts-bell-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Civic Alerts & Notices"
        aria-label="Civic Alerts & Notices"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="cs-alerts-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="cs-alerts-dropdown">
          <div className="cs-alerts-dropdown-header">
            <span>📢 Recent Civic Alerts</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {unreadCount} unread
            </span>
          </div>

          <div className="cs-alerts-dropdown-list">
            {alerts.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No active announcements
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => {
                const readIds = JSON.parse(localStorage.getItem('cs_read_alerts') || '[]');
                const isRead = readIds.includes(alert.id);

                return (
                  <Link
                    key={alert.id}
                    to="/alerts"
                    className={`cs-alerts-dropdown-item ${!isRead ? 'cs-alerts-dropdown-item-unread' : ''}`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="cs-alerts-dropdown-title">
                      {!isRead && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                      )}
                      <span>{alert.title_en}</span>
                    </div>
                    <div className="cs-alerts-dropdown-time">
                      <span>{new Date(alert.starts_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span style={{ margin: '0 4px' }}>&bull;</span>
                      <span style={{ textTransform: 'capitalize' }}>{alert.severity}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="cs-alerts-dropdown-footer">
            <Link to="/alerts" onClick={() => setDropdownOpen(false)}>
              View All Alerts &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
