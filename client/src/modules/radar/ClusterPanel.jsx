// client/src/modules/radar/ClusterPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Layers, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ClusterPanel({ cluster }) {
  if (!cluster) {
    return (
      <div className="cs-radar-panel cs-radar-empty">
        <div className="cs-radar-empty-icon">🎯</div>
        <h4 style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>No Cluster Selected</h4>
        <p style={{ fontSize: '0.85rem' }}>
          Click on any emerging hazard circle on the map to inspect its explainable risk score, member complaints, and recommended official action.
        </p>
      </div>
    );
  }

  const {
    categoryName,
    categoryIcon,
    score,
    level,
    factors,
    recommendation,
    inspectFirst,
    signals,
    complaintCount,
    radius,
    oldestOpenDays,
    recurrence,
    complaints = []
  } = cluster;

  const levelBadgeClass = `cs-radar-badge cs-radar-badge-${level}`;

  return (
    <div className="cs-radar-panel">
      {/* Cluster Header */}
      <div className="cs-radar-cluster-header">
        <div className="cs-radar-score-container">
          <span className={levelBadgeClass}>
            {level.toUpperCase()} RISK
          </span>
          <div className="cs-radar-score-box">
            <span className="cs-radar-score-num" style={{
              color: level === 'critical' ? 'var(--critical-indicator, #dc2626)' :
                     level === 'high' ? 'var(--high-indicator, #ea580c)' :
                     level === 'medium' ? 'var(--medium-indicator, #d97706)' :
                     'var(--low-indicator, #16a34a)'
            }}>
              {score}
            </span>
            <span className="cs-radar-score-max">/ 100</span>
          </div>
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--gov-navy, #0b2545)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{categoryIcon || '📍'}</span>
          <span>{categoryName} Cluster</span>
        </h3>

        <div className="cs-radar-meta-row">
          <span className="cs-radar-meta-item" title="Citizen Signals">
            <Layers size={13} />
            <span><strong>{signals}</strong> signals ({complaintCount} reports)</span>
          </span>
          <span className="cs-radar-meta-item" title="Cluster Radius">
            <MapPin size={13} />
            <span>~{radius} m radius</span>
          </span>
          <span className="cs-radar-meta-item" title="Oldest Open Issue">
            <Clock size={13} />
            <span>Oldest: {oldestOpenDays}d</span>
          </span>
          {recurrence > 0 && (
            <span className="cs-radar-meta-item" title="Recurred Issue" style={{ color: 'var(--gov-saffron, #c2410c)', fontWeight: 600 }}>
              <span>🔄 {recurrence} resolved in 90d</span>
            </span>
          )}
        </div>
      </div>

      {/* Recommended Action */}
      <div className="cs-radar-section">
        <div className="cs-radar-section-title">Recommended Official Action</div>
        <div className="cs-radar-rec-box">
          {recommendation}
        </div>
        {inspectFirst && (
          <Link
            to={`/track/${inspectFirst}`}
            className="cs-radar-inspect-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Priority Inspection: #{inspectFirst}</span>
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Factor Breakdown */}
      <div className="cs-radar-section">
        <div className="cs-radar-section-title">Explainable Factor Breakdown</div>
        <div className="cs-radar-factors-list">
          {factors && factors.map((f, idx) => {
            const pct = Math.min(100, Math.round((f.points / f.max) * 100));
            return (
              <div key={idx} className="cs-radar-factor-row">
                <div className="cs-radar-factor-header">
                  <span>{f.name}</span>
                  <span>{f.points} / {f.max} pts</span>
                </div>
                <div className="cs-radar-factor-bar-bg">
                  <div
                    className="cs-radar-factor-bar-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: level === 'critical' ? 'var(--critical-indicator, #dc2626)' :
                                       level === 'high' ? 'var(--high-indicator, #ea580c)' :
                                       level === 'medium' ? 'var(--medium-indicator, #d97706)' :
                                       'var(--low-indicator, #16a34a)'
                    }}
                  />
                </div>
                <div className="cs-radar-factor-exp">{f.explanation}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Complaints List */}
      <div className="cs-radar-section" style={{ marginBottom: 0 }}>
        <div className="cs-radar-section-title">
          Member Complaints ({complaints.length})
        </div>
        <div className="cs-radar-members-list">
          {complaints.map((c) => {
            const isInspectTarget = c.id === inspectFirst;
            const photoUrl = c.photo_path
              ? (c.photo_path.startsWith('http') ? c.photo_path : `${API_BASE}${c.photo_path}`)
              : null;

            return (
              <div
                key={c.id}
                className="cs-radar-member-item"
                style={isInspectTarget ? { border: '1.5px solid var(--gov-saffron, #c2410c)', background: '#fff7ed' } : {}}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Complaint thumbnail" className="cs-radar-thumb" />
                ) : (
                  <div className="cs-radar-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📷
                  </div>
                )}
                <div className="cs-radar-member-info">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="cs-radar-member-id">{c.id}</span>
                    {isInspectTarget && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--gov-saffron, #c2410c)', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        INSPECT FIRST
                      </span>
                    )}
                  </div>
                  <div className="cs-radar-member-desc">{c.description || 'No description'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    <span>{c.report_count || 1} report(s)</span>
                    <Link to={`/track/${c.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--primary)' }}>
                      <span>View</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
