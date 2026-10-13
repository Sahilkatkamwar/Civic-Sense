// client/src/modules/alerts/OfficialLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import './alerts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function OfficialLoginPage() {
  const [email, setEmail] = useState('officer@civicsense.local');
  const [password, setPassword] = useState('change_me_before_demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      sessionStorage.setItem('cs_official_token', data.token);
      sessionStorage.setItem('cs_official_user', JSON.stringify(data.official));
      navigate('/authority/alerts');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-alerts-page" style={{ maxWidth: 440, paddingTop: '3rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Shield size={24} style={{ color: 'var(--gov-navy)' }} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gov-navy)', margin: '0 0 0.35rem 0' }}>
            Municipal Officer Login
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Restricted administrative console for publishing verified civic alerts and emergency broadcast notices.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: 4, color: '#991b1b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Official Email:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="cs-radar-select"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@civicsense.local"
              />
              <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="cs-radar-select"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Official'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <Link to="/authority" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={13} />
            <span>Return to Municipal Command Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
