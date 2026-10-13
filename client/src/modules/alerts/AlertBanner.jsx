// client/src/modules/alerts/AlertBanner.jsx
import React, { useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';

export default function AlertBanner({ criticalAlerts = [], currentLang = 'en' }) {
  const [dismissedIds, setDismissedIds] = useState([]);

  const activeCritical = criticalAlerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active' && !dismissedIds.includes(a.id)
  );

  if (activeCritical.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
      {activeCritical.map((alert) => {
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
          <div key={alert.id} className="cs-alerts-banner-critical">
            <div className="cs-alerts-banner-content">
              <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>CRITICAL CIVIC ADVISORY: {title}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>{body}</p>
              </div>
            </div>
            <button
              onClick={() => setDismissedIds((prev) => [...prev, alert.id])}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#991b1b',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
