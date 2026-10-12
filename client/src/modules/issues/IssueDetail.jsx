// client/src/modules/issues/IssueDetail.jsx
// Detailed Safety Protocol & Reporting Guidance
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Zap,
  Building2,
  ArrowRight
} from 'lucide-react';
import { getCategoryConfig } from '../../utils/civicHelpers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ISSUE_EXAMPLES = {
  pothole: [
    'Deep potholes and asphalt craters in vehicular lanes or pedestrian crossings',
    'Cracked road surfaces causing wheel entrapment or tire damage',
    'Sunken utility trench cuts left unpaved on municipal roads',
    'Broken road edges and crumbling pavement creating accident hazards'
  ],
  garbage: [
    'Overflowing community municipal dumpsters and waste bins',
    'Illegal open dumping heaps accumulating on sidewalks, roadside curbs, or vacant plots',
    'Uncollected domestic or commercial waste blocking stormwater gutters and drains',
    'Scattered debris posing biological sanitation and public health risks'
  ],
  tree: [
    'Fallen tree trunks or heavy limbs blocking traffic lanes or pedestrian sidewalks',
    'Overhanging dead or fractured branches posing immediate risk of falling',
    'Tree branches touching, entangling, or threatening overhead electrical wires',
    'Overgrown foliage completely obstructing visibility of road signs and streetlights'
  ],
  cable: [
    'Dangling, snapped, or sparking high-voltage electrical wires at ground or street level',
    'Low-hanging power or transmission cables sagging within arm reach or vehicle clearance',
    'Broken, bent, or leaning utility poles with exposed wiring assemblies',
    'Uncovered street-light service panels with exposed live wires near water puddles'
  ],
  animal: [
    'Deceased stray animals on public roadways or pedestrian footpaths',
    'Dead wildlife or birds in public recreational parks, playgrounds, or water bodies',
    'Animal carcasses creating severe sanitary, biological, and public health concerns'
  ],
  other: [
    'Broken or dislodged pedestrian sidewalk tiles, slabs, and curbstones',
    'Missing, dislodged, or damaged sewer manhole and drain chamber covers',
    'Damaged median dividers, guardrails, and traffic crash barriers',
    'Non-functioning streetlights leaving roadways in complete darkness'
  ]
};

export default function IssueDetail() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories/${categoryId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Category '${categoryId}' not found`);
        return res.json();
      })
      .then((data) => {
        setCategory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [categoryId]);

  if (loading) {
    return (
      <div className="container page-wrapper text-center">
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading hazard safety protocol...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container page-wrapper">
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem', maxWidth: '540px', margin: '0 auto' }}>
          <AlertTriangle size={36} className="text-amber-500 mb-2 mx-auto" />
          <h2>Category Not Found</h2>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
            The requested hazard category "{categoryId}" does not exist in the municipal registry.
          </p>
          <Link to="/issues" className="btn btn-primary">
            &larr; Return to Hazard Directory
          </Link>
        </div>
      </div>
    );
  }

  const catConfig = getCategoryConfig(category.id);
  const CatIcon = catConfig.icon;
  const isHighRisk = category.severity_weight >= 4 || category.id === 'cable';
  const examples = ISSUE_EXAMPLES[category.id] || [];

  // Parse DO and DONT guidance
  const guidanceText = category.guidance || '';
  const doMatch = guidanceText.match(/DO:\s*(.*?)(?=DONT:|$)/i);
  const dontMatch = guidanceText.match(/DONT:\s*(.*?)$/i);

  const doItems = doMatch
    ? doMatch[1].split('.').map((s) => s.trim()).filter(Boolean)
    : ['Take photos during daylight from a safe roadside vantage point', 'Note exact landmarks nearby'];

  const dontItems = dontMatch
    ? dontMatch[1].split('.').map((s) => s.trim()).filter(Boolean)
    : ['Never touch hazardous crater edges or live cables', 'Do not enter active vehicular lanes'];

  return (
    <div className="container page-wrapper">
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/issues" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to All Categories
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="card detail-hero-card">
        <div className="detail-hero-left">
          <div
            className="detail-hero-icon"
            style={{ backgroundColor: catConfig.bgColor, color: catConfig.color }}
          >
            <CatIcon size={28} />
          </div>
          <div>
            <div className="detail-hero-badges">
              <span className="gov-seal-box">MUNICIPAL JURISDICTION</span>
              {isHighRisk && (
                <span className="badge badge-critical">
                  <AlertTriangle size={12} />
                  Critical Severity {category.severity_weight}/5
                </span>
              )}
            </div>
            <h1 className="detail-hero-title">{category.name}</h1>
            <p className="detail-hero-desc">{category.description}</p>
          </div>
        </div>

        <div className="detail-hero-right">
          <Link to={`/report/${category.id}`} className="btn btn-saffron btn-lg">
            Lodge Citizen Grievance <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Emergency Alert if Hanging Cable or High Severity */}
      {category.id === 'cable' && (
        <div className="card urgent-safety-alert">
          <div className="urgent-alert-header">
            <Zap size={20} className="text-red-600" />
            <h3 className="urgent-alert-title">Active Electrocution Danger Notice</h3>
          </div>
          <p className="urgent-alert-text">
            Snapped and dangling power cables can electrify water puddles, ground soil, and nearby metal railings. 
            Maintain a strict <strong>minimum distance of 10 meters (33 feet)</strong> from dangling wires.
          </p>
          <div className="urgent-hotline-row">
            <span>Direct Power Distribution Emergency Desk:</span>
            <strong className="text-red-600">1912 / 112</strong>
          </div>
        </div>
      )}

      {/* Safety Protocols Grid: DOs & DONTs */}
      <div className="protocol-grid">
        {/* DOs Card */}
        <div className="card do-card">
          <div className="protocol-card-head do-head">
            <div className="protocol-icon-circle do-circle">
              <Check size={16} />
            </div>
            <h3 className="protocol-head-title">Safety Guidelines (DOs)</h3>
          </div>
          <ul className="protocol-list">
            {doItems.map((item, idx) => (
              <li key={idx} className="protocol-item">
                <Check size={15} className="text-emerald-600 flex-shrink-0 mt-1" />
                <span>{item}.</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DONTs Card */}
        <div className="card dont-card">
          <div className="protocol-card-head dont-head">
            <div className="protocol-icon-circle dont-circle">
              <X size={16} />
            </div>
            <h3 className="protocol-head-title">Hazard Warnings (DONTs)</h3>
          </div>
          <ul className="protocol-list">
            {dontItems.map((item, idx) => (
              <li key={idx} className="protocol-item">
                <X size={15} className="text-red-600 flex-shrink-0 mt-1" />
                <span>{item}.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Examples & Assigned Department */}
      <div className="detail-bottom-grid">
        {/* Examples Card */}
        <div className="card examples-card">
          <h3 className="bottom-card-title">What Qualifies Under This Category</h3>
          <ul className="examples-list">
            {examples.map((ex, idx) => (
              <li key={idx} className="example-item">
                <span className="example-bullet">&bull;</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Assigned Department */}
        <div className="card dept-card">
          <h3 className="bottom-card-title">Assigned Municipal Authority</h3>
          <div className="dept-info-box">
            <div className="dept-icon-box">
              <Building2 size={24} className="text-sky-600" />
            </div>
            <div>
              <div className="dept-name-main">{category.authority_name || catConfig.department}</div>
              <div className="dept-sub-text">{category.authority_department || 'Civic Administration'}</div>
            </div>
          </div>
          <p className="dept-dispatch-text">
            Complaints submitted in this category are automatically routed to this municipal cell.
          </p>
          <div className="dept-sla-box">
            <span className="sla-label">Target Initial Triage SLA:</span>
            <span className="sla-value">{isHighRisk ? 'Within 2 Hours' : 'Within 24 Hours'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .detail-hero-card {
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .detail-hero-left {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          max-width: 780px;
        }
        .detail-hero-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .detail-hero-badges {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 0.5rem;
        }
        .detail-hero-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }
        .detail-hero-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }
        .urgent-safety-alert {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
        }
        .urgent-alert-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        .urgent-alert-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #991b1b;
        }
        .urgent-alert-text {
          font-size: 0.875rem;
          color: #7f1d1d;
          line-height: 1.5;
          margin-bottom: 0.65rem;
        }
        .urgent-hotline-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #991b1b;
        }
        .protocol-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .do-card {
          border-top: 3px solid #16a34a;
          padding: 1.5rem;
        }
        .dont-card {
          border-top: 3px solid #dc2626;
          padding: 1.5rem;
        }
        .protocol-card-head {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1.25rem;
        }
        .protocol-icon-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .do-circle {
          background-color: #dcfce7;
          color: #16a34a;
        }
        .dont-circle {
          background-color: #fee2e2;
          color: #dc2626;
        }
        .protocol-head-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .protocol-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .protocol-item {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .detail-bottom-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 1.5rem;
        }
        .bottom-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .examples-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .example-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .example-bullet {
          color: var(--primary);
          font-size: 1.1rem;
          line-height: 1;
        }
        .dept-info-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          margin-bottom: 0.85rem;
        }
        .dept-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dept-name-main {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .dept-sub-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .dept-dispatch-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 1rem;
        }
        .dept-sla-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          padding: 0.5rem 0.75rem;
          background-color: #fafbfc;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .sla-label {
          color: var(--text-muted);
        }
        .sla-value {
          font-weight: 700;
          color: var(--text-main);
        }

        @media (max-width: 900px) {
          .protocol-grid, .detail-bottom-grid {
            grid-template-columns: 1fr;
          }
          .detail-hero-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
