// client/src/modules/issues/CategoryCard.jsx
// Owner: Sujal (Reused on Home page by Sahil)
import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ category, isMostReported = false }) {
  if (!category) return null;

  const isHighRisk = category.severity_weight >= 4 || category.id === 'cable';

  return (
    <div className="card category-card card-hover">
      <div className="category-header">
        <div className="category-icon-wrapper">
          <span className="category-emoji">{category.icon || '📌'}</span>
        </div>
        <div className="category-badges">
          {isMostReported && (
            <span className="badge badge-warning category-badge" title="High volume of recent citizen reports">
              🔥 Most Reported
            </span>
          )}
          {isHighRisk && (
            <span className="badge badge-critical category-badge">
              ⚠️ High Risk
            </span>
          )}
        </div>
      </div>

      <div className="category-body">
        <h3 className="category-title">{category.name}</h3>
        <p className="category-description">{category.description}</p>
        
        {category.authority_name && (
          <div className="category-dept">
            <span className="dept-label">Authority:</span>
            <span className="dept-name">{category.authority_name}</span>
          </div>
        )}
      </div>

      <div className="category-footer">
        <Link to={`/issues/${category.id}`} className="btn btn-secondary btn-sm">
          Learn more
        </Link>
        <Link to={`/report/${category.id}`} className="btn btn-primary btn-sm">
          Report this &rarr;
        </Link>
      </div>

      <style>{`
        .category-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          background: #ffffff;
        }
        .category-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        .category-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          flex-shrink: 0;
        }
        .category-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }
        .category-badge {
          font-size: 0.7rem;
          letter-spacing: 0.02em;
        }
        .category-body {
          flex: 1;
        }
        .category-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .category-description {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 0.85rem;
        }
        .category-dept {
          font-size: 0.775rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: #f8fafc;
          padding: 0.3rem 0.55rem;
          border-radius: var(--radius-sm);
          width: fit-content;
          margin-bottom: 1rem;
          border: 1px solid #f1f5f9;
        }
        .dept-label {
          font-weight: 600;
        }
        .category-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.9rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
