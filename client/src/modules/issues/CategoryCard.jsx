// client/src/modules/issues/CategoryCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, AlertTriangle, Flame } from 'lucide-react';
import { getCategoryConfig } from '../../utils/civicHelpers';

export default function CategoryCard({ category, isMostReported = false }) {
  if (!category) return null;

  const catConfig = getCategoryConfig(category.id);
  const CatIcon = catConfig.icon;
  const isHighRisk = category.severity_weight >= 4 || category.id === 'cable';

  return (
    <div className="card category-card card-hover">
      <div className="category-header">
        <div
          className="category-icon-box"
          style={{ backgroundColor: catConfig.bgColor, color: catConfig.color }}
        >
          <CatIcon size={22} />
        </div>
        <div className="category-badges">
          {isHighRisk && (
            <span className="badge badge-critical">
              <AlertTriangle size={11} />
              Severity {category.severity_weight}/5
            </span>
          )}
          {isMostReported && (
            <span className="badge badge-high">
              <Flame size={11} />
              High Volume
            </span>
          )}
        </div>
      </div>

      <div className="category-body">
        <h3 className="category-title">{category.name}</h3>
        <p className="category-description">{category.description}</p>

        <div className="category-dept-tag">
          <Building2 size={12} className="text-slate-400" />
          <span>{category.authority_name || catConfig.department}</span>
        </div>
      </div>

      <div className="category-footer">
        <Link to={`/issues/${category.id}`} className="btn btn-secondary btn-sm">
          Safety Protocol
        </Link>
        <Link to={`/report/${category.id}`} className="btn btn-saffron btn-sm">
          Lodge Grievance <ArrowRight size={13} />
        </Link>
      </div>

      <style>{`
        .category-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
          background: #ffffff;
        }
        .category-card:hover {
          border-color: var(--primary-border);
          box-shadow: var(--shadow-sm);
        }
        .category-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.85rem;
          gap: 0.5rem;
        }
        .category-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .category-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.3rem;
        }
        .category-body {
          flex: 1;
        }
        .category-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.35rem;
          letter-spacing: -0.01em;
        }
        .category-description {
          font-size: 0.825rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 0.85rem;
        }
        .category-dept-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-subtle);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
          border: 1px solid var(--border);
        }
        .category-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
