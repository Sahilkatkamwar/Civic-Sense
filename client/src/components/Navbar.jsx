// client/src/components/Navbar.jsx
// Official Government E-Governance Navigation & Topbar
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Layers,
  BarChart3,
  PlusCircle,
  Search,
  BookOpen,
  Menu,
  X,
  Shield,
  Activity,
  Landmark,
  PhoneCall,
  Bell,
  Globe
} from 'lucide-react';
import AlertBell from '../modules/alerts/AlertBell';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFontSizeChange = (size) => {
    if (size === 'sm') {
      document.documentElement.style.fontSize = '14px';
    } else if (size === 'lg') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  const navLinks = [
    {
      to: '/',
      label: 'मुख्य पृष्ठ / Overview',
      shortLabel: 'Overview',
      icon: Activity,
      end: true
    },
    {
      to: '/incidents',
      label: 'शिकायत रजिस्टर / Incidents',
      shortLabel: 'Incidents',
      icon: Layers
    },
    {
      to: '/authority',
      label: 'अधिकारी नियंत्रण / Authority Desk',
      shortLabel: 'Authority Desk',
      icon: Shield
    },
    {
      to: '/analytics',
      label: 'प्रशासनिक आंकड़े / Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3
    },
    {
      to: '/report',
      label: 'शिकायत दर्ज करें / Lodge Complaint',
      shortLabel: 'Lodge Complaint',
      icon: PlusCircle
    },
    {
      to: '/track',
      label: 'स्थिति जांचें / Track Status',
      shortLabel: 'Track Status',
      icon: Search
    },
    {
      to: '/issues',
      label: 'नागरिक चार्टर / Citizen Charter',
      shortLabel: 'Citizen Charter',
      icon: BookOpen
    },
    {
      to: '/alerts',
      label: 'नागरिक सूचनाएं / Alerts',
      shortLabel: 'Alerts',
      icon: Bell
    }
  ];

  return (
    <header className="navbar-root">
      {/* 1. Official Government Topbar */}
      <div className="gov-topbar">
        <div className="gov-topbar-container">
          <div className="gov-topbar-left">
            <div className="gov-emblem-badge">
              <Landmark size={14} className="text-amber-400" />
              <span>भारत सरकार | Government of India</span>
            </div>
            <span className="gov-sep">|</span>
            <span className="gov-ministry-text">
              आवासन और शहरी कार्य मंत्रालय | Ministry of Housing & Urban Affairs
            </span>
          </div>

          <div className="gov-topbar-right">
            <div className="gov-helpline-chip">
              <PhoneCall size={12} className="text-amber-300" />
              <span>हेल्पलाइन: 1912 (बिजली) / 112 (आपातकाल)</span>
            </div>

            <span className="gov-sep">|</span>

            {/* Accessibility Controls */}
            <div className="gov-accessibility-controls" title="Screen Accessibility">
              <button
                type="button"
                className="gov-a-btn"
                onClick={() => handleFontSizeChange('sm')}
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                type="button"
                className="gov-a-btn"
                onClick={() => handleFontSizeChange('normal')}
                title="Reset Font Size"
              >
                A
              </button>
              <button
                type="button"
                className="gov-a-btn"
                onClick={() => handleFontSizeChange('lg')}
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            <span className="gov-sep">|</span>

            <div className="gov-lang-select">
              <Globe size={12} />
              <span>English / हिन्दी</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tricolor Ribbon */}
      <div className="gov-tricolor-stripe"></div>

      {/* 3. Main Sovereign Navy Navigation Header */}
      <div className="gov-main-nav">
        <div className="nav-container">
          {/* Official Emblem & Platform Brand */}
          <Link to="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="gov-emblem-seal">
              <Shield className="w-6 h-6 text-amber-400" size={24} />
            </div>
            <div className="brand-info">
              <div className="brand-name-row">
                <span className="brand-name">CIVIC-SENSE</span>
                <span className="gov-seal-pill">GOVERNMENT OF INDIA ALIGNED</span>
              </div>
              <span className="brand-subtitle">
                राष्ट्रीय नागरिक समाधान पोर्टल | Central Public Grievance Redressal System
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="desktop-nav">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                >
                  <Icon size={14} className="nav-icon" />
                  <span>{item.shortLabel}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Status Badge & Mobile Toggle */}
          <div className="nav-right-meta">
            <AlertBell />
            <div className="gov-status-pill" title="Public Service Guarantee Act Redressal Engine Online">
              <span className="live-dot pulse-ring"></span>
              <span className="status-text">PORTAL LIVE &bull; 24x7 REDRESSAL</span>
            </div>

            {/* Mobile hamburger */}
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Official Notice Ticker */}
      <div className="gov-notice-banner">
        <div className="gov-notice-inner">
          <div className="gov-notice-text">
            <span className="gov-notice-tag">आधिकारिक सूचना / PUBLIC NOTICE</span>
            <Bell size={13} className="text-amber-700" />
            <span>
              All municipal complaints filed on this portal are governed by the <strong>Public Services Guarantee Act 2011</strong>. Emergency electrical, sewage & road hazards undergo prioritized automated field inspection within 24–48 hours.
            </span>
          </div>
          <div className="gov-toll-free-badge">
            टोल-फ्री: 1800-11-4000
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-nav-inner">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .navbar-root {
          background-color: var(--gov-navy);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(11, 37, 69, 0.15);
        }

        /* Top Government Bar */
        .gov-topbar {
          background-color: var(--gov-navy-dark);
          color: #cbd5e1;
          font-size: 0.72rem;
          padding: 0.35rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gov-topbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }
        .gov-topbar-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-weight: 500;
        }
        .gov-emblem-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #f8fafc;
          font-weight: 700;
        }
        .gov-ministry-text {
          color: #94a3b8;
        }
        .gov-sep {
          color: rgba(255, 255, 255, 0.2);
        }
        .gov-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .gov-helpline-chip {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #fde68a;
          font-weight: 600;
        }
        .gov-accessibility-controls {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .gov-a-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          padding: 1px 5px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
        }
        .gov-a-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .gov-lang-select {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #ffffff;
          font-weight: 600;
        }

        /* Main Nav */
        .gov-main-nav {
          background-color: var(--gov-navy);
          border-bottom: 2px solid var(--gov-gold);
        }
        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
          gap: 0.85rem;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }
        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: inherit;
          text-decoration: none !important;
          flex-shrink: 0;
        }
        .gov-emblem-seal {
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #133b6b 0%, #07192f 100%);
          border: 2px solid #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          flex-shrink: 0;
        }
        .brand-info {
          display: flex;
          flex-direction: column;
        }
        .brand-name-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .brand-name {
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          color: #ffffff;
          font-family: var(--font-sans);
          white-space: nowrap;
        }
        .gov-seal-pill {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #fef08a;
          background: rgba(180, 83, 9, 0.4);
          border: 1px solid #f59e0b;
          padding: 1px 5px;
          border-radius: 3px;
          white-space: nowrap;
        }
        .brand-subtitle {
          font-size: 0.68rem;
          color: #93c5fd;
          font-weight: 600;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        /* Nav links */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          flex-shrink: 0;
        }
        .nav-item {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          padding: 0.38rem 0.55rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #e2e8f0;
          border-radius: var(--radius-xs);
          transition: all var(--transition-fast);
          text-decoration: none !important;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
        }
        .nav-item:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.08);
          border-bottom-color: #f59e0b;
        }
        .nav-item-active {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-bottom-color: #f59e0b !important;
          font-weight: 700;
        }

        /* Right meta */
        .nav-right-meta {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
          margin-left: 0.35rem;
        }
        .gov-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.65rem;
          background-color: #052e16;
          border: 1px solid #15803d;
          border-radius: var(--radius-xs);
          font-size: 0.68rem;
          font-weight: 700;
          color: #86efac;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #22c55e;
          color: #22c55e;
        }
        .mobile-toggle-btn {
          display: none;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-xs);
          padding: 0.4rem;
          color: #ffffff;
          cursor: pointer;
        }

        /* Notice banner */
        .gov-notice-banner {
          background: #fffbeb;
          border-bottom: 1px solid #fde68a;
          color: #78350f;
          font-size: 0.78rem;
          padding: 0.4rem 0;
        }
        .gov-notice-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }
        .gov-notice-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          line-height: 1.4;
          min-width: 0;
          flex: 1;
        }
        .gov-notice-tag {
          background: #b45309;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 2px;
          letter-spacing: 0.03em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gov-toll-free-badge {
          font-weight: 700;
          color: #92400e;
          white-space: nowrap;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        /* Mobile nav drawer */
        .mobile-nav-drawer {
          display: none;
          background: var(--gov-navy-dark);
          border-bottom: 2px solid var(--gov-gold);
          padding: 0.85rem 1.25rem 1.25rem;
          box-shadow: var(--shadow-lg);
        }
        .mobile-nav-inner {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #cbd5e1;
          border-radius: var(--radius-xs);
          text-decoration: none !important;
          border-left: 3px solid transparent;
        }
        .mobile-nav-item-active {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-left-color: #f59e0b;
        }

        @media (max-width: 1560px) {
          .brand-subtitle {
            display: none;
          }
          .gov-seal-pill {
            display: none;
          }
          .desktop-nav .nav-item {
            padding: 0.35rem 0.45rem;
            font-size: 0.775rem;
            gap: 0.22rem;
          }
          .nav-container {
            gap: 0.5rem;
          }
          .gov-status-pill .status-text {
            font-size: 0.65rem;
          }
        }

        @media (max-width: 1360px) {
          .desktop-nav .nav-icon {
            display: none;
          }
          .gov-status-pill .status-text {
            display: none;
          }
          .gov-status-pill {
            padding: 0.35rem 0.5rem;
          }
        }

        @media (max-width: 1220px) {
          .gov-topbar-left .gov-ministry-text {
            display: none;
          }
          .desktop-nav {
            display: none;
          }
          .mobile-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mobile-nav-drawer {
            display: block;
          }
        }

        @media (max-width: 900px) {
          .gov-notice-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
          }
          .gov-toll-free-badge {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            height: 60px;
          }
          .gov-topbar-right .gov-helpline-chip {
            display: none;
          }
          .gov-toll-free-badge {
            display: none;
          }
          .brand-subtitle {
            display: none;
          }
          .gov-notice-banner {
            font-size: 0.72rem;
          }
        }

        @media (max-width: 480px) {
          .nav-container {
            gap: 0.5rem;
          }
          .brand-name {
            font-size: 1.05rem;
          }
          .gov-emblem-seal {
            width: 34px;
            height: 34px;
          }
          .gov-seal-pill {
            display: none;
          }
          .gov-status-pill {
            display: none;
          }
          .gov-topbar-left {
            font-size: 0.65rem;
          }
          .gov-a-btn {
            padding: 1px 3px;
            font-size: 0.6rem;
          }
          .gov-notice-tag {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
