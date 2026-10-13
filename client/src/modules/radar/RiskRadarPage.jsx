// client/src/modules/radar/RiskRadarPage.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Filter } from 'lucide-react';
import RiskMap from './RiskMap';
import ClusterPanel from './ClusterPanel';
import './radar.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function RiskRadarPage() {
  const [radarData, setRadarData] = useState({ clusters: [] });
  const [categories, setCategories] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMinLevel, setFilterMinLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formulaOpen, setFormulaOpen] = useState(false);

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const fetchRadar = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filterCategory !== 'all') params.append('category', filterCategory);
    if (filterMinLevel !== 'all') params.append('minLevel', filterMinLevel);

    fetch(`${API_BASE}/api/risk-radar?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load risk radar data');
        return res.json();
      })
      .then((data) => {
        setRadarData(data);
        if (data.clusters && data.clusters.length > 0) {
          // If previous selection is still present, keep it, otherwise select highest risk cluster
          if (selectedCluster) {
            const found = data.clusters.find((c) => c.id === selectedCluster.id);
            setSelectedCluster(found || data.clusters[0]);
          } else {
            setSelectedCluster(data.clusters[0]);
          }
        } else {
          setSelectedCluster(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching risk radar:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRadar();
  }, [filterCategory, filterMinLevel]);

  return (
    <div className="cs-radar-page">
      {/* Header */}
      <div className="cs-radar-header">
        <div className="cs-radar-title-row">
          <span className="gov-seal-box" style={{ background: '#0b2545', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            DISPATCH INTELLIGENCE &bull; WARD SURVEILLANCE
          </span>
          <span className="badge badge-gov" style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            STATUTORY RISK TRIAGE
          </span>
        </div>
        <h1 className="cs-radar-title">Civic Risk Radar</h1>
        <p className="cs-radar-subtitle">
          Automated spatial clustering and explainable risk scoring for emerging municipal hazards across ward jurisdictions.
        </p>
      </div>

      {/* Top Filter Toolbar */}
      <div className="cs-radar-toolbar">
        <div className="cs-radar-filters">
          <div className="cs-radar-filter-item">
            <Filter size={14} />
            <span>Category:</span>
            <select
              className="cs-radar-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cs-radar-filter-item">
            <span>Min Risk Level:</span>
            <select
              className="cs-radar-select"
              value={filterMinLevel}
              onChange={(e) => setFilterMinLevel(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="critical">🔴 Critical Only (75+)</option>
              <option value="high">🟠 High & Above (55+)</option>
              <option value="medium">🟡 Medium & Above (30+)</option>
              <option value="low">🟢 Low & Above (0+)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="cs-radar-stats">
            <strong>{radarData.clusters?.length || 0}</strong> cluster(s) detected ({radarData.radiusMeters || 150}m threshold)
          </span>
          <button
            onClick={fetchRadar}
            className="btn btn-outline"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Refresh radar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && !radarData.clusters ? (
        <div className="cs-radar-loading">
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gov-navy)' }} />
          <h3>Analyzing Spatial Clusters...</h3>
          <p>Processing open complaint coordinates and recurrence patterns across wards.</p>
        </div>
      ) : error ? (
        <div className="cs-radar-error">
          <p style={{ color: 'var(--critical-indicator, #dc2626)', fontWeight: 600 }}>Error: {error}</p>
          <button onClick={fetchRadar} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Try Again
          </button>
        </div>
      ) : radarData.clusters && radarData.clusters.length === 0 ? (
        <div className="card cs-radar-empty">
          <div className="cs-radar-empty-icon">🛡️</div>
          <h3>No emerging risks right now.</h3>
          <p>No complaints are currently clustering above the minimum signals threshold in this view.</p>
        </div>
      ) : (
        <div className="cs-radar-layout">
          <RiskMap
            clusters={radarData.clusters}
            selectedCluster={selectedCluster}
            onSelectCluster={(c) => setSelectedCluster(c)}
          />
          <ClusterPanel cluster={selectedCluster} />
        </div>
      )}

      {/* "How is this calculated?" Collapsible */}
      <div className="cs-radar-collapsible">
        <div
          className="cs-radar-collapsible-summary"
          onClick={() => setFormulaOpen(!formulaOpen)}
          role="button"
          tabIndex={0}
        >
          <span>📐 How is the Civic Risk Radar calculated?</span>
          {formulaOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {formulaOpen && (
          <div className="cs-radar-collapsible-content">
            <p>
              The Civic Risk Radar groups open complaints of the same category using spatial clustering (DBSCAN single-link expansion within <strong>150 meters</strong>).
              Clusters with at least <strong>3 citizen signals</strong> are scored on a deterministic 0–100 scale using four transparent, explainable factors:
            </p>

            <table className="cs-radar-formula-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Max Points</th>
                  <th>Formula & Statutory Logic</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1. Severity</strong></td>
                  <td>25 pts</td>
                  <td>Category statutory weight (1 to 5) &times; 5 points. Evaluates inherent danger to human life or infrastructure.</td>
                </tr>
                <tr>
                  <td><strong>2. Report Density</strong></td>
                  <td>30 pts</td>
                  <td><code>min(30, signals &times; 6)</code>. Reflects citizen report volume clustering in close proximity.</td>
                </tr>
                <tr>
                  <td><strong>3. Recurrence</strong></td>
                  <td>20 pts</td>
                  <td><code>min(20, resolved_nearby_90d &times; 7)</code>. Rewards or flags recurring failures at previously repaired locations.</td>
                </tr>
                <tr>
                  <td><strong>4. Time Unresolved</strong></td>
                  <td>25 pts</td>
                  <td><code>min(25, oldest_open_days &times; 3)</code>. Penalizes unattended complaints exceeding statutory response service levels.</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <strong>Score Thresholds:</strong>
              <span style={{ marginLeft: '0.75rem' }}>🟢 0–29: <strong>Low</strong></span>
              <span style={{ marginLeft: '0.75rem' }}>🟡 30–54: <strong>Medium</strong></span>
              <span style={{ marginLeft: '0.75rem' }}>🟠 55–74: <strong>High</strong></span>
              <span style={{ marginLeft: '0.75rem' }}>🔴 75–100: <strong>Critical</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer Line */}
      <div className="cs-radar-disclaimer">
        ⚠️ <strong>Statutory Disclaimer:</strong> Risk levels are estimates calculated from reported data using the formula above. They are not predictions of accidents.
      </div>
    </div>
  );
}
