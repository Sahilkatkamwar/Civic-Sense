// client/src/modules/issues/IssueDetail.jsx
// Owner: Sujal (Issue Explorer Module)
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Curated examples for "What counts as this issue"
const ISSUE_EXAMPLES = {
  pothole: [
    'Deep potholes and asphalt craters in vehicular lanes or pedestrian crossings',
    'Cracked road surfaces causing dangerous wheel entrapment or tire damage',
    'Sunken or depressed utility trench cuts on municipal roads',
    'Broken road edges and crumbling pavement creating accident hazards'
  ],
  garbage: [
    'Overflowing community municipal dumpsters and waste bins',
    'Illegal open dumping heaps accumulating on sidewalks, roadside curbs, or vacant plots',
    'Uncollected domestic or commercial waste blocking stormwater gutters and drains',
    'Scattered debris posing sanitation and public health risks'
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
    'Deceased stray animals (dogs, cats, cattle) on public roadways or footpaths',
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
        <div className="spinner"></div>
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container page-wrapper">
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
          <h2>Category Not Found</h2>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
            The requested issue category "{categoryId}" does not exist in the municipal directory.
          </p>
          <Link to="/issues" className="btn btn-primary">
            &larr; Back to all issues
          </Link>
        </div>
      </div>
    );
  }

  // Parse guidance DO / DONT
  const guidanceText = category.guidance || '';
  const doMatch = guidanceText.match(/DO:\s*(.*?)(?=DONT:|$)/i);
  const dontMatch = guidanceText.match(/DONT:\s*(.*?)$/i);

  const doItems = doMatch
    ? doMatch[1].trim()
    : 'Capture clear photographs from a safe vantage point and note the nearest street landmark or address.';
  const dontItems = dontMatch
    ? dontMatch[1].trim()
    : 'Do not endanger personal safety, touch hazardous materials, or disrupt active vehicular traffic.';

  const examples = ISSUE_EXAMPLES[category.id] || [
    `Common citizen-reported incidents fitting the ${category.name} category.`,
    'Physical damage or hazard located on municipal public property.',
    'Situations that require field inspection or emergency maintenance by local authorities.'
  ];

  const isCritical = category.id === 'cable' || category.id === 'animal' || category.severity_weight >= 5;

  return (
    <div className="container page-wrapper">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/issues" className="btn btn-secondary btn-sm">
          &larr; Back to all issues
        </Link>
      </div>

      {/* Emergency Helpline Banner for High Hazard Categories */}
      {isCritical && (
        <div className="emergency-alert-card">
          <span className="emergency-badge">🚨 URGENT SAFETY NOTICE</span>
          <h3>Immediate Hazard Guidance</h3>
          <p>
            {category.id === 'cable'
              ? 'Dangling power lines can carry lethal electric currents! Keep at least 10 meters (33 feet) away. If wires are sparking or touching standing water, call the 24/7 Power Emergency Desk at 1912 or Police/Fire at 112 immediately before reporting.'
              : category.id === 'animal'
              ? 'Dead animals pose biological contamination hazards. Do not touch, move, or handle the carcass. Call Animal Control & Municipal Health dispatch directly at 1916 for urgent chemical sterilization and removal.'
              : 'This is classified as a critical municipal hazard. Field response is fast-tracked once submitted.'}
          </p>
        </div>
      )}

      {/* Main Issue Hero Card */}
      <div className="issue-hero card">
        <div className="issue-hero-top">
          <div className="issue-icon-big">{category.icon || '📌'}</div>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-low">Official Category</span>
              {category.severity_weight >= 4 ? (
                <span className="badge badge-critical">
                  ⚠️ High Risk (Severity {category.severity_weight}/5)
                </span>
              ) : (
                <span className="badge badge-medium">
                  Standard Priority (Severity {category.severity_weight}/5)
                </span>
              )}
            </div>
            <h1 className="issue-title">{category.name}</h1>
          </div>
        </div>

        <p className="issue-desc-large">{category.description}</p>

        <div className="issue-action-bar">
          <Link to={`/report/${category.id}`} className="btn btn-primary btn-lg report-big-btn">
            🚨 Report this issue &rarr;
          </Link>
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid-2 detail-sections-grid" style={{ marginTop: '2rem' }}>
        {/* Left Column: What Counts + Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section: What counts as this issue */}
          <div className="card">
            <h3 className="section-card-title">
              <span>📋</span> What counts as this issue
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Incidents and municipal conditions covered under <strong>{category.name}</strong>:
            </p>
            <ul className="examples-list">
              {examples.map((item, idx) => (
                <li key={idx}>
                  <span className="bullet-check">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: Guidance (DO and DON'T) */}
          <div className="card">
            <h3 className="section-card-title">
              <span>🛡️</span> Safety & Citizen Guidance
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Follow these recommended safety precautions before taking photographs or filing your report:
            </p>

            <div className="guidance-box guidance-do">
              <h4 className="guidance-heading guidance-do-heading">
                <span>✅</span> DO
              </h4>
              <p className="guidance-content">{doItems}</p>
            </div>

            <div className="guidance-box guidance-dont" style={{ marginTop: '1rem' }}>
              <h4 className="guidance-heading guidance-dont-heading">
                <span>❌</span> DON'T
              </h4>
              <p className="guidance-content">{dontItems}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Who Handles It + How Priority is Decided */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section: Who handles it */}
          <div className="card">
            <h3 className="section-card-title">
              <span>🏢</span> Who handles it
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Reports filed under this category are routed directly to the designated municipal department:
            </p>

            <div className="authority-highlight-box">
              <div className="auth-row">
                <span className="auth-label">Responsible Agency:</span>
                <span className="auth-val">{category.authority_name || 'Municipal Field Operations'}</span>
              </div>
              <div className="auth-row">
                <span className="auth-label">Department Cell:</span>
                <span className="auth-val">{category.authority_department || 'City Public Works Division'}</span>
              </div>
              <div className="auth-row">
                <span className="auth-label">Routing Status:</span>
                <span className="badge badge-success">Direct Automated Dispatch</span>
              </div>
            </div>
          </div>

          {/* Section: How priority is decided */}
          <div className="card">
            <h3 className="section-card-title">
              <span>⚖️</span> How priority is decided
            </h3>
            <div className="priority-explanation">
              <p>
                Civic Sense calculates an automated priority score in real-time using a transparent algorithm:
              </p>
              <div className="priority-factor-item">
                <strong>1. Base Category Hazard Severity ({category.severity_weight}/5):</strong>
                <span> Determines initial triage urgency upon submission.</span>
              </div>
              <div className="priority-factor-item">
                <strong>2. Number of Citizen Reports:</strong>
                <span> Every time another citizen reports the same location or upvotes it, the priority score automatically escalates.</span>
              </div>
              <div className="priority-factor-item">
                <strong>3. Time Elapsed & Aging:</strong>
                <span> Open issues automatically gain priority points every 24 hours to prevent older complaints from being neglected.</span>
              </div>
              <div className="priority-factor-item">
                <strong>4. Photo Authenticity:</strong>
                <span> Verified on-site photos receive standard verification weighting without manual gatekeeping.</span>
              </div>
            </div>
          </div>

          {/* Call to action card */}
          <div className="card cta-card text-center">
            <h3>Ready to report this?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.25rem' }}>
              Takes under 60 seconds. No account or password required.
            </p>
            <Link to={`/report/${category.id}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Report this issue now &rarr;
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .emergency-alert-card {
          background: #fef2f2;
          border: 1px solid #f87171;
          border-left: 6px solid #dc2626;
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
        }
        .emergency-badge {
          display: inline-block;
          background: #dc2626;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-sm);
          margin-bottom: 0.5rem;
          letter-spacing: 0.04em;
        }
        .emergency-alert-card h3 {
          color: #991b1b;
          margin: 0.25rem 0 0.5rem;
        }
        .emergency-alert-card p {
          color: #7f1d1d;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }
        .issue-hero {
          padding: 2.25rem;
          background: #ffffff;
          border: 1px solid var(--border);
        }
        .issue-hero-top {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1rem;
        }
        .issue-icon-big {
          font-size: 3.25rem;
          width: 80px;
          height: 80px;
          background: #eff6ff;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #dbeafe;
        }
        .issue-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text-main);
          margin-top: 0.25rem;
        }
        .issue-desc-large {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.75rem;
          max-width: 820px;
        }
        .issue-action-bar {
          display: flex;
          gap: 1rem;
        }
        .report-big-btn {
          font-size: 1.1rem !important;
          padding: 0.85rem 2rem !important;
        }
        .section-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          margin-bottom: 0.75rem;
        }
        .examples-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .examples-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.925rem;
          color: var(--text-main);
          line-height: 1.45;
        }
        .bullet-check {
          color: var(--primary);
          font-weight: 800;
          flex-shrink: 0;
        }
        .guidance-box {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
        }
        .guidance-do {
          background-color: #f0fdf4;
          border-left: 4px solid #16a34a;
        }
        .guidance-do-heading {
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }
        .guidance-dont {
          background-color: #fef2f2;
          border-left: 4px solid #dc2626;
        }
        .guidance-dont-heading {
          color: #b91c1c;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }
        .guidance-content {
          color: var(--text-main);
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }
        .authority-highlight-box {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .auth-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.925rem;
        }
        .auth-label {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .auth-val {
          font-weight: 700;
          color: var(--text-main);
        }
        .priority-explanation {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .priority-factor-item {
          margin-top: 0.75rem;
          padding-left: 0.75rem;
          border-left: 2px solid var(--primary-border);
        }
        .priority-factor-item strong {
          color: var(--text-main);
        }
        .cta-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 1.75rem 1.5rem;
        }
        .cta-card h3 {
          color: #166534;
        }
        @media (max-width: 640px) {
          .issue-hero-top {
            flex-direction: column;
            align-items: flex-start;
          }
          .issue-title {
            font-size: 1.75rem;
          }
          .detail-sections-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
