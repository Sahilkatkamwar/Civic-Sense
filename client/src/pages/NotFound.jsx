// client/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Layers } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container page-wrapper text-center">
      <div className="card notfound-card">
        <div className="notfound-icon-circle">
          <AlertCircle size={36} className="text-sky-600" />
        </div>
        <h1 className="notfound-title">404 &mdash; Page Not Found</h1>
        <p className="notfound-desc">
          The requested municipal operations route or portal service does not exist or has been relocated.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={15} /> Return to Overview
          </Link>
          <Link to="/incidents" className="btn btn-primary">
            <Layers size={15} /> View Incident Registry
          </Link>
        </div>
      </div>

      <style>{`
        .notfound-card {
          max-width: 520px;
          margin: 3rem auto;
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .notfound-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .notfound-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .notfound-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.55;
          margin-bottom: 1.75rem;
        }
        .notfound-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
