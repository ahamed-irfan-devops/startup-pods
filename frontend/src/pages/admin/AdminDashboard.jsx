import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { AlertTriangle } from 'lucide-react';

export const AdminDashboard = ({ setActiveTab }) => {
  const [metrics, setMetrics] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await apiRequest('/reports/summary');
      setMetrics(summaryRes.metrics);

      const pendingRes = await apiRequest('/bookings?status=PENDING');
      setPendingRequests(pendingRes.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Central Cabin Admin Operations</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Review company booking requests, monitor cabin utilization, and approve schedule allocations.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Today's Total Bookings</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#0F172A', marginTop: '0.25rem' }}>
            {metrics ? metrics.todayBookings : 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>Pending Approval Requests</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#D97706', marginTop: '0.25rem' }}>
            {metrics ? metrics.pendingRequests : 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #166534' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Confirmed Bookings</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#166534', marginTop: '0.25rem' }}>
            {metrics ? metrics.confirmedToday : 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 600 }}>Available Shared Cabins</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#2563EB', marginTop: '0.25rem' }}>
            {metrics ? metrics.availableCabinsRightNow : 0} / 5
          </div>
        </div>
      </div>

      {/* Action Banner for Pending Queue */}
      {pendingRequests.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#D97706" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#92400E' }}>
                {pendingRequests.length} Pending Booking Requests Require Your Approval
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#B45309' }}>
                Review request details, check overlap conflicts, and grant approval.
              </p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setActiveTab('requests')}>
            Go to Approval Queue
          </button>
        </div>
      )}

      {/* Pending Requests Preview Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Pending Requests Queue</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('requests')}>
            View Full Queue
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '1.5rem' }}>
            🎉 All booking requests have been reviewed and processed!
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Company</th>
                <th>Cabin</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{b.booking_code}</td>
                  <td style={{ fontWeight: 500 }}>{b.company_name}</td>
                  <td>{b.cabin_name}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.start_time} - {b.end_time}</td>
                  <td>{b.purpose}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('requests')}>
                      Review Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
