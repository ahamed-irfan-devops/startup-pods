import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import animationData from '../assets/404-doodle-animation.json';
import { Home } from 'lucide-react';

export const NotFound = ({ onGoHome }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData
    });

    return () => anim.destroy();
  }, []);

  const handleHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      {/* Lottie 404 Doodle Animation */}
      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div style={{ maxWidth: '480px', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748B', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Oops! The page or cabin resource you are looking for doesn't exist or has been moved.
        </p>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handleHome}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#2563EB',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              cursor: 'pointer'
            }}
          >
            <Home size={18} />
            <span>Go Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
