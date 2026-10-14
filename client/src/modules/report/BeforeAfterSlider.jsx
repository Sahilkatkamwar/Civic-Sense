// client/src/modules/report/BeforeAfterSlider.jsx
// Interactive Before & After Visual Slider for Proof of Resolution
import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Sliders, Columns } from 'lucide-react';

export default function BeforeAfterSlider({
  beforeImg,
  afterImg,
  beforeLabel = 'BEFORE (Reported Hazard)',
  afterLabel = 'AFTER (Municipal Repair Proof)',
  resolvedAt,
  resolutionNote,
  categoryName
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleSliderMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="proof-slider-wrapper">
      {/* Header with View Mode Toggle */}
      <div className="proof-slider-top">
        <div className="proof-badge-group">
          <span className="proof-seal-badge">
            <CheckCircle2 size={13} className="text-emerald-500" />
            PROOF OF RESOLUTION AUDIT
          </span>
          {resolvedAt && (
            <span className="proof-date-text">
              Resolved: {new Date(resolvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        <div className="view-toggle-btns">
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'slider' ? 'toggle-btn-active' : ''}`}
            onClick={() => setViewMode('slider')}
            title="Interactive Split Slider"
          >
            <Sliders size={13} />
            <span>Interactive Slider</span>
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'side-by-side' ? 'toggle-btn-active' : ''}`}
            onClick={() => setViewMode('side-by-side')}
            title="Side-by-Side View"
          >
            <Columns size={13} />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Main Visual Comparison Display */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="slider-viewport"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleSliderMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches && e.touches[0]) handleSliderMove(e.touches[0].clientX);
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* AFTER Image (Background / Right Side) */}
          <img
            src={afterImg}
            alt="After Resolution"
            className="slider-img slider-img-after"
            draggable={false}
          />
          <div className="slider-label-badge badge-after">
            <CheckCircle2 size={12} />
            <span>{afterLabel}</span>
          </div>

          {/* BEFORE Image (Foreground clipped / Left Side) */}
          <div
            className="slider-before-wrapper"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeImg}
              alt="Before Resolution"
              className="slider-img slider-img-before"
              draggable={false}
            />
            <div className="slider-label-badge badge-before">
              <Camera size={12} />
              <span>{beforeLabel}</span>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="slider-divider"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-handle">
              <span className="handle-arrows">⇄</span>
            </div>
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="side-by-side-grid">
          <div className="side-card side-card-before">
            <div className="side-card-tag badge-before">
              <Camera size={12} />
              <span>{beforeLabel}</span>
            </div>
            <img src={beforeImg} alt="Before" className="side-img" />
          </div>

          <div className="side-card side-card-after">
            <div className="side-card-tag badge-after">
              <CheckCircle2 size={12} />
              <span>{afterLabel}</span>
            </div>
            <img src={afterImg} alt="After" className="side-img" />
          </div>
        </div>
      )}

      {/* Slider Hint */}
      {viewMode === 'slider' && (
        <div className="slider-instruction">
          <span>👈 Drag the center divider to compare Before vs. After repair proof 👉</span>
        </div>
      )}

      {/* Official Resolution Note */}
      {resolutionNote && (
        <div className="resolution-remarks-box">
          <strong className="remarks-label">Municipal Engineer Audit Remarks:</strong>
          <p className="remarks-text">"{resolutionNote}"</p>
        </div>
      )}

      <style>{`
        .proof-slider-wrapper {
          background: #ffffff;
          border: 1px solid #10b981;
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
        }
        .proof-slider-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #ecfdf5;
          border-bottom: 1px solid #a7f3d0;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .proof-badge-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .proof-seal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #065f46;
          background: #d1fae5;
          border: 1px solid #6ee7b7;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .proof-date-text {
          font-size: 0.75rem;
          color: #047857;
          font-weight: 600;
        }
        .view-toggle-btns {
          display: flex;
          gap: 0.35rem;
        }
        .toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 3px 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #065f46;
          background: #ffffff;
          border: 1px solid #a7f3d0;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .toggle-btn:hover {
          background: #d1fae5;
        }
        .toggle-btn-active {
          background: #059669 !important;
          color: #ffffff !important;
          border-color: #059669 !important;
        }

        /* Slider Viewport */
        .slider-viewport {
          position: relative;
          width: 100%;
          height: 320px;
          overflow: hidden;
          cursor: ew-resize;
          user-select: none;
          background: #0f172a;
        }
        .slider-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .slider-img-after {
          z-index: 1;
        }
        .slider-before-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          overflow: hidden;
          z-index: 2;
          border-right: 2px solid #ffffff;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.4);
        }
        .slider-img-before {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
        }
        .slider-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #ffffff;
          z-index: 3;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .slider-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          background: #ffffff;
          color: #0f172a;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          border: 2px solid #059669;
        }
        .handle-arrows {
          user-select: none;
        }

        /* Label Badges */
        .slider-label-badge {
          position: absolute;
          padding: 4px 9px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          z-index: 4;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .badge-before {
          bottom: 12px;
          left: 12px;
          background: rgba(185, 28, 28, 0.9);
          color: #ffffff;
          border: 1px solid rgba(254, 202, 202, 0.4);
        }
        .badge-after {
          bottom: 12px;
          right: 12px;
          background: rgba(5, 150, 105, 0.95);
          color: #ffffff;
          border: 1px solid rgba(167, 243, 208, 0.4);
        }

        /* Side by Side Mode */
        .side-by-side-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
        }
        .side-card {
          position: relative;
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          background: #0f172a;
          height: 220px;
          border: 1px solid var(--border);
        }
        .side-card-before {
          border-color: #fca5a5;
        }
        .side-card-after {
          border-color: #86efac;
        }
        .side-card-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 0.68rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          z-index: 2;
        }
        .side-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slider-instruction {
          text-align: center;
          padding: 0.4rem 0.5rem;
          font-size: 0.72rem;
          color: #64748b;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          font-weight: 600;
        }
        .resolution-remarks-box {
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border-top: 1px solid #bbf7d0;
          font-size: 0.82rem;
        }
        .remarks-label {
          color: #166534;
          display: block;
          margin-bottom: 0.2rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .remarks-text {
          color: #14532d;
          margin: 0;
          font-style: italic;
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .slider-viewport {
            height: 240px;
          }
          .side-by-side-grid {
            grid-template-columns: 1fr;
          }
          .side-card {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}
