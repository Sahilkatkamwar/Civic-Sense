// client/src/modules/issues/IssueList.jsx
// Municipal Issue Explorer & Safety Protocols Directory
import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Zap,
  ShieldAlert
} from 'lucide-react';
import CategoryCard from './CategoryCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORY_GROUPS = {
  pothole: 'Roads',
  garbage: 'Sanitation',
  tree: 'Parks & Environment',
  cable: 'Electrical Safety',
  animal: 'Public Health',
  other: 'General Civic'
};

export default function IssueList() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [filterHighRisk, setFilterHighRisk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  const groups = ['All', 'Roads', 'Sanitation', 'Electrical Safety', 'Parks & Environment', 'Public Health', 'General Civic'];

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase());

    const group = CATEGORY_GROUPS[cat.id] || 'General Civic';
    const matchesGroup = selectedGroup === 'All' || group === selectedGroup;
    const matchesHighRisk = !filterHighRisk || cat.severity_weight >= 4 || cat.id === 'cable';

    return matchesSearch && matchesGroup && matchesHighRisk;
  });

  return (
    <div className="container page-wrapper">
      {/* Emergency Guidance Banner */}
      <div className="emergency-guidance-banner">
        <div className="em-banner-icon-box">
          <Zap size={20} className="text-red-600" />
        </div>
        <div className="em-banner-content">
          <strong>Immediate Life Safety Hazard?</strong> For active sparking or snapped high-voltage power cables, keep at least 10 meters away and call the emergency grid desk immediately (<strong>1912 / 112</strong>).
        </div>
      </div>

      {/* Header */}
      <div className="issues-header">
        <div className="breadcrumb-row">
          <span>नागरिक अधिकार पत्र / Citizen Services</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">नागरिक चार्टर एवं सुरक्षा संदर्शिका / Citizen Charter</span>
        </div>
        <div className="gov-seal-box" style={{ marginBottom: '0.5rem' }}>
          मानक संचालन प्रक्रिया / STANDARD OPERATING PROCEDURES (SOP)
        </div>
        <h1 className="page-heading">Citizen Charter & Municipal Safety Protocols</h1>
        <p className="page-subtitle">
          Statutory hazard classifications, safety guidelines for citizens, responsible municipal departments, and legal SLA redressal limits under urban local body regulations.
        </p>
      </div>

      {/* Search & Group Filters */}
      <div className="issues-filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search hazard by keyword (pothole, wire, garbage)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="group-chips-scroll">
          {groups.map((grp) => (
            <button
              key={grp}
              type="button"
              className={`group-chip ${selectedGroup === grp ? 'group-chip-active' : ''}`}
              onClick={() => setSelectedGroup(grp)}
            >
              {grp}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`filter-toggle-btn ${filterHighRisk ? 'filter-toggle-active' : ''}`}
          onClick={() => setFilterHighRisk(!filterHighRisk)}
        >
          <AlertTriangle size={13} />
          <span>High Severity Only</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center" style={{ padding: '3rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading hazard directory...</p>
        </div>
      ) : loadError ? (
        <div className="card text-center" style={{ padding: '2.5rem 1rem' }}>
          <AlertTriangle size={32} className="text-red-500 mb-2 mx-auto" />
          <h3>Failed to load hazard directory</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>{loadError}</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1rem' }}>
          <ShieldAlert size={36} className="text-slate-400 mb-2 mx-auto" />
          <h3>No categories match your criteria</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Try resetting your search query or selecting "All" categories.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}

      <style>{`
        .emergency-guidance-banner {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--radius-md);
          padding: 0.85rem 1.25rem;
          margin-bottom: 2rem;
          font-size: 0.85rem;
          color: #991b1b;
        }
        .em-banner-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .em-banner-content strong {
          color: #7f1d1d;
        }
        .issues-header {
          margin-bottom: 1.75rem;
        }
        .issues-filter-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 280px;
        }
        .search-box .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }
        .search-box .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2rem;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          background: #ffffff;
        }
        .group-chips-scroll {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          flex: 1;
        }
        .group-chip {
          background-color: #ffffff;
          border: 1px solid var(--border);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .group-chip:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .group-chip-active {
          background-color: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
          font-weight: 600;
        }
        .filter-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          background: #ffffff;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-toggle-active {
          background-color: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}
