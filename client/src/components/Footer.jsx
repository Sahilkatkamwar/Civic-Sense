// client/src/components/Footer.jsx
// Official Government E-Governance Portal Footer (NIC & GIGW 3.0 Aligned)
import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="gov-footer-root">
      {/* 1. National Inter-Portal Connect Strip */}
      <div className="gov-portals-strip">
        <div className="container portals-container">
          <span className="portals-label">महत्वपूर्ण सरकारी पोर्टल / NATIONAL PORTALS:</span>
          <div className="portals-links">
            <a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="portal-item">
              india.gov.in <ExternalLink size={10} />
            </a>
            <span className="dot">&bull;</span>
            <a href="https://www.mygov.in" target="_blank" rel="noreferrer" className="portal-item">
              MyGov.in <ExternalLink size={10} />
            </a>
            <span className="dot">&bull;</span>
            <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="portal-item">
              CPGRAMS (Public Grievance) <ExternalLink size={10} />
            </a>
            <span className="dot">&bull;</span>
            <a href="https://www.digitalindia.gov.in" target="_blank" rel="noreferrer" className="portal-item">
              Digital India <ExternalLink size={10} />
            </a>
            <span className="dot">&bull;</span>
            <a href="https://sbmurban.org" target="_blank" rel="noreferrer" className="portal-item">
              Swachh Bharat Urban <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      <div className="gov-tricolor-stripe"></div>

      {/* 2. Main Government Footer Grid */}
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Col 1: Ministry Oversight & Official Seal */}
          <div className="footer-meta-col">
            <div className="gov-footer-brand">
              <div className="footer-emblem-box">
                <Landmark size={22} className="text-amber-400" />
              </div>
              <div className="footer-title-group">
                <span className="footer-brand-title">भारत सरकार | Government of India</span>
                <span className="footer-ministry-title">Ministry of Housing and Urban Affairs (MoHUA)</span>
              </div>
            </div>

            <p className="footer-tagline">
              राष्ट्रीय नागरिक शिकायत निवारण एवं समाधान पोर्टल
            </p>
            <p className="footer-desc">
              Official centralized public grievance redressal and municipal operations platform. Fuses citizen incident reports with perceptual photo difference hashing, automated municipal ward dispatch, and statutory SLA escalation.
            </p>

            <div className="footer-status-tag">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>CPGRAMS &bull; Public Service Guarantee Act 2011 Compliant</span>
            </div>
          </div>

          {/* Col 2: Statutory Policies & Citizen Charter */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Statutory & Legal Rights</h4>
            <ul className="footer-nav-list">
              <li><Link to="/issues">Citizen's Charter & Redressal SLAs</Link></li>
              <li><Link to="/issues">Right to Information (RTI Act 2005)</Link></li>
              <li><Link to="/authority">Public Grievance Officer (PGO) Desk</Link></li>
              <li><Link to="/issues">Terms of Use & Privacy Policy</Link></li>
              <li><Link to="/issues">Website Accessibility Statement</Link></li>
            </ul>
          </div>

          {/* Col 3: Citizen Grievance Services */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Citizen Redressal Services</h4>
            <ul className="footer-nav-list">
              <li><Link to="/report">Lodge Citizen Grievance (With GPS)</Link></li>
              <li><Link to="/track">Track Docket Status by Ticket ID</Link></li>
              <li><Link to="/incidents">Public Ward Incident Register</Link></li>
              <li><Link to="/analytics">Administrative Redressal Analytics</Link></li>
              <li><Link to="/authority">Municipal Ward Officer Directory</Link></li>
            </ul>
          </div>

          {/* Col 4: 24x7 Emergency Helpline Grid */}
          <div className="footer-emergency-col">
            <h4 className="footer-heading">24x7 Municipal Helpline Grid</h4>
            <div className="emergency-contact-box">
              <div className="contact-item">
                <span className="contact-label">Power & Sparking Wire Emergency:</span>
                <span className="contact-number">1912</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Unified National Emergency:</span>
                <span className="contact-number">112</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Central Municipal Grievance Desk:</span>
                <span className="contact-number">1800-11-4000</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Swachhta Public Grievance Helpline:</span>
                <span className="contact-number">1969</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Legal & NIC Attribution Strip */}
        <div className="footer-bottom-bar">
          <div className="footer-copy">
            &copy; {CURRENT_YEAR} Ministry of Housing and Urban Affairs, Government of India. All Rights Reserved.
            <div className="footer-nic-text">
              Portal Designed, Developed and Cloud-Hosted by <strong>National Informatics Centre (NIC)</strong> / Municipal e-Governance Division.
            </div>
          </div>

          <div className="footer-compliance-badges">
            <span className="compliance-chip">
              <CheckCircle2 size={12} className="text-emerald-400" />
              GIGW 3.0 Certified
            </span>
            <span className="compliance-chip">
              <CheckCircle2 size={12} className="text-emerald-400" />
              W3C WCAG 2.1 AA
            </span>
            <span className="compliance-chip">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Data Security Audited
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .gov-footer-root {
          background-color: var(--gov-navy-dark);
          color: #cbd5e1;
          border-top: 3px solid var(--gov-gold);
          margin-top: auto;
          font-size: 0.875rem;
        }

        /* Top Portals Strip */
        .gov-portals-strip {
          background-color: #040e1b;
          padding: 0.5rem 0;
          font-size: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .portals-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .portals-label {
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.04em;
        }
        .portals-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .portal-item {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #93c5fd;
          text-decoration: none !important;
          font-weight: 600;
        }
        .portal-item:hover {
          color: #ffffff;
          text-decoration: underline !important;
        }
        .dot {
          color: #475569;
        }

        /* Main Grid */
        .footer-container {
          padding-top: 3rem;
          padding-bottom: 1.75rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.25fr;
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }

        .footer-meta-col {
          display: flex;
          flex-direction: column;
        }
        .gov-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .footer-emblem-box {
          width: 42px;
          height: 42px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid #f59e0b;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .footer-title-group {
          display: flex;
          flex-direction: column;
        }
        .footer-brand-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.01em;
        }
        .footer-ministry-title {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .footer-tagline {
          font-size: 0.8rem;
          color: #fde68a;
          font-weight: 700;
          margin-bottom: 0.65rem;
        }
        .footer-desc {
          font-size: 0.8125rem;
          color: #94a3b8;
          line-height: 1.55;
          margin-bottom: 1.25rem;
        }
        .footer-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.75rem;
          background: rgba(22, 101, 52, 0.25);
          border: 1px solid #15803d;
          border-radius: var(--radius-xs);
          font-size: 0.75rem;
          color: #86efac;
          font-weight: 600;
          width: fit-content;
        }

        .footer-heading {
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          padding-bottom: 0.4rem;
          border-bottom: 2px solid var(--gov-gold);
          display: inline-block;
        }
        .footer-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .footer-nav-list li a {
          color: #94a3b8;
          font-size: 0.8125rem;
          text-decoration: none !important;
          transition: color var(--transition-fast);
        }
        .footer-nav-list li a:hover {
          color: #ffffff;
          padding-left: 3px;
        }

        /* Emergency Box */
        .emergency-contact-box {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-sm);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .contact-item {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.45rem;
        }
        .contact-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .contact-label {
          font-size: 0.72rem;
          color: #94a3b8;
        }
        .contact-number {
          font-size: 1.15rem;
          font-weight: 900;
          color: #fde68a;
          letter-spacing: 0.05em;
          font-family: var(--font-mono);
        }

        /* Bottom Bar */
        .footer-bottom-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.78rem;
          color: #94a3b8;
        }
        .footer-copy {
          line-height: 1.5;
        }
        .footer-nic-text {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 0.2rem;
        }
        .footer-compliance-badges {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .compliance-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.55rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 3px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom-bar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
