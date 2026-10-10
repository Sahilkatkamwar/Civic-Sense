// client/src/modules/issues/CategoryCard.jsx
// Owner: Sujal (Reused on Home page by Sahil)
import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  if (!category) return null;

  const isHighRisk = category.severity_weight >= 4;

  return (
    <div className="card category-card card-hover">
      <div className="category-header">
        <div className="category-icon-wrapper">
          <span className="category-emoji">{category.icon || '📌'}</span>
        </div>
        {isHighRisk && (
          <span className="badge badge-critical category-risk-badge">
            High Priority
          </span>
        )}
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
          Learn More
        </Link>
        <Link to={`/report/${category.id}`} className="btn btn-primary btn-sm">
          Report This &rarr;
        </Link>
      </div>

      <style>{`
        .category-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
        }
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .category-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }
        .category-risk-badge {
          font-size: 0.7rem;
        }
        .category-body {
          flex: 1;
        }
        .category-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .category-description {
          font-size: 0.88rem;
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
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          width: fit-content;
          margin-bottom: 1rem;
        }
        .dept-label {
          font-weight: 600;
        }
        .category-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
