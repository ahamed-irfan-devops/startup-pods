import React from 'react';

export const Skeleton = ({ style = {}, className = '' }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s infinite ease-in-out',
        borderRadius: '8px',
        height: '20px',
        width: '100%',
        ...style
      }}
      className={`skeleton-primitive ${className}`}
    />
  );
};
