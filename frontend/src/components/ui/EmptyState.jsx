import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div style={{
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      borderRadius: '12px',
      border: '1px dashed #CBD5E1'
    }}>
      {Icon && (
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563EB',
          marginBottom: '1rem'
        }}>
          <Icon size={26} />
        </div>
      )}
      {title && (
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
          {title}
        </h4>
      )}
      {description && (
        <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '360px', marginBottom: actionLabel ? '1.25rem' : '0' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
