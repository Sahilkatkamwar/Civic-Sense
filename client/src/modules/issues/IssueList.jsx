// client/src/modules/issues/IssueList.jsx
// Owner: Sujal (Issue Explorer Module)
import React, { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Group mapping for civic issue domains
const CATEGORY_GROUPS = {
  pothole: 'Road',
  garbage: 'Waste',
  tree: 'Other',
  cable: 'Safety',
  animal: 'Safety',
  other: 'Other'
};

export default function IssueList() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [filterHighRisk, setFilterHighRisk] = useState(false);
  const [mostReportedId, setMostReportedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Fetch categories
    fetch(`${API_BASE}/api/categories`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
      })
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // 2. Bonus: Fetch complaints to identify "Most reported right now" category
    fetch(`${API_BASE}/api/complaints`)
      .then((res) => (res.ok ? res.json() : []))
      .then((complaints) => {
        if (Array.isArray(complaints) && complaints.length > 0) {
          const counts = {};
          complaints.forEach((c) => {
            if (c.category_id) {
              counts[c.category_id] = (counts[c.category_id] || 0) + (c.report_count || 1);
            }
          });
          let maxCat = null;
          let maxCount = 0;
          for (const [catId, count] of Object.entries(counts)) {
            if (count > maxCount) {
              maxCount = count;
              maxCat = catId;
            }
          }
          setMostReportedId(maxCat);
        }
      })
      .catch(() => {
        // Non-blocking bonus check
      });
  }, []);

  const groups = ['All', 'Road', 'Waste', 'Safety', 'Other'];

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase());

    const group = CATEGORY_GROUPS[cat.id] || 'Other';
    const matchesGroup = selectedGroup === 'All' || group === selectedGroup;
    const matchesHighRisk = !filterHighRisk || cat.severity_weight >= 4 || cat.id === 'cable';

    return matchesSearch && matchesGroup && matchesHighRisk;
  });

  return (
    <div className="container page-wrapper">
      {/* Emergency Guidance Banner */}
      <div className="emergency-banner">
        <span className="emergency-icon">🚨</span>
        <div className="emergency-text">
          <strong>Immediate Life Safety Hazard?</strong> For active sparking or snapped high-voltage power cables, keep 10+ meters away and call the emergency grid desk immediately (<strong>1912 / 112</strong>).
        </div>
      </div>

      <div className="issues-header">
        <span className="badge badge-low">Issue Directory</span>
        <h1 className="page-title">Explore Civic Issues</h1>
        <p className="page-subtitle">
          Browse municipal issue categories, learn official response guidelines, understand which department resolves each problem, and report with one click.
        </p>
      </div>

      <div className="issues-controls">
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search issues by name or keyword (e.g. pothole, dangling cable, garbage)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-chips">
          {groups.map((grp) => (
            <button
              key={grp}
              className={`chip ${selectedGroup === grp && !filterHighRisk ? 'active' : ''}`}
              onClick={() => {
                setSelectedGroup(grp);
                setFilterHighRisk(false);
              }}
            >
              {grp}
            </button>
          ))}
          <button
            className={`chip chip-danger ${filterHighRisk ? 'active-danger' : ''}`}
            onClick={() => setFilterHighRisk(!filterHighRisk)}
          >
            ⚠️ High Risk Only
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid-3 categories-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card skeleton-card">
              <div className="skeleton-line skeleton-header"></div>
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-desc"></div>
              <div className="skeleton-line skeleton-desc short"></div>
              <div className="skeleton-line skeleton-footer"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card error-card">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredCategories.length === 0 && (
        <div className="card empty-card">
          <span className="empty-icon">🔎</span>
          <h3>No issues match your search</h3>
          <p>No civic issues match your current keywords or domain filters. Try resetting to view all categories.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedGroup('All');
              setFilterHighRisk(false);
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid-3 categories-grid">
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isMostReported={mostReportedId === cat.id}
            />
          ))}
        </div>
      )}

      <style>{`
        .emergency-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
          font-size: 0.9rem;
        }
        .emergency-icon {
          font-size: 1.35rem;
          flex-shrink: 0;
        }
        .emergency-text {
          line-height: 1.45;
        }
        .issues-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 2.5rem;
        }
        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0.5rem 0 0.75rem;
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          color: var(--text-muted);
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .issues-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .search-bar-wrapper {
          position: relative;
          flex: 1;
          min-width: 280px;
        }
        .search-icon {
          position: absolute;
          left: 1.1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #94a3b8;
        }
        .search-input {
          padding-left: 2.75rem !important;
          padding-right: 2.5rem !important;
          border-radius: var(--radius-full) !important;
        }
        .clear-search-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .chip {
          border: 1px solid var(--border-strong);
          background: #ffffff;
          padding: 0.45rem 0.95rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          color: var(--text-main);
        }
        .chip:hover {
          border-color: var(--primary);
        }
        .chip.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .chip-danger {
          border-color: #fca5a5;
          color: #b91c1c;
        }
        .chip-danger:hover {
          background: #fef2f2;
        }
        .chip-danger.active-danger {
          background: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
        }
        .empty-card, .error-card {
          text-align: center;
          padding: 3.5rem 1.5rem;
        }
        .empty-icon {
          font-size: 2.75rem;
          margin-bottom: 0.75rem;
          display: block;
        }
        /* Skeletons */
        .skeleton-card {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
        }
        .skeleton-line {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-sm);
        }
        .skeleton-header {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
        }
        .skeleton-title {
          width: 60%;
          height: 20px;
        }
        .skeleton-desc {
          width: 100%;
          height: 14px;
        }
        .skeleton-desc.short {
          width: 75%;
        }
        .skeleton-footer {
          width: 100%;
          height: 36px;
          margin-top: auto;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
