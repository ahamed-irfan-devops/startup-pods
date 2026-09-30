import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalize = (status || '').toUpperCase();

  switch (normalize) {
    case 'PENDING':
      return <span className="badge badge-pending">⏳ Pending Review</span>;
    case 'CONFIRMED':
      return <span className="badge badge-confirmed">✓ Confirmed</span>;
    case 'REJECTED':
      return <span className="badge badge-rejected">✕ Rejected</span>;
    case 'CANCELLED':
      return <span className="badge badge-cancelled">⊘ Cancelled</span>;
    case 'COMPLETED':
      return <span className="badge badge-confirmed">★ Completed</span>;
    case 'AVAILABLE':
      return <span className="badge badge-available">● Available</span>;
    case 'MAINTENANCE':
      return <span className="badge badge-maintenance">🛠 Maintenance</span>;
    case 'INACTIVE':
      return <span className="badge badge-cancelled">Off-line</span>;
    default:
      return <span className="badge badge-cancelled">{status}</span>;
  }
};
