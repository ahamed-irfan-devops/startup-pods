import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const { setSession, fetchNotifications } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Success splash state for StartupPark login animation
  const [loginSuccessUser, setLoginSuccessUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify credentials via API
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // 2. Trigger StartupPark Success Animation
      setLoginSuccessUser(res.user);

      // 3. Delay token commit by 1.3s to display smooth success animation then log in
      setTimeout(() => {
        setSession(res.token, res.user);
        if (fetchNotifications) fetchNotifications();
      }, 1300);

    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090D16',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Background Radial Mesh & Floating Glowing Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0) 70%)',
          animation: 'orbFloat1 14s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '5%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, rgba(147, 51, 234, 0) 70%)',
          animation: 'orbFloat2 18s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '25%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 70%)',
          animation: 'orbFloat3 12s ease-in-out infinite',
          pointerEvents: 'none'
        }}
      />

      {/* Futuristic Subtle Grid Line Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
          opacity: 0.6
        }}
      />

      {/* Master Login Layout Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 10,
          animation: 'cardPopIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Ultra Glassmorphism Login Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px rgba(37, 99, 235, 0.12)',
            position: 'relative'
          }}
        >
          {/* Card Header Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                background: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
                marginBottom: '1rem'
              }}
            >
              <img
                src="/startup-pods-logo.png"
                alt="iQue Startup Pods Logo"
                style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Sign In to Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
              Enter your credentials to access your booking portal
            </p>
          </div>

          {error && (
            <div
              style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'cardPopIn 0.3s ease-out'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field with Glow Focus */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focusedInput === 'email' ? '#2563EB' : '#94A3B8',
                    transition: 'color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="form-input"
                  autoComplete="username"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '0.85rem',
                    height: '46px',
                    borderColor: focusedInput === 'email' ? '#2563EB' : '#CBD5E1',
                    boxShadow: focusedInput === 'email' ? '0 0 0 4px rgba(37, 99, 235, 0.18)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field with Glow Focus */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focusedInput === 'password' ? '#2563EB' : '#94A3B8',
                    transition: 'color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  autoComplete="current-password"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '2.75rem',
                    height: '46px',
                    borderColor: focusedInput === 'password' ? '#2563EB' : '#CBD5E1',
                    boxShadow: focusedInput === 'password' ? '0 0 0 4px rgba(37, 99, 235, 0.18)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem'
                  }}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Glowing Shimmer Submit Button */}
            <button
              type="submit"
              className="btn btn-primary login-shimmer-btn"
              style={{
                width: '100%',
                height: '48px',
                marginTop: '1.25rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating & Syncing...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
            🔒 Protected Enterprise Access • Central Cabin Hub System
          </div>
        </div>
      </div>

      {/* Startup Pods Clean White Authentication Loading Screen */}
      {loginSuccessUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#FFFFFF',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            animation: 'whiteSplashFadeIn 0.25s ease-out'
          }}
        >
          {/* Thin Circular Loader Ring */}
          <div
            className="spin-ring-loader"
            style={{
              width: '40px',
              height: '40px',
              border: '2.5px solid #F1F5F9',
              borderTopColor: '#0F172A',
              borderRadius: '50%',
              animation: 'spinRing 0.8s linear infinite, ringAppear 0.4s ease-out forwards'
            }}
          />

          {/* Clean Modern Startup Pods Text */}
          <h1
            className="text-fade-up"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: 0,
              padding: 0,
              opacity: 0,
              animation: 'textFadeUp 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              userSelect: 'none'
            }}
          >
            Startup Pods
          </h1>
        </div>
      )}
    </div>
  );
};
