import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  style = {},
  className = '',
  ...props
}) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: title ? '1rem' : '0',
        ...style
      }}
      className={`glass-card ${className}`}
      {...props}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            {title && (
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
