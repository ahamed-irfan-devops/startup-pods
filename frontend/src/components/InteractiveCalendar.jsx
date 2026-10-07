import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';

const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateToLocalStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMax7DaysStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const InteractiveCalendar = ({ userRole, onSelectSlotToBook }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => getLocalTodayStr());
  const [viewMode, setViewMode] = useState('day'); // 'day', 'list'
  const [slotGranularity, setSlotGranularity] = useState('30min'); // '30min' or '1hr'
  const [showPastSlots, setShowPastSlots] = useState(false); // default hide past slots
  const [cabins, setCabins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate, viewMode]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const cabinsRes = await apiRequest('/cabins');
      const activeCabins = (cabinsRes.cabins || []).filter(c => c.status !== 'INACTIVE');
      setCabins(activeCabins);

      const bookingsRes = await apiRequest(`/bookings?date=${selectedDate}`);
      setBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.error('Calendar error', err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const d = new Date(y, m - 1, dNum);
    d.setDate(d.getDate() + days);
    const newDateStr = formatDateToLocalStr(d);
    if (newDateStr < getLocalTodayStr() || newDateStr > getMax7DaysStr()) {
      return;
    }
    setSelectedDate(newDateStr);
  };

  const slots15Min = [
    '08:00', '08:15', '08:30', '08:45',
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45'
  ];

  const slots30Min = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const slots1Hr = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const currentSlots = slotGranularity === '15min' ? slots15Min : (slotGranularity === '30min' ? slots30Min : slots1Hr);
  const slotDuration = slotGranularity === '15min' ? 15 : (slotGranularity === '30min' ? 30 : 60);

  const getBookingForSlot = (cabinId, hourStr) => {
    const [h, m] = hourStr.split(':').map(Number);
    const slotStartMin = h * 60 + m;
    const slotEndMin = slotStartMin + slotDuration;

    return bookings.find(b => {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      if (Number(b.cabin_id) !== Number(cabinId)) return false;
      const [bStartH, bStartM] = b.start_time.split(':').map(Number);
      const [bEndH, bEndM] = b.end_time.split(':').map(Number);
      const bStartMin = bStartH * 60 + bStartM;
      const bEndMin = bEndH * 60 + bEndM;
      return bStartMin < slotEndMin && bEndMin > slotStartMin;
    });
  };

  const visibleTimeSlots = currentSlots.filter(h => {
    const todayStr = getLocalTodayStr();
    if (selectedDate !== todayStr) return true;
    if (showPastSlots) return true;

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [slotH, slotM] = h.split(':').map(Number);
    const slotEndMin = (slotH * 60 + slotM) + slotDuration;
    return slotEndMin > currentMin;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Calendar Top Control Header */}
      <div className="glass-card calendar-controls-wrapper" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="calendar-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => changeDate(-1)}>
            <ChevronLeft size={16} /> Prev
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(getLocalTodayStr())}>
            Today
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => changeDate(1)}>
            Next <ChevronRight size={16} />
          </button>

          <input
            type="date"
            className="form-input"
            value={selectedDate}
            min={getLocalTodayStr()}
            max={getMax7DaysStr()}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          />

          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Toggle Past Slots for Today */}
          {selectedDate === getLocalTodayStr() && (
            <button
              onClick={() => setShowPastSlots(!showPastSlots)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
              title={showPastSlots ? "Hide slots that have already passed" : "Show slots that have already passed"}
            >
              {showPastSlots ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPastSlots ? 'Hide Past Slots' : 'Show Past Slots'}
            </button>
          )}

          {/* Granularity Switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setSlotGranularity('15min')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: slotGranularity === '15min' ? '#2563EB' : 'transparent',
                color: slotGranularity === '15min' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              15-Min Grid
            </button>
            <button
              onClick={() => setSlotGranularity('30min')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: slotGranularity === '30min' ? '#2563EB' : 'transparent',
                color: slotGranularity === '30min' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              30-Min Grid
            </button>
            <button
              onClick={() => setSlotGranularity('1hr')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: slotGranularity === '1hr' ? '#2563EB' : 'transparent',
                color: slotGranularity === '1hr' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              1-Hour Grid
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('day')}
            >
              Timeline Grid
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend-container">
        <span style={{ color: '#475569', fontWeight: 600 }}>Status Key:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#166534', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#166534' }}></span> Available
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#DC2626', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626' }}></span> First Request (Pending)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0F172A', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F172A' }}></span> Confirmed (Booked)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#6B21A8', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6' }}></span> Maintenance
        </span>
      </div>

      {/* Timeline Grid (5 Cabins x Dynamic Columns) */}
      {viewMode === 'day' && (
        <div className="glass-card calendar-table-card" style={{ padding: '1rem', overflowX: 'auto' }}>
          {visibleTimeSlots.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#92400E' }}>
                ⏰ All cabin operating slots for today ({selectedDate}) have finished.
              </p>
              <p style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '4px' }}>
                Click "Show Past Slots" in the top bar to inspect previous timeline data or choose another date.
              </p>
            </div>
          ) : (
            <table className="calendar-grid-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: visibleTimeSlots.length * 55 + 110 + 'px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th className="calendar-cabin-col-header" style={{ width: '160px', padding: '0.75rem 0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left', position: 'sticky', left: 0, background: '#F8FAFC', zIndex: 2 }}>
                    Cabin Name
                  </th>
                  {visibleTimeSlots.map(h => {
                    const isHourOrHalf = h.endsWith(':00') || h.endsWith(':30');
                    return (
                      <th key={h} className="calendar-slot-th" style={{ padding: '0.6rem 0.25rem', fontSize: '0.75rem', color: isHourOrHalf ? '#2563EB' : '#64748B', fontWeight: isHourOrHalf ? 700 : 500, textAlign: 'center', background: isHourOrHalf ? '#EFF6FF' : 'transparent' }}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleTimeSlots.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      Loading availability calendar data...
                    </td>
                  </tr>
                ) : cabins.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="calendar-cabin-col-cell" style={{ padding: '0.75rem 0.5rem', position: 'sticky', left: 0, background: '#FFFFFF', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Cap: {c.capacity}</div>
                      {c.status === 'MAINTENANCE' && (
                        <span className="badge badge-maintenance" style={{ fontSize: '0.6rem', marginTop: '2px' }}>🛠 Maintenance</span>
                      )}
                    </td>

                    {visibleTimeSlots.map(h => {
                      const todayStr = getLocalTodayStr();
                      const isToday = selectedDate === todayStr;
                      const now = new Date();
                      const currentMin = now.getHours() * 60 + now.getMinutes();
                      const [slotH, slotM] = h.split(':').map(Number);
                      const slotEndMin = (slotH * 60 + slotM) + slotDuration;
                      const isPast = isToday && (slotEndMin <= currentMin);

                      if (c.status === 'MAINTENANCE') {
                        return (
                          <td key={h} style={{ padding: '3px', background: '#F3E8FF', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: '#6B21A8', fontWeight: 600 }}>Maint</span>
                          </td>
                        );
                      }

                      // Check if there is an active booking on this slot (EVEN IF PAST!)
                      const booking = getBookingForSlot(c.id, h);

                      if (booking) {
                        const isOwn = userRole !== 'COMPANY_HR' || booking.company_id === user?.company_id || booking.is_own;
                        const isConfirmed = booking.status === 'CONFIRMED';

                        // Red for First Request / Pending; Black for Confirmed Booking
                        const cellBg = isConfirmed ? '#0F172A' : '#DC2626';
                        const cellBorder = isConfirmed ? '#1E293B' : '#B91C1C';
                        const mainTextColor = '#FFFFFF';
                        const subTextColor = isConfirmed ? '#94A3B8' : '#FECACA';
                        const statusLabel = isConfirmed ? 'BOOKED' : '1ST REQ';

                        if (!isOwn) {
                          return (
                            <td key={h} style={{ padding: '3px' }}>
                              <div style={{
                                background: cellBg,
                                border: `1px solid ${cellBorder}`,
                                borderRadius: '5px',
                                padding: '4px 2px',
                                textAlign: 'center',
                                color: mainTextColor,
                                fontSize: '0.6rem',
                                fontWeight: 700
                              }} title={isConfirmed ? "Confirmed booking by another tenant company" : "First request pending approval by another tenant company"}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                  <Lock size={9} color={mainTextColor} />
                                  <span>{statusLabel}</span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={h} style={{ padding: '3px' }}>
                            <div
                              onClick={() => setSelectedBooking(booking)}
                              style={{
                                background: cellBg,
                                border: `1px solid ${cellBorder}`,
                                borderRadius: '5px',
                                padding: '4px 2px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'transform 0.1s ease',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                              }}
                              title={`Booking: ${booking.booking_code} (${booking.start_time} - ${booking.end_time}) - ${isConfirmed ? 'Confirmed' : 'First Request Pending'}`}
                            >
                              <div style={{ fontSize: '0.63rem', fontWeight: 700, color: mainTextColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.booking_code}
                              </div>
                              <div style={{ fontSize: '0.55rem', color: subTextColor, fontWeight: 600 }}>
                                {isConfirmed ? '● BOOKED' : '▲ 1ST REQ'}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // If slot has passed for today and showPastSlots toggle is ON
                      if (isPast) {
                        return (
                          <td key={h} style={{ padding: '3px' }}>
                            <div
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '5px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                cursor: 'not-allowed'
                              }}
                              title="This time slot has passed for today"
                            >
                              PASSED
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={h} style={{ padding: '3px' }}>
                          <div
                            onClick={() => onSelectSlotToBook && onSelectSlotToBook(c.id, h, selectedDate)}
                            style={{
                              background: '#F0FDF4',
                              border: '1px dashed #BBF7D0',
                              borderRadius: '5px',
                              height: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#166534',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            className="free-slot-card"
                            title={`Click to book ${c.name} starting at ${h} on ${selectedDate}`}
                          >
                            + BOOK
                          </div>
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-card" style={{ padding: '1rem' }}>
          {bookings.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748B', padding: '2rem' }}>No bookings scheduled for {selectedDate}.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Cabin</th>
                  <th>Company</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{b.booking_code}</td>
                    <td>{b.cabin_name}</td>
                    <td>{b.company_name}</td>
                    <td>{b.start_time} - {b.end_time}</td>
                    <td>{b.purpose}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(b)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={`Booking Details: ${selectedBooking?.booking_code}`}
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={selectedBooking.status} />
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Ref ID: {selectedBooking.booking_code}
              </span>
            </div>

            <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Cabin:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{selectedBooking.cabin_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Tenant Company:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{selectedBooking.company_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Date & Time:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.booking_date} ({selectedBooking.start_time} - {selectedBooking.end_time})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Attendees:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.people_count} People</strong>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Meeting Purpose:</span>
                <p style={{ color: '#0F172A', fontWeight: 600, marginTop: '2px', fontSize: '0.9rem' }}>{selectedBooking.purpose}</p>
              </div>

              {selectedBooking.notes && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>HR Notes:</span>
                  <p style={{ color: '#334155', fontSize: '0.85rem' }}>{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.rejection_reason && (
                <div style={{ marginTop: '0.85rem', background: '#FEF2F2', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5' }}>
                  <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Rejection Reason:</span>
                  <p style={{ color: '#991B1B', fontSize: '0.85rem', marginTop: '2px' }}>{selectedBooking.rejection_reason}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedBooking(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .slot-hover-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .free-slot-card:hover {
          background: #DCFCE7 !important;
          border-color: #4ADE80 !important;
        }
      `}</style>
    </div>
  );
};
