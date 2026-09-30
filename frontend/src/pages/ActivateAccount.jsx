import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const ActivateAccount = ({ onGoToLogin }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL query string ?token=... or window.location
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      setVerifyError('Activation token is missing. Please check your invitation link.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, []);

  const verifyToken = async (rawToken) => {
    setLoading(true);
    setVerifyError('');
    try {
      const res = await apiRequest(`/auth/verify-activation-token?token=${encodeURIComponent(rawToken)}`);
      if (res.valid) {
        setUserInfo(res.user);
      } else {
        setVerifyError('Invalid or expired activation token.');
      }
    } catch (err) {
      setVerifyError(err.message || 'Verification failed. The activation link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  // Password Requirements Validation
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const isFormValid = hasMinLen && hasUpper && hasLower && hasNum && hasSpecial && isMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isFormValid) {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
      } else {
        setFormError('Please ensure your password meets all requirement criteria below.');
      }
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await apiRequest('/auth/activate-account', 'POST', {
        token,
        password,
        confirmPassword
      });

      if (res.success) {
        setActivatedSuccess(true);
      } else {
        setFormError(res.error || 'Failed to activate account.');
      }
    } catch (err) {
      setFormError(err.message || 'Account activation failed. Please try again or contact your admin.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGoToLogin = () => {
    // Clear URL params and navigate to login
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        padding: '1.5rem',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Startup Pods Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', width: '100%' }}>
          <div
            style={{
              background: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: '12px',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid #E2E8F0',
              marginBottom: '0.85rem'
            }}
          >
            <img
              src="/startup-pods-logo.png"
              alt="Startup Pods Logo"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Startup Pods
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Account Activation & Password Setup
          </p>
        </div>

        {/* State 1: Loading Token Verification */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', py: '2rem' }}>
            <div
              className="spin-ring-loader"
              style={{
                width: '40px',
                height: '40px',
                border: '2.5px solid #F1F5F9',
                borderTopColor: '#0F172A',
                borderRadius: '50%',
                animation: 'spinRing 0.8s linear infinite'
              }}
            />
            <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
              Verifying your activation invitation link...
            </p>
          </div>
        )}

        {/* State 2: Verification Error / Expired Link */}
        {!loading && verifyError && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '1.25rem',
                color: '#991B1B',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#DC2626' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Activation Link Invalid or Expired</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', lineHeight: 1.5, color: '#7F1D1D' }}>
                {verifyError}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              Go to Login Page
            </button>
          </div>
        )}

        {/* State 3: Activation Success Screen */}
        {!loading && activatedSuccess && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '12px',
                padding: '1.5rem',
                color: '#166534',
                marginBottom: '1.5rem'
              }}
            >
              <CheckCircle2 size={42} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#22C55E' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#14532D' }}>
                Account Activated Successfully!
              </h3>
              <p style={{ fontSize: '0.875rem', marginTop: '6px', color: '#166534', lineHeight: 1.5 }}>
                Your password has been securely set. You can now log into your Startup Pods account portal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700
              }}
            >
              <span>GO TO LOGIN</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* State 4: Set Password Form */}
        {!loading && !verifyError && !activatedSuccess && userInfo && (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {formError && (
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {/* Read-Only Account Details */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Activating Account For:
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                {userInfo.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                {userInfo.email}
              </div>
              {userInfo.company_name && (
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  Company: {userInfo.company_name}
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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
                    padding: '0.25rem'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>

            {/* Password Requirement Checklist */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                Password Requirements:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.75rem' }}>
                <span style={{ color: hasMinLen ? '#166534' : '#64748B', fontWeight: hasMinLen ? 600 : 400 }}>
                  {hasMinLen ? '✓' : '•'} Min 8 characters
                </span>
                <span style={{ color: hasUpper ? '#166534' : '#64748B', fontWeight: hasUpper ? 600 : 400 }}>
                  {hasUpper ? '✓' : '•'} Uppercase letter (A-Z)
                </span>
                <span style={{ color: hasLower ? '#166534' : '#64748B', fontWeight: hasLower ? 600 : 400 }}>
                  {hasLower ? '✓' : '•'} Lowercase letter (a-z)
                </span>
                <span style={{ color: hasNum ? '#166534' : '#64748B', fontWeight: hasNum ? 600 : 400 }}>
                  {hasNum ? '✓' : '•'} Number (0-9)
                </span>
                <span style={{ color: hasSpecial ? '#166534' : '#64748B', fontWeight: hasSpecial ? 600 : 400 }}>
                  {hasSpecial ? '✓' : '•'} Special char (!@#$)
                </span>
                <span style={{ color: isMatch ? '#166534' : '#64748B', fontWeight: isMatch ? 600 : 400 }}>
                  {isMatch ? '✓' : '•'} Passwords match
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitLoading || !isFormValid}
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {submitLoading ? 'Setting Password...' : 'SET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
