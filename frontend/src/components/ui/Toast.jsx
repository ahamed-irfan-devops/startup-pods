import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const isError = type === 'error';
  const isWarning = type === 'warning';

  return (
    <div
      style={{
        padding: '0.85rem 1.25rem',
        borderRadius: '8px',
        background: isError ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#F0FDF4',
        border: `1px solid ${isError ? '#FCA5A5' : isWarning ? '#FDE68A' : '#86EFAC'}`,
        color: isError ? '#991B1B' : isWarning ? '#92400E' : '#166534',
        fontSize: '0.875rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isError ? <XCircle size={18} /> : isWarning ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
        >
          ×
        </button>
      )}
    </div>
  );
};
