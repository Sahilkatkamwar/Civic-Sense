// client/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page-wrapper text-center">
      <div className="card" style={{ maxWidth: '540px', margin: '3rem auto', padding: '3rem 2rem' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏛️❓</span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>404 &mdash; Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
          The municipal page or service you are looking for does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          &larr; Return to Home Page
        </Link>
      </div>
    </div>
  );
}
