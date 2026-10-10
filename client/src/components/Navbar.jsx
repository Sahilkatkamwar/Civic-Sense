// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Issues', path: '/issues' },
    { label: 'Report Issue', path: '/report', highlight: true },
    { label: 'Track Complaint', path: '/track' },
    { label: 'Authority', path: '/authority', badge: 'Officer' }
  ];

  return (
    <header className="navbar-root">
      <div className="container nav-container">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">🏛️</span>
          <div className="brand-text">
            <span className="brand-title">Civic Sense</span>
            <span className="brand-tagline">Citizen Municipal Portal</span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation"
        >
          {isOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links */}
        <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <style>{`
        .navbar-root {
          background-color: #ffffff;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none !important;
        }
        .brand-icon {
          font-size: 1.85rem;
          background: #eff6ff;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .brand-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-link {
          padding: 0.5rem 0.9rem;
          font-size: 0.925rem;
          font-weight: 600;
          color: var(--text-muted);
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.15s ease;
          text-decoration: none !important;
        }
        .nav-link:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .nav-link.active {
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .nav-link.nav-highlight {
          background-color: var(--primary);
          color: #ffffff !important;
        }
        .nav-link.nav-highlight:hover {
          background-color: var(--primary-hover);
        }
        .nav-badge {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 700;
        }
        .mobile-toggle {
          display: none;
          background: none;
          border: 1px solid var(--border);
          padding: 0.4rem 0.75rem;
          font-size: 1.25rem;
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .mobile-toggle {
            display: block;
          }
          .nav-links {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            background: #ffffff;
            border-bottom: 1px solid var(--border);
            padding: 1rem 1.25rem 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            gap: 0.5rem;
          }
          .nav-links.open {
            display: flex;
          }
          .nav-link {
            width: 100%;
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </header>
  );
}
