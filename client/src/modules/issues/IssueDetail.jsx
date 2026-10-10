// client/src/modules/issues/IssueDetail.jsx
// Owner: Sujal (Issue Explorer Module)
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function IssueDetail() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories/${categoryId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Category '${categoryId}' not found`);
        return res.json();
      })
      .then((data) => {
        setCategory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [categoryId]);

  if (loading) {
    return (
      <div className="container page-wrapper text-center">
        <div className="spinner"></div>
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container page-wrapper">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h2>Category Not Found</h2>
          <p style={{ margin: '1rem 0' }}>The requested issue category "{categoryId}" does not exist.</p>
          <Link to="/issues" className="btn btn-primary">
            &larr; Back to All Issues
          </Link>
        </div>
      </div>
    );
  }

  // Parse guidance DO / DONT
  const guidanceText = category.guidance || '';
  const doMatch = guidanceText.match(/DO:\s*(.*?)(?=DONT:|$)/i);
  const dontMatch = guidanceText.match(/DONT:\s*(.*?)$/i);

  const doItems = doMatch ? doMatch[1].trim() : 'Take clear photos from a safe vantage point and provide exact landmarks.';
  const dontItems = dontMatch ? dontMatch[1].trim() : 'Do not endanger personal safety or disrupt active vehicular traffic.';

  return (
    <div className="container page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/issues" className="btn btn-secondary btn-sm">
          &larr; Back to all issues
        </Link>
      </div>

      <div className="issue-hero card">
        <div className="issue-hero-top">
          <div className="issue-icon-big">{category.icon || '📌'}</div>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-low">Category</span>
              {category.severity_weight >= 4 && (
                <span className="badge badge-critical">High Severity ({category.severity_weight}/5)</span>
              )}
            </div>
            <h1 className="issue-title">{category.name}</h1>
          </div>
        </div>
        <p className="issue-desc-large">{category.description}</p>

        <div className="issue-action-bar">
          <Link to={`/report/${category.id}`} className="btn btn-primary btn-lg">
            🚨 Report this Issue Now
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '2rem' }}>
        {/* Safety & Reporting Guidance */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span>📋</span> Citizen Guidance & Safety Tips
          </h3>

          <div className="guidance-box guidance-do">
            <h4 style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>✅</span> DO
            </h4>
            <p style={{ marginTop: '0.35rem', color: '#14532d' }}>{doItems}</p>
          </div>

          <div className="guidance-box guidance-dont" style={{ marginTop: '1rem' }}>
            <h4 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>❌</span> DON'T
            </h4>
            <p style={{ marginTop: '0.35rem', color: '#7f1d1d' }}>{dontItems}</p>
          </div>
        </div>

        {/* Responsible Department & SLA */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span>🏢</span> Department & Handling
          </h3>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned Department</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {category.authority_name || 'Municipal Field Operations'}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {category.authority_department || 'City Public Works'}
            </p>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <h4>⚖️ How Priority is Decided</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: '1.6' }}>
              Priority is calculated in real-time based on the base category severity weight ({category.severity_weight}/5),
              the cumulative number of citizen reports, days elapsed, and verified on-site photo authenticity.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .issue-hero {
          padding: 2.25rem;
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
          border: 1px solid var(--border-strong);
        }
        .issue-hero-top {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1rem;
        }
        .issue-icon-big {
          font-size: 3rem;
          width: 76px;
          height: 76px;
          background: #ffffff;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .issue-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .issue-desc-large {
          font-size: 1.15rem;
          color: var(--text-muted);
          max-width: 800px;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .issue-action-bar {
          display: flex;
          gap: 1rem;
        }
        .guidance-box {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
        }
        .guidance-do {
          background-color: #f0fdf4;
          border-left: 4px solid #22c55e;
        }
        .guidance-dont {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
        }
      `}</style>
    </div>
  );
}
