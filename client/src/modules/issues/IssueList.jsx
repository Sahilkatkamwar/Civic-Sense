// client/src/modules/issues/IssueList.jsx
// Owner: Sujal (Issue Explorer Module)
import React, { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function IssueList() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, []);

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase());
    
    if (filterSeverity === 'high') {
      return matchesSearch && cat.severity_weight >= 4;
    }
    return matchesSearch;
  });

  return (
    <div className="container page-wrapper">
      <div className="issues-header">
        <span className="badge badge-low">Issue Directory</span>
        <h1 className="page-title">Explore Civic Issues</h1>
        <p className="page-subtitle">
          Select an issue type below to read safety guidance, learn which municipal department handles it,
          and file an official citizen report.
        </p>
      </div>

      <div className="issues-controls">
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search issues (e.g. pothole, dangling cable, garbage)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <button
            className={`chip ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            All Issues ({categories.length})
          </button>
          <button
            className={`chip ${filterSeverity === 'high' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('high')}
          >
            High Priority Only ⚡
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading civic categories...</p>
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
          <h3>No matching issues found</h3>
          <p>Try searching for a different keyword or view all issues.</p>
          <button onClick={() => { setSearch(''); setFilterSeverity('all'); }} className="btn btn-secondary btn-sm">
            Reset Search
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid-3 categories-grid">
          {filteredCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}

      <style>{`
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
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .search-bar-wrapper {
          position: relative;
          flex: 1;
          min-width: 280px;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
        }
        .search-input {
          padding-left: 2.75rem !important;
          border-radius: var(--radius-full) !important;
        }
        .filter-chips {
          display: flex;
          gap: 0.5rem;
        }
        .chip {
          border: 1px solid var(--border-strong);
          background: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .chip.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .loading-state, .empty-card, .error-card {
          text-align: center;
          padding: 3rem 1.5rem;
        }
        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          display: block;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
