import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/bookings?own_only=true';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await apiRequest(url);
      setBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;
    setActionError('');
    setCancelling(true);

    try {
      await apiRequest(`/bookings/${cancelModalBooking.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellation_reason: cancellationReason })
      });

      setCancelModalBooking(null);
      setCancellationReason('');
      fetchBookings();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.booking_code.toLowerCase().includes(q) ||
           b.purpose.toLowerCase().includes(q) ||
           b.cabin_name.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Company Booking History</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Manage cabin requests and view booking status for your company.
        </p>
      </div>

      {/* Filter Header */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Booking Code, Purpose, or Cabin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>No bookings matching criteria.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Cabin</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Purpose</th>
                <th>People</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{b.booking_code}</td>
                  <td>{b.cabin_name}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.start_time} - {b.end_time}</td>
                  <td>{b.purpose}</td>
                  <td>{b.people_count}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(b)}>
                      Details
                    </button>

                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                      <button className="btn btn-danger btn-sm" onClick={() => setCancelModalBooking(b)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking Details Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={`Booking Code: ${selectedBooking?.booking_code}`}>
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={selectedBooking.status} />
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Requested: {new Date(selectedBooking.created_at).toLocaleString()}</span>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Cabin:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.cabin_name} ({selectedBooking.cabin_location})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Date:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.booking_date}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Time Slot:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.start_time} - {selectedBooking.end_time}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Attendees:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.people_count} People</strong>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Meeting Purpose:</span>
                <p style={{ color: '#0F172A', fontWeight: 500 }}>{selectedBooking.purpose}</p>
              </div>

              {selectedBooking.rejection_reason && (
                <div style={{ marginTop: '0.75rem', background: '#FEE2E2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Central Admin Rejection Reason:</span>
                  <p style={{ color: '#991B1B', fontSize: '0.85rem', marginTop: '2px' }}>{selectedBooking.rejection_reason}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={!!cancelModalBooking} onClose={() => setCancelModalBooking(null)} title={`Cancel Booking ${cancelModalBooking?.booking_code}`}>
        <form onSubmit={handleCancelBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#334155' }}>
            Are you sure you want to cancel booking for <strong style={{ color: '#0F172A' }}>{cancelModalBooking?.cabin_name}</strong> on {cancelModalBooking?.booking_date} ({cancelModalBooking?.start_time} - {cancelModalBooking?.end_time})?
          </p>

          {actionError && (
            <div style={{ color: '#991B1B', fontSize: '0.85rem', background: '#FEE2E2', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              {actionError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Cancellation Reason (Optional)</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="e.g. Client rescheduled, meeting no longer required"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCancelModalBooking(null)}>Keep Booking</button>
            <button type="submit" className="btn btn-danger" disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
