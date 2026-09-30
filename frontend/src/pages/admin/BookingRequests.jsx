import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { AlertCircle } from 'lucide-react';

export const BookingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notesModalBooking, setNotesModalBooking] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');

  const [processingId, setProcessingId] = useState(null);
  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = '/bookings';
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await apiRequest(url);
      setRequests(res.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking) => {
    setProcessingId(booking.id);
    setConflictError('');
    try {
      await apiRequest(`/bookings/${booking.id}/approve`, { method: 'POST' });
      fetchRequests();
    } catch (err) {
      setConflictError(`Conflict Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModalBooking || !rejectionReason.trim()) return;
    setProcessingId(rejectModalBooking.id);
    setConflictError('');

    try {
      await apiRequest(`/bookings/${rejectModalBooking.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      });

      setRejectModalBooking(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setConflictError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!notesModalBooking) return;
    try {
      await apiRequest(`/bookings/${notesModalBooking.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ internal_notes: internalNotes })
      });
      setNotesModalBooking(null);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = requests.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.booking_code.toLowerCase().includes(q) ||
           b.company_name.toLowerCase().includes(q) ||
           b.user_name.toLowerCase().includes(q) ||
           b.cabin_name.toLowerCase().includes(q) ||
           b.purpose.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Booking Requests Queue</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Review, approve, or reject meeting cabin bookings submitted by company HR contacts.
        </p>
      </div>

      {conflictError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{conflictError}</span>
        </div>
      )}

      {/* Filter Header */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Code, Company, HR Name, Cabin..."
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
          <option value="PENDING">PENDING ONLY</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="">ALL STATUSES</option>
        </select>
      </div>

      {/* Main Approval Queue Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Loading requests queue...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>No booking requests found for filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Company</th>
                <th>HR / User</th>
                <th>Cabin</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Purpose</th>
                <th>People</th>
                <th>Requested At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{b.booking_code}</td>
                  <td style={{ fontWeight: 600, color: '#2563EB' }}>{b.company_name}</td>
                  <td>{b.user_name}</td>
                  <td>{b.cabin_name}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.start_time} - {b.end_time}</td>
                  <td>{b.purpose}</td>
                  <td>{b.people_count}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(b)} title="View Details">
                        View
                      </button>

                      {b.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={processingId === b.id}
                            onClick={() => handleApprove(b)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={processingId === b.id}
                            onClick={() => {
                              setRejectModalBooking(b);
                              setRejectionReason('Cabin unavailable during the requested period.');
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setNotesModalBooking(b);
                          setInternalNotes(b.internal_notes || '');
                        }}
                        title="Add Internal Admin Note"
                      >
                        Note
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={`Request Details: ${selectedBooking?.booking_code}`}>
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={selectedBooking.status} />
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Submitted: {new Date(selectedBooking.created_at).toLocaleString()}</span>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Company:</span>
                  <strong style={{ color: '#2563EB', fontWeight: 600 }}>{selectedBooking.company_name} ({selectedBooking.company_email})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Submitted By HR:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.user_name} ({selectedBooking.user_email})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Cabin:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.cabin_name} ({selectedBooking.cabin_location})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Date & Time:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.booking_date} ({selectedBooking.start_time} - {selectedBooking.end_time})</strong>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Meeting Purpose:</span>
                <p style={{ color: '#0F172A', fontWeight: 500 }}>{selectedBooking.purpose}</p>
              </div>

              {selectedBooking.notes && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>HR Notes:</span>
                  <p style={{ color: '#334155', fontSize: '0.8rem' }}>{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.internal_notes && (
                <div style={{ marginTop: '0.75rem', background: '#EFF6FF', padding: '0.65rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <span style={{ color: '#1E40AF', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Internal Admin Note:</span>
                  <p style={{ color: '#0F172A', fontSize: '0.8rem' }}>{selectedBooking.internal_notes}</p>
                </div>
              )}

              {selectedBooking.rejection_reason && (
                <div style={{ marginTop: '0.75rem', background: '#FEE2E2', padding: '0.65rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Rejection Reason:</span>
                  <p style={{ color: '#991B1B', fontSize: '0.8rem' }}>{selectedBooking.rejection_reason}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModalBooking} onClose={() => setRejectModalBooking(null)} title={`Reject Booking ${rejectModalBooking?.booking_code}`}>
        <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#334155' }}>
            Rejecting request from <strong style={{ color: '#2563EB' }}>{rejectModalBooking?.company_name}</strong> for {rejectModalBooking?.cabin_name} on {rejectModalBooking?.booking_date}.
          </p>

          <div className="form-group">
            <label className="form-label">Mandatory Rejection Reason (Visible to Company HR)</label>
            <textarea
              className="form-textarea"
              rows="3"
              required
              placeholder="e.g. Cabin already reserved for an internal facility meeting."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRejectModalBooking(null)}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Internal Notes Modal */}
      <Modal isOpen={!!notesModalBooking} onClose={() => setNotesModalBooking(null)} title={`Internal Notes: ${notesModalBooking?.booking_code}`}>
        <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Internal Admin Note (Private to Admin Team)</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="e.g. VIP client visiting, ensure AV room check 15 mins prior"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setNotesModalBooking(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Note</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
