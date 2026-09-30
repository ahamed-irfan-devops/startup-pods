import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'success', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  isLoading = false,
  isDisabled = false,
  type = 'button',
  onClick,
  style = {},
  className = '',
  title = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          color: '#FFFFFF',
          border: '1px solid #1E40AF',
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
        };
      case 'secondary':
        return {
          background: '#F1F5F9',
          color: '#0F172A',
          border: '1px solid #CBD5E1'
        };
      case 'outline':
        return {
          background: '#FFFFFF',
          color: '#334155',
          border: '1px solid #E2E8F0'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          color: '#FFFFFF',
          border: '1px solid #991B1B',
          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
          color: '#FFFFFF',
          border: '1px solid #166534',
          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#64748B',
          border: 'none'
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', height: '32px' };
      case 'lg':
        return { padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '10px', height: '48px' };
      case 'md':
      default:
        return { padding: '0.5rem 1.1rem', fontSize: '0.875rem', borderRadius: '8px', height: '38px' };
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: isDisabled || isLoading ? 0.65 : 1,
        transition: 'all 0.15s ease',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      className={`btn-primitive ${className}`}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};
