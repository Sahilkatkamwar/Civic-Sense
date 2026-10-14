// client/src/modules/report/LiveMediaCaptureModal.jsx
// Live Camera Photo Snap & Video Recording Modal with WebRTC Viewfinder
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  X,
  RefreshCw,
  Check,
  SwitchCamera,
  AlertCircle,
  Square,
  Sparkles,
  Play,
  RotateCcw,
  Upload
} from 'lucide-react';

export default function LiveMediaCaptureModal({
  isOpen,
  initialMode = 'photo', // 'photo' | 'video'
  onClose,
  onCapture
}) {
  const [mode, setMode] = useState(initialMode); // 'photo' | 'video'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const MAX_RECORDING_SECONDS = 30; // Max 30 seconds to keep payload responsive

  // Review state (after snapping or recording)
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reviewMediaType, setReviewMediaType] = useState(null); // 'image' | 'video'

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Sync mode with prop when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCapturedBlob(null);
      setCapturedFile(null);
      setPreviewUrl(null);
      setReviewMediaType(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      setCameraError(null);
    }
  }, [isOpen, initialMode]);

  // Start or restart camera stream whenever modal is open, facingMode changes, or mode changes (if not in review)
  useEffect(() => {
    if (!isOpen || capturedFile) {
      // If modal is closed or we have captured media in review, ensure stream is stopped
      stopStreamTracks();
      return;
    }

    startCameraStream();

    return () => {
      stopStreamTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, facingMode, mode, capturedFile]);

  // Stop camera tracks cleanly
  const stopStreamTracks = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
    }
  };

  // Start WebRTC camera stream with graceful audio fallback
  const startCameraStream = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopStreamTracks();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access (getUserMedia) is not supported in this browser. Please use the device browse or fallback camera option.');
      setIsInitializing(false);
      return;
    }

    const videoConstraints = {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    };

    try {
      let mediaStream;
      if (mode === 'video') {
        try {
          // Attempt with audio for video recording
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: true
          });
        } catch (audioErr) {
          console.warn('Microphone permission or hardware unavailable, falling back to video-only stream:', audioErr);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false
          });
        }
      } else {
        // Photo mode: video only
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing device camera:', err);
      let msg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser or address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application.';
      }
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Ensure video element receives stream once rendered
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Flip between environment (back) and user (front)
  const toggleFacingMode = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take photo snapshot from active video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;

    try {
      const videoEl = videoRef.current;
      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Mirror if using front camera
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoEl, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setCameraError('Failed to capture snapshot from video feed.');
            return;
          }
          const fileName = `live-photo-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);

          setCapturedBlob(blob);
          setCapturedFile(file);
          setPreviewUrl(url);
          setReviewMediaType('image');
          stopStreamTracks();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error snapping photo:', err);
      setCameraError('Failed to capture photo frame: ' + err.message);
    }
  };

  // Start live video recording
  const handleStartRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    // Pick supported MIME type
    let mimeType = 'video/webm';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }
    }

    try {
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
        const ext = finalType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        const fileName = `live-video-${Date.now()}.${ext}`;
        const file = new File([blob], fileName, { type: finalType });
        const url = URL.createObjectURL(blob);

        setCapturedBlob(blob);
        setCapturedFile(file);
        setPreviewUrl(url);
        setReviewMediaType('video');
        setIsRecording(false);
        stopStreamTracks();
      };

      recorder.start(500); // 500ms time slice
      setIsRecording(true);

      // Start elapsed timer
      let elapsed = 0;
      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          handleStopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      setCameraError('Could not start video recorder: ' + err.message);
    }
  };

  // Stop video recording
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
    }
  };

  // Retake: discard captured media and restart camera
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setCapturedFile(null);
    setPreviewUrl(null);
    setReviewMediaType(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    startCameraStream();
  };

  // Confirm and attach captured media to parent form
  const handleConfirm = () => {
    if (!capturedFile) return;
    onCapture({
      file: capturedFile,
      previewUrl,
      mediaType: reviewMediaType
    });
    handleClose();
  };

  // Close modal and clean up all state and resources
  const handleClose = () => {
    if (isRecording) {
      handleStopRecording();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopStreamTracks();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setCapturedFile(null);
    setPreviewUrl(null);
    setReviewMediaType(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    onClose();
  };

  // Native device camera fallback (e.g. mobile Safari / Chrome direct trigger)
  const handleNativeCameraFallback = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const isVid = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      setCapturedFile(file);
      setCapturedBlob(file);
      setPreviewUrl(url);
      setReviewMediaType(isVid ? 'video' : 'image');
      setCameraError(null);
    }
  };

  if (!isOpen) return null;

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="live-camera-modal-backdrop" onClick={handleClose}>
      <div className="live-camera-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="live-camera-header">
          <div className="live-camera-title-wrap">
            <div className="live-camera-icon-badge">
              {mode === 'photo' ? <Camera size={18} /> : <Video size={18} />}
            </div>
            <div>
              <h3 className="live-camera-title">
                {capturedFile
                  ? 'Review Captured Evidence (साक्ष्य समीक्षा)'
                  : mode === 'photo'
                  ? 'Live Camera Photo Snap (प्रत्यक्ष फोटो कैप्चर)'
                  : 'Live Camera Video Recorder (प्रत्यक्ष वीडियो रिकॉर्डिंग)'}
              </h3>
              <p className="live-camera-sub">
                {capturedFile
                  ? 'Verify media clarity before attaching to municipal docket.'
                  : 'Capture verifiable geotagged ground truth directly from your device.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="live-camera-close-btn"
            onClick={handleClose}
            aria-label="Close camera"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs (only when not reviewing) */}
        {!capturedFile && (
          <div className="live-camera-mode-tabs">
            <button
              type="button"
              className={`mode-tab-btn ${mode === 'photo' ? 'active' : ''}`}
              onClick={() => {
                if (isRecording) return;
                setMode('photo');
              }}
              disabled={isRecording}
            >
              <Camera size={15} />
              <span>Snapshot Photo</span>
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${mode === 'video' ? 'active' : ''}`}
              onClick={() => {
                if (isRecording) return;
                setMode('video');
              }}
              disabled={isRecording}
            >
              <Video size={15} />
              <span>Record Video (Max 30s)</span>
            </button>
          </div>
        )}

        {/* Viewfinder / Preview Stage */}
        <div className="live-camera-stage">
          {capturedFile ? (
            /* REVIEW STAGE */
            <div className="live-camera-review-container">
              {reviewMediaType === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  autoPlay
                  className="live-camera-preview-media"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Captured Evidence"
                  className="live-camera-preview-media"
                />
              )}

              {/* Review Media Info Badge */}
              <div className="review-media-meta-tag">
                <Sparkles size={14} className="text-amber-400" />
                <span>
                  {reviewMediaType === 'video' ? '🎥 Live Video Clip' : '📸 Live Photo Snap'} &bull;{' '}
                  {formatFileSize(capturedFile.size)} &bull; Ready for Municipal Upload
                </span>
              </div>
            </div>
          ) : (
            /* ACTIVE CAMERA STREAM STAGE */
            <div className="live-camera-stream-container">
              {cameraError ? (
                /* Camera Error / Permission Fallback */
                <div className="live-camera-error-box">
                  <AlertCircle size={36} className="text-amber-500" />
                  <h4>Camera Access Unavailable</h4>
                  <p>{cameraError}</p>
                  <div className="live-camera-fallback-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={startCameraStream}
                    >
                      <RotateCcw size={14} /> Retry Camera
                    </button>
                    <label className="btn btn-saffron btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Use Native Camera Picker
                      <input
                        type="file"
                        ref={nativeCameraInputRef}
                        accept={mode === 'photo' ? 'image/*' : 'video/*'}
                        capture="environment"
                        onChange={handleNativeCameraFallback}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  {/* Live Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`live-camera-video-elem ${facingMode === 'user' ? 'mirrored' : ''}`}
                  />

                  {/* High-Tech Framing Brackets & Crosshair Overlay */}
                  <div className="viewfinder-overlay">
                    <div className="corner-bracket top-left" />
                    <div className="corner-bracket top-right" />
                    <div className="corner-bracket bottom-left" />
                    <div className="corner-bracket bottom-right" />
                    <div className="viewfinder-crosshair" />
                    <div className="viewfinder-guide-text">
                      {mode === 'photo'
                        ? 'Align hazard inside frame and hold steady'
                        : isRecording
                        ? `Recording active: ${formatTime(recordingSeconds)} / 00:30`
                        : 'Capture steady video showing incident context'}
                    </div>
                  </div>

                  {/* Stream Status Top Bar */}
                  <div className="stream-hud-bar">
                    {mode === 'video' && isRecording ? (
                      <div className="hud-badge rec-pulsing">
                        <span className="rec-dot" />
                        <span>REC {formatTime(recordingSeconds)}</span>
                      </div>
                    ) : (
                      <div className="hud-badge live-ready">
                        <span className="live-dot" />
                        <span>{mode === 'photo' ? 'PHOTO CAM READY' : 'VIDEO CAM READY'}</span>
                      </div>
                    )}

                    {/* Camera Flip Button */}
                    <button
                      type="button"
                      className="hud-action-btn"
                      onClick={toggleFacingMode}
                      disabled={isRecording}
                      title="Switch Front/Rear Camera"
                    >
                      <SwitchCamera size={16} />
                      <span className="hud-action-text">{facingMode === 'environment' ? 'Back' : 'Front'}</span>
                    </button>
                  </div>

                  {/* Recording Progress Bar (for Video mode) */}
                  {mode === 'video' && isRecording && (
                    <div className="recording-progress-bar-wrap">
                      <div
                        className="recording-progress-bar-fill"
                        style={{ width: `${(recordingSeconds / MAX_RECORDING_SECONDS) * 100}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Controls Footer */}
        <div className="live-camera-footer">
          {capturedFile ? (
            /* Review Controls */
            <div className="review-action-row">
              <button
                type="button"
                className="btn btn-secondary live-action-btn"
                onClick={handleRetake}
              >
                <RefreshCw size={15} /> Retake
              </button>
              <button
                type="button"
                className="btn btn-saffron live-action-btn"
                onClick={handleConfirm}
              >
                <Check size={16} /> Attach to Complaint
              </button>
            </div>
          ) : (
            /* Capture Controls */
            <div className="capture-action-row">
              {mode === 'photo' ? (
                /* SNAP PHOTO BUTTON */
                <button
                  type="button"
                  className="shutter-trigger-btn photo-shutter"
                  onClick={handleSnapPhoto}
                  disabled={isInitializing || !!cameraError}
                  aria-label="Capture Photo"
                >
                  <div className="shutter-inner-ring">
                    <Camera size={26} />
                  </div>
                </button>
              ) : (
                /* RECORD VIDEO BUTTON */
                <div className="video-trigger-wrap">
                  {!isRecording ? (
                    <button
                      type="button"
                      className="shutter-trigger-btn video-shutter-start"
                      onClick={handleStartRecording}
                      disabled={isInitializing || !!cameraError}
                      aria-label="Start Recording Video"
                    >
                      <div className="shutter-inner-ring video-rec-circle">
                        <Video size={24} />
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="shutter-trigger-btn video-shutter-stop"
                      onClick={handleStopRecording}
                      aria-label="Stop Recording Video"
                    >
                      <div className="shutter-inner-ring video-rec-stop">
                        <Square size={20} fill="currentColor" />
                      </div>
                    </button>
                  )}
                  <span className="trigger-caption">
                    {isRecording ? 'Click to Stop Recording' : 'Start Recording (30s max)'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .live-camera-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 23, 42, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .live-camera-modal-card {
          background: #0f172a;
          color: #f8fafc;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          width: 100%;
          max-width: 620px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6);
          animation: cameraModalScale 0.22s ease-out;
        }

        @keyframes cameraModalScale {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .live-camera-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: #1e293b;
        }

        .live-camera-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .live-camera-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(194, 65, 12, 0.2);
          color: #fb923c;
          border: 1px solid rgba(194, 65, 12, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .live-camera-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .live-camera-sub {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 0.15rem 0 0 0;
        }

        .live-camera-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .live-camera-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .live-camera-mode-tabs {
          display: flex;
          background: #090e17;
          padding: 6px 12px;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mode-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .mode-tab-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .mode-tab-btn.active {
          background: #1e293b;
          color: #f97316;
          border-color: rgba(249, 115, 22, 0.35);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .mode-tab-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .live-camera-stage {
          position: relative;
          background: #000000;
          min-height: 340px;
          max-height: 440px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .live-camera-stream-container {
          position: relative;
          width: 100%;
          height: 380px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .live-camera-video-elem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .live-camera-video-elem.mirrored {
          transform: scaleX(-1);
        }

        .live-camera-review-container {
          position: relative;
          width: 100%;
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        .live-camera-preview-media {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 380px;
        }

        .review-media-meta-tag {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          color: #f1f5f9;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        /* Viewfinder HUD Overlays */
        .viewfinder-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .corner-bracket {
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: rgba(255, 255, 255, 0.6);
          border-style: solid;
        }
        .corner-bracket.top-left {
          top: 24px;
          left: 24px;
          border-width: 3px 0 0 3px;
        }
        .corner-bracket.top-right {
          top: 24px;
          right: 24px;
          border-width: 3px 3px 0 0;
        }
        .corner-bracket.bottom-left {
          bottom: 38px;
          left: 24px;
          border-width: 0 0 3px 3px;
        }
        .corner-bracket.bottom-right {
          bottom: 38px;
          right: 24px;
          border-width: 0 3px 3px 0;
        }

        .viewfinder-crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          transform: translate(-50%, -50%);
          opacity: 0.4;
        }
        .viewfinder-crosshair::before,
        .viewfinder-crosshair::after {
          content: '';
          position: absolute;
          background: #ffffff;
        }
        .viewfinder-crosshair::before {
          top: 9px;
          left: 0;
          right: 0;
          height: 2px;
        }
        .viewfinder-crosshair::after {
          left: 9px;
          top: 0;
          bottom: 0;
          width: 2px;
        }

        .viewfinder-guide-text {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.72rem;
          background: rgba(0, 0, 0, 0.6);
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .stream-hud-bar {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: auto;
        }

        .hud-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
        }

        .hud-badge.live-ready {
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.4);
        }
        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
        }

        .hud-badge.rec-pulsing {
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.5);
          background: rgba(220, 38, 38, 0.25);
        }
        .rec-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: recBlink 1s infinite alternate;
        }
        @keyframes recBlink {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0.25; transform: scale(0.8); }
        }

        .hud-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background 0.15s;
        }
        .hud-action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }
        .hud-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .recording-progress-bar-wrap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.15);
        }
        .recording-progress-bar-fill {
          height: 100%;
          background: #ef4444;
          transition: width 0.9s linear;
        }

        /* Camera Error Box */
        .live-camera-error-box {
          padding: 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          max-width: 440px;
        }
        .live-camera-error-box h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .live-camera-error-box p {
          font-size: 0.8rem;
          color: #94a3b8;
          line-height: 1.4;
          margin: 0;
        }
        .live-camera-fallback-actions {
          display: flex;
          gap: 10px;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Controls Footer */
        .live-camera-footer {
          padding: 1.1rem 1.5rem;
          background: #1e293b;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .capture-action-row {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shutter-trigger-btn {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          transition: transform 0.12s ease, border-color 0.15s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .shutter-trigger-btn:hover:not(:disabled) {
          transform: scale(1.05);
          border-color: #fb923c;
        }
        .shutter-trigger-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .shutter-trigger-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .shutter-inner-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-shutter .shutter-inner-ring {
          background: #f97316;
          color: #ffffff;
        }

        .video-trigger-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .video-shutter-start .shutter-inner-ring {
          background: #ef4444;
          color: #ffffff;
        }
        .video-shutter-stop {
          border-color: #ef4444;
        }
        .video-shutter-stop .shutter-inner-ring {
          background: #dc2626;
          color: #ffffff;
          animation: recPulse 1s infinite alternate;
        }
        @keyframes recPulse {
          from { transform: scale(1); }
          to { transform: scale(0.92); }
        }

        .trigger-caption {
          font-size: 0.72rem;
          color: #cbd5e1;
          font-weight: 600;
        }

        .review-action-row {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .live-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.75rem 1rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
