// client/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="brand-icon">🏛️</span>
              <span className="brand-name">Civic Sense</span>
            </div>
            <p className="footer-desc">
              Empowering citizens to report municipal issues, automate smart duplicate detection,
              prioritize civic emergencies, and hold authorities accountable.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/issues">Browse Issues</Link></li>
                <li><Link to="/report">Report an Issue</Link></li>
                <li><Link to="/track">Track Status</Link></li>
                <li><Link to="/authority">Authority Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Core Capabilities</h4>
              <ul>
                <li><span>Perceptual Hash Duplicate Detection</span></li>
                <li><span>Algorithmic Dynamic Priority Score</span></li>
                <li><span>Multi-Department Smart Routing</span></li>
                <li><span>Citizen Verification & Tracking</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Civic Sense &mdash; Citizen Municipal Issue Resolution Portal.</p>
          <div className="footer-badge">
            <span className="live-dot"></span> System Live & Operational
          </div>
        </div>
      </div>

      <style>{`
        .footer-root {
          background-color: #0f172a;
          color: #f8fafc;
          padding: 3.5rem 0 1.5rem;
          margin-top: auto;
          border-top: 1px solid #1e293b;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 1.2fr 1.5fr;
          gap: 3rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid #1e293b;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        .footer-desc {
          color: #94a3b8;
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 380px;
        }
        .footer-links-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 2.5rem;
        }
        .footer-col h4 {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: 0.02em;
        }
        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer-col ul li {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }
        .footer-col ul li a {
          color: #94a3b8;
          transition: color 0.15s;
        }
        .footer-col ul li a:hover {
          color: #38bdf8;
          text-decoration: none;
        }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.5rem;
          font-size: 0.85rem;
          color: #64748b;
        }
        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #1e293b;
          color: #38bdf8;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #22c55e;
        }
        @media (max-width: 900px) {
          .footer-top {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .footer-links-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .footer-links-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
