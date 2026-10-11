// client/src/pages/Home.jsx
// Centralized Public Civic Grievance Redressal & Redress System (Government Affiliated)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  PlusCircle,
  Users,
  MapPin,
  HelpCircle,
  Landmark,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import CategoryCard from '../modules/issues/CategoryCard';
import MiniMap from '../components/MiniMap';
import { getPriorityConfig, getCategoryConfig } from '../utils/civicHelpers';
import { faqs } from '../content/text';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    in_progress: 0,
    under_review: 0,
    citizen_reports: 0
  });
  const [categories, setCategories] = useState([]);
  const [topComplaints, setTopComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/complaints/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/api/categories`).then((r) => r.json()),
      fetch(`${API_BASE}/api/complaints?sort=priority`).then((r) => r.json())
    ])
      .then(([statsData, catData, complaintsData]) => {
        setStats(statsData);
        setCategories(catData);
        setAllComplaints(complaintsData);
        setTopComplaints(complaintsData.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load overview data:', err);
      });
  }, []);

  const criticalOpenCount = allComplaints.filter(
    (c) => c.priority_level === 'critical' && c.status !== 'resolved'
  ).length;

  return (
    <div className="home-page-root">
      {/* 1. Official Government Hero Workspace */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            {/* Government Emblem Pill */}
            <div className="gov-hero-pill">
              <Landmark size={15} className="text-amber-500" />
              <span>भारत सरकार | GOVERNMENT AFFILIATED MUNICIPAL REDRESSAL SYSTEM</span>
            </div>

            <h1 className="hero-headline">
              Centralized Public Civic Grievance & Municipal Redressal Portal
            </h1>
            <div className="hero-hindi-sub">
              राष्ट्रीय नागरिक समाधान एवं सार्वजनिक शिकायत निवारण मंच
            </div>

            <p className="hero-lead">
              Official centralized public grievance redressal portal. Empowering citizens across municipal wards with instant photographic geotagging, automated perceptual duplicate triaging, and statutory SLA escalation under the <strong>Public Services Guarantee Act 2011</strong>.
            </p>

            <div className="hero-cta-group">
              <Link to="/report" className="btn btn-saffron btn-lg">
                <PlusCircle size={18} />
                Lodge Citizen Grievance (शिकायत दर्ज करें)
              </Link>
              <Link to="/incidents" className="btn btn-primary btn-lg">
                <Layers size={18} />
                Ward Incident Register
              </Link>
              <Link to="/track" className="btn btn-secondary btn-lg">
                <Search size={17} />
                Track Docket by ID
              </Link>
            </div>

            <div className="hero-compliance-strip">
              <div className="compliance-tag">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>CPGRAMS Aligned</span>
              </div>
              <span className="comp-sep">&bull;</span>
              <div className="compliance-tag">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>24–48 Hr Statutory SLA</span>
              </div>
              <span className="comp-sep">&bull;</span>
              <div className="compliance-tag">
                <FileText size={14} className="text-emerald-600" />
                <span>Perceptual Hash Duplicate Merging</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Operational Snapshot Card */}
          <div className="hero-live-card">
            <div className="hero-card-header">
              <div className="hero-card-header-left">
                <Landmark size={18} className="text-amber-600" />
                <div>
                  <span className="hero-card-title">Live Ward Incident Ledger</span>
                  <div className="hero-card-sub">वार्ड निगरानी एवं शिकायत मानचित्र</div>
                </div>
              </div>
              <span className="badge badge-critical" style={{ fontSize: '0.72rem' }}>
                {criticalOpenCount} Critical Wards
              </span>
            </div>

            {/* Embedded MiniMap */}
            <div className="hero-minimap-container">
              <MiniMap complaints={allComplaints} />
            </div>

            <div className="hero-card-footer">
              <div className="footer-meta-stat">
                <span className="stat-sm-num">{stats.total || 0}</span>
                <span className="stat-sm-lbl">Logged Dockets</span>
              </div>
              <div className="footer-meta-stat">
                <span className="stat-sm-num text-emerald-700">{stats.resolved || 0}</span>
                <span className="stat-sm-lbl">Disposed (Resolved)</span>
              </div>
              <div className="footer-meta-stat">
                <span className="stat-sm-num text-amber-700">{stats.in_progress || 0}</span>
                <span className="stat-sm-lbl">In Field Repair</span>
              </div>
              <Link to="/incidents" className="btn btn-primary btn-sm">
                View All Incidents &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official Statutory Redressal Metrics Strip */}
      <section className="stats-strip-section">
        <div className="container">
          <div className="stats-strip-card">
            <div className="strip-item">
              <div className="strip-number">{stats.total || 0}</div>
              <div className="strip-label">Registered Public Grievances</div>
              <div className="strip-sub">दर्ज नागरिक शिकायतें (Deduplicated)</div>
            </div>
            <div className="strip-divider"></div>

            <div className="strip-item">
              <div className="strip-number text-emerald-700">{stats.resolved || 0}</div>
              <div className="strip-label">Audited Redressals (Resolved)</div>
              <div className="strip-sub">निस्तारित शिकायतें (Field Certified)</div>
            </div>
            <div className="strip-divider"></div>

            <div className="strip-item">
              <div className="strip-number text-sky-800">{stats.in_progress || 0}</div>
              <div className="strip-label">Active Ward Dispatches</div>
              <div className="strip-sub">कार्य प्रगति पर (Field Crews Active)</div>
            </div>
            <div className="strip-divider"></div>

            <div className="strip-item">
              <div className="strip-number text-amber-700">{stats.citizen_reports || 0}</div>
              <div className="strip-label">Citizen Confirmations</div>
              <div className="strip-sub">नागरिक समर्थन (Consensus Verified)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Citizen Charter & Statutory SLA Commitments */}
      <section className="container section-gap">
        <div className="gov-sla-header-box">
          <div className="sla-badge">नागरिक अधिकार पत्र / CITIZEN CHARTER GUARANTEE</div>
          <h2 className="sla-title">Statutory Redressal Timelines under Public Service Act</h2>
          <p className="sla-desc">
            All urban local bodies and municipal departments are legally bound by predetermined service level agreements (SLAs) to inspect and resolve verified public hazards.
          </p>

          <div className="sla-grid">
            <div className="sla-card">
              <div className="sla-card-top">
                <Clock size={16} className="text-red-600" />
                <span className="sla-time-tag text-red-700">6–12 Hours SLA</span>
              </div>
              <h4 className="sla-card-title">Live Cable & Electrical Sparks</h4>
              <p className="sla-card-desc">
                High-voltage snapped wires, transformer sparking, and live contact risks receive immediate emergency disconnect and line repair.
              </p>
              <div className="sla-dept">Dept: State Power Distribution (DISCOM)</div>
            </div>

            <div className="sla-card">
              <div className="sla-card-top">
                <Clock size={16} className="text-amber-600" />
                <span className="sla-time-tag text-amber-700">24 Hours SLA</span>
              </div>
              <h4 className="sla-card-title">Sewage Contamination & Water Leak</h4>
              <p className="sla-card-desc">
                Burst municipal water mains, raw sewage overflow, and open drainage blocks dispatched with dewatering pumps.
              </p>
              <div className="sla-dept">Dept: Municipal Water & Sewerage Board</div>
            </div>

            <div className="sla-card">
              <div className="sla-card-top">
                <Clock size={16} className="text-amber-600" />
                <span className="sla-time-tag text-amber-700">48 Hours SLA</span>
              </div>
              <h4 className="sla-card-title">Major Road Potholes & Cave-ins</h4>
              <p className="sla-card-desc">
                Structural road cavity barricading, cold-mix asphalt filling, and traffic safety stabilization.
              </p>
              <div className="sla-dept">Dept: Public Works Department (PWD)</div>
            </div>

            <div className="sla-card">
              <div className="sla-card-top">
                <Clock size={16} className="text-emerald-600" />
                <span className="sla-time-tag text-emerald-700">24 Hours SLA</span>
              </div>
              <h4 className="sla-card-title">Garbage Dumps & Waste Hazards</h4>
              <p className="sla-card-desc">
                Illegal public dumping, overflowing municipal bins, and sanitation clearance under Swachh Bharat mission.
              </p>
              <div className="sla-dept">Dept: Solid Waste Management (SWM)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. High-Priority Risk Alerts & Public Inspection */}
      <section className="container section-gap">
        <div className="section-head-split">
          <div>
            <div className="section-pretitle">वार्ड निगरानी / Ward Priority Registry</div>
            <h2 className="section-maintitle">Emerging Critical Public Hazards</h2>
            <p className="section-subtext">
              Top priority civic dockets evaluated algorithmically from severity weights, citizen consensus density, and open SLA duration.
            </p>
          </div>
          <Link to="/incidents" className="btn btn-secondary">
            View Official Incident Register &rarr;
          </Link>
        </div>

        <div className="priority-grid">
          {topComplaints.map((item) => {
            const prio = getPriorityConfig(item.priority_level);
            const cat = getCategoryConfig(item.category_id);
            const CatIcon = cat.icon;

            return (
              <div key={item.id} className="card priority-alert-card card-hover">
                <div className="alert-card-top">
                  <div className="alert-cat-tag" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
                    <CatIcon size={14} />
                    <span>{item.category_name || cat.name}</span>
                  </div>
                  <span className={`badge ${prio.badgeClass}`}>
                    {prio.label} ({item.priority_score || 0} pts)
                  </span>
                </div>

                <div className="alert-card-id">TICKET DOCKET: {item.id}</div>
                <p className="alert-card-desc">{item.description}</p>

                <div className="alert-card-loc">
                  <MapPin size={13} className="text-slate-500" />
                  <span>{item.address_text || 'GPS Coordinates Registered'}</span>
                </div>

                <div className="alert-card-footer">
                  <div className="alert-reports-tag">
                    <Users size={12} />
                    <span>{item.report_count || 1} Citizen Report{item.report_count > 1 ? 's' : ''}</span>
                  </div>
                  <Link to={`/track/${item.id}`} className="btn btn-outline btn-sm">
                    Inspect Docket Timeline &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Issue Directory Grid */}
      <section className="container section-gap">
        <div className="section-head-split">
          <div>
            <div className="section-pretitle">नगर निगम कार्यक्षेत्र / Municipal Jurisdictions</div>
            <h2 className="section-maintitle">Civic Hazards Handled by Portal</h2>
            <p className="section-subtext">
              Every complaint is categorized against statutory municipal rules and routed automatically to its nodal officer.
            </p>
          </div>
          <Link to="/issues" className="btn btn-secondary">
            View Citizen Charter Directory
          </Link>
        </div>

        <div className="grid-3">
          {categories.slice(0, 6).map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 6. Core Architecture & Workflow (How It Works) */}
      <section className="workflow-section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <div className="section-pretitle">प्रणाली वास्तुकला / Technical Architecture</div>
            <h2 className="section-maintitle">Automated Perceptual Deduplication & Triage Workflow</h2>
            <p className="section-subtext" style={{ maxWidth: '640px', margin: '0 auto' }}>
              Traditional municipal portals break under redundant duplicate complaints. Civic-Sense uses perceptual difference hashing and GIS boundaries to unite citizen reports into authoritative priority dockets.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="card workflow-step-card">
              <div className="step-num-box">01</div>
              <h3 className="step-title">Citizen Submission</h3>
              <p className="step-desc">
                Citizens capture field photographic evidence with tamper-resistant GPS coordinate geotagging.
              </p>
            </div>

            <div className="card workflow-step-card">
              <div className="step-num-box">02</div>
              <h3 className="step-title">Perceptual dHash Triaging</h3>
              <p className="step-desc">
                The backend computes an 8x8 difference hash (dHash) and Haversine geospatial radius within 50 meters to detect duplicate incidents.
              </p>
            </div>

            <div className="card workflow-step-card">
              <div className="step-num-box">03</div>
              <h3 className="step-title">Urgency Escalation</h3>
              <p className="step-desc">
                Instead of creating duplicate noise, the system merges endorsements, raises statutory priority score, and flags urgent municipal urgency.
              </p>
            </div>

            <div className="card workflow-step-card">
              <div className="step-num-box">04</div>
              <h3 className="step-title">Official Dispatch & Audit</h3>
              <p className="step-desc">
                Ward officers verify evidence in the authority command desk, assign field work crews, and log audited completion proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section className="container section-gap" style={{ paddingBottom: '3.5rem' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div className="section-pretitle">अक्सर पूछे जाने वाले प्रश्न / Frequently Answered Questions</div>
          <h2 className="section-maintitle">Municipal Grievance Guidelines & FAQ</h2>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card faq-card">
              <h4 className="faq-q">
                <HelpCircle size={16} className="text-amber-700 flex-shrink-0" />
                <span>{faq.question}</span>
              </h4>
              <p className="faq-a">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .home-page-root {
          display: flex;
          flex-direction: column;
        }

        /* Hero Section */
        .hero-section {
          background: linear-gradient(180deg, #ffffff 0%, #ebf0f7 100%);
          border-bottom: 2px solid var(--border);
          padding: 3.5rem 0 3.75rem;
        }
        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3rem;
          align-items: center;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
        }
        .gov-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background-color: #ffffff;
          border: 1px solid var(--border);
          border-left: 3px solid var(--gov-gold);
          border-radius: var(--radius-xs);
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--gov-navy);
          width: fit-content;
          margin-bottom: 1.25rem;
          box-shadow: var(--shadow-xs);
          letter-spacing: 0.03em;
        }
        .hero-headline {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          color: var(--gov-navy);
          font-family: var(--font-serif);
          margin-bottom: 0.4rem;
        }
        .hero-hindi-sub {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gov-saffron);
          margin-bottom: 1.25rem;
        }
        .hero-lead {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 1.75rem;
          max-width: 580px;
        }
        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.75rem;
        }
        .hero-compliance-strip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 600;
          flex-wrap: wrap;
        }
        .compliance-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .comp-sep {
          color: var(--border-strong);
        }

        /* Hero Live Card */
        .hero-live-card {
          background-color: #ffffff;
          border: 1px solid var(--border-strong);
          border-top: 3px solid var(--gov-navy);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          box-shadow: var(--shadow-md);
        }
        .hero-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }
        .hero-card-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .hero-card-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--gov-navy);
          display: block;
        }
        .hero-card-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .hero-minimap-container {
          margin-bottom: 0.85rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          overflow: hidden;
        }
        .hero-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
          font-size: 0.8125rem;
        }
        .footer-meta-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-sm-num {
          font-weight: 900;
          font-size: 1.15rem;
          line-height: 1.1;
          color: var(--gov-navy);
          font-family: var(--font-mono);
        }
        .stat-sm-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Stats Strip */
        .stats-strip-section {
          margin-top: -1.75rem;
          margin-bottom: 3.5rem;
          position: relative;
          z-index: 20;
        }
        .stats-strip-card {
          background-color: #ffffff;
          border: 1px solid var(--border-strong);
          border-top: 3px solid var(--gov-gold);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
        }
        .strip-item {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-align: center;
        }
        .strip-number {
          font-size: 2.1rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.35rem;
          color: var(--gov-navy);
          font-family: var(--font-mono);
        }
        .strip-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.15rem;
        }
        .strip-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .strip-divider {
          width: 1px;
          height: 48px;
          background-color: var(--border);
        }

        /* Citizen Charter SLA Box */
        .gov-sla-header-box {
          background: #ffffff;
          border: 1px solid var(--border-strong);
          border-left: 4px solid var(--gov-navy);
          border-radius: var(--radius-sm);
          padding: 2rem;
          box-shadow: var(--shadow-xs);
        }
        .sla-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--gov-gold);
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }
        .sla-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--gov-navy);
          font-family: var(--font-serif);
          margin-bottom: 0.4rem;
        }
        .sla-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          max-width: 780px;
          margin-bottom: 1.75rem;
          line-height: 1.55;
        }
        .sla-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .sla-card {
          background-color: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
        }
        .sla-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.65rem;
        }
        .sla-time-tag {
          font-size: 0.75rem;
          font-weight: 800;
          font-family: var(--font-mono);
          background: #ffffff;
          padding: 2px 6px;
          border: 1px solid currentColor;
          border-radius: 2px;
        }
        .sla-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.45rem;
        }
        .sla-card-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 0.75rem;
          flex: 1;
        }
        .sla-dept {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--gov-navy);
          border-top: 1px solid var(--border);
          padding-top: 0.5rem;
        }

        /* Section Commons */
        .section-gap {
          margin-bottom: 3.5rem;
        }
        .section-head-split {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .section-pretitle {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gov-gold);
          margin-bottom: 0.25rem;
        }
        .section-maintitle {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--gov-navy);
          font-family: var(--font-serif);
          letter-spacing: -0.01em;
          margin-bottom: 0.35rem;
        }
        .section-subtext {
          font-size: 0.875rem;
          color: var(--text-secondary);
          max-width: 620px;
        }

        /* Priority Alert Grid */
        .priority-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .priority-alert-card {
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          border-top: 3px solid var(--gov-gold);
        }
        .alert-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .alert-cat-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 2px 7px;
          border-radius: var(--radius-xs);
          font-size: 0.75rem;
          font-weight: 700;
        }
        .alert-card-id {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--gov-navy);
          margin-bottom: 0.25rem;
        }
        .alert-card-desc {
          font-size: 0.875rem;
          color: var(--text-main);
          line-height: 1.45;
          margin-bottom: 0.75rem;
          flex: 1;
        }
        .alert-card-loc {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: var(--text-muted);
          margin-bottom: 0.85rem;
        }
        .alert-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }
        .alert-reports-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gov-saffron);
        }

        /* Workflow Section */
        .workflow-section {
          background: #ffffff;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 3.5rem 0;
          margin-bottom: 3.5rem;
        }
        .workflow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .workflow-step-card {
          padding: 1.5rem;
          position: relative;
          border-top: 3px solid var(--gov-navy);
        }
        .step-num-box {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--gov-gold);
          margin-bottom: 0.75rem;
        }
        .step-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--gov-navy);
          margin-bottom: 0.5rem;
        }
        .step-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Grid 3 */
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        /* FAQ Grid */
        .faq-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        .faq-card {
          padding: 1.35rem;
          border-left: 3px solid var(--gov-gold);
        }
        .faq-q {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--gov-navy);
          margin-bottom: 0.5rem;
        }
        .faq-a {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
          }
          .sla-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .priority-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .workflow-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .hero-headline {
            font-size: 1.85rem;
          }
          .stats-strip-card {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
          .strip-divider {
            display: none;
          }
          .sla-grid {
            grid-template-columns: 1fr;
          }
          .priority-grid {
            grid-template-columns: 1fr;
          }
          .workflow-grid {
            grid-template-columns: 1fr;
          }
          .grid-3 {
            grid-template-columns: 1fr;
          }
          .faq-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
