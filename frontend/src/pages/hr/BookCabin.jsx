import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { AlertCircle, CheckCircle2, Check, ArrowRight } from 'lucide-react';

const getLocalTodayStr = () => {
  const d = new Date();
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

export const BookCabin = ({ setActiveTab, preselectedCabinId, preselectedStartHour, preselectedDate }) => {
  useAuth();
  const [cabins, setCabins] = useState([]);
  const [_rules, setRules] = useState(null);

  const [gridStep, setGridStep] = useState(15); // 15, 30, or 60 min intervals

  const computeEndTime = (startStr) => {
    if (!startStr) return '09:30';
    const [h, m] = startStr.split(':').map(Number);
    const stepM = gridStep;
    const totalEndMin = h * 60 + m + stepM;
    const endH = String(Math.floor(totalEndMin / 60)).padStart(2, '0');
    const endM = String(totalEndMin % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const getNextUpcomingTime = () => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const stepM = gridStep;
    const nextStep = Math.ceil((currentMin + 1) / stepM) * stepM;
    const h = Math.floor(nextStep / 60);
    const m = nextStep % 60;
    if (h >= 18) return '09:00';
    const startHStr = String(Math.max(8, h)).padStart(2, '0');
    const startMStr = String(m).padStart(2, '0');
    return `${startHStr}:${startMStr}`;
  };

  const generateTimeOptions = () => {
    const step = gridStep;
    const startHour = 8;
    const endHour = 18;
    const options = [];
    for (let m = startHour * 60; m <= endHour * 60; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const val = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : (h > 12 ? h - 12 : h);
      const label = `${val} (${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period})`;
      options.push({ value: val, label });
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const defaultStart = preselectedStartHour || getNextUpcomingTime();

  const [cabinId, setCabinId] = useState(preselectedCabinId || '');
  const [bookingDate, setBookingDate] = useState(preselectedDate || getLocalTodayStr());
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(() => computeEndTime(defaultStart));
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Selected time slots state for multi-slot grid selection
  const [selectedSlotKeys, setSelectedSlotKeys] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalPurpose, setModalPurpose] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState('');

  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (preselectedCabinId) setCabinId(preselectedCabinId);
    if (preselectedDate) setBookingDate(preselectedDate);
    if (preselectedStartHour) {
      setStartTime(preselectedStartHour);
      setEndTime(computeEndTime(preselectedStartHour));
      const key = `${preselectedStartHour}-${computeEndTime(preselectedStartHour)}`;
      setSelectedSlotKeys([key]);
    }
  }, [preselectedCabinId, preselectedStartHour, preselectedDate]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (cabinId && bookingDate) {
      setSelectedSlotKeys([]);
      checkAvailability();
    }
  }, [cabinId, bookingDate, gridStep]);

  const fetchInitialData = async () => {
    try {
      const cabinRes = await apiRequest('/cabins');
      const activeCabins = (cabinRes.cabins || []).filter(c => c.status !== 'INACTIVE');
      setCabins(activeCabins);
      if (activeCabins.length > 0 && !cabinId) {
        setCabinId(activeCabins[0].id);
      }

      const rulesRes = await apiRequest('/rules');
      setRules(rulesRes.rules);
    } catch (err) {
      console.error(err);
    }
  };

  const checkAvailability = async () => {
    if (!cabinId || !bookingDate) return;
    setCheckingAvailability(true);
    try {
      const res = await apiRequest(`/bookings/availability?cabin_id=${cabinId}&date=${bookingDate}&step=${gridStep}`);
      setAvailability(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Toggle selection for available slot cards
  const toggleSlotSelection = (slot) => {
    if (slot.status !== 'AVAILABLE') return;
    const slotKey = `${slot.start_time}-${slot.end_time}`;
    setSelectedSlotKeys(prev => {
      let updated;
      if (prev.includes(slotKey)) {
        updated = prev.filter(k => k !== slotKey);
      } else {
        updated = [...prev, slotKey];
      }

      // Sync start/end times for single-form submission if updated
      if (updated.length > 0) {
        const sortedKeys = [...updated].sort((a, b) => {
          const [aH, aM] = a.split('-')[0].split(':').map(Number);
          const [bH, bM] = b.split('-')[0].split(':').map(Number);
          return (aH * 60 + aM) - (bH * 60 + bM);
        });
        const firstStart = sortedKeys[0].split('-')[0];
        const lastEnd = sortedKeys[sortedKeys.length - 1].split('-')[1];
        setStartTime(firstStart);
        setEndTime(lastEnd);
      }

      return updated;
    });
  };

  // Filter visible slots for today's date
  const getVisibleSlots = () => {
    if (!availability || !availability.slots) return [];
    const todayStr = getLocalTodayStr();
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    return availability.slots.filter((slot) => {
      if (bookingDate !== todayStr) return true;
      const [endH, endM] = slot.end_time.split(':').map(Number);
      const slotEndMin = endH * 60 + endM;
      return slotEndMin > currentMin;
    });
  };

  const visibleSlots = getVisibleSlots();

  // Get selected slot objects in order
  const selectedSlotObjects = visibleSlots.filter(s =>
    selectedSlotKeys.includes(`${s.start_time}-${s.end_time}`)
  ).sort((a, b) => {
    const [aH, aM] = a.start_time.split(':').map(Number);
    const [bH, bM] = b.start_time.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  const overallStart = selectedSlotObjects.length > 0 ? selectedSlotObjects[0].start_time : startTime;
  const overallEnd = selectedSlotObjects.length > 0 ? selectedSlotObjects[selectedSlotObjects.length - 1].end_time : endTime;

  // Calculate duration string
  const calculateDuration = () => {
    if (selectedSlotObjects.length === 0) return { totalMinutes: 0, text: '0 minutes' };
    const [sH, sM] = overallStart.split(':').map(Number);
    const [eH, eM] = overallEnd.split(':').map(Number);
    const totalMin = (eH * 60 + eM) - (sH * 60 + sM);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    let text = '';
    if (hrs > 0) text += `${hrs} hour${hrs > 1 ? 's' : ''}`;
    if (mins > 0) text += `${text ? ' ' : ''}${mins} minute${mins > 1 ? 's' : ''}`;
    return { totalMinutes: totalMin, text: text || '0 minutes' };
  };

  const selectedCabinObj = cabins.find(c => c.id === parseInt(cabinId));

  const handleOpenConfirmModal = () => {
    if (selectedSlotKeys.length === 0) return;
    setModalPurpose(purpose);
    setModalNotes(notes);
    setModalError('');
    setShowConfirmModal(true);
  };

  // Confirm and Submit Booking Request with Double-Booking Pre-Validation
  const handleConfirmModalSubmit = async (e) => {
    if (e) e.preventDefault();
    setModalError('');
    setError('');
    setSuccess(null);
    setSubmitting(true);

    try {
      // 1. Revalidate live availability from backend before confirming
      const latestAvailability = await apiRequest(`/bookings/availability?cabin_id=${cabinId}&date=${bookingDate}`);

      // Verify that all selected slots are still available
      const unavailableSlots = selectedSlotObjects.filter(selSlot => {
        const freshSlot = (latestAvailability.slots || []).find(s => s.start_time === selSlot.start_time && s.end_time === selSlot.end_time);
        return !freshSlot || freshSlot.status !== 'AVAILABLE';
      });

      if (unavailableSlots.length > 0) {
        setModalError(`One or more selected slots (${unavailableSlots.map(s => s.start_time).join(', ')}) was just booked by another user. Please re-select available slots.`);
        checkAvailability(); // Refresh UI grid
        setSubmitting(false);
        return;
      }

      // 2. Submit booking payload
      const finalPurpose = modalPurpose || purpose;
      if (!finalPurpose || !finalPurpose.trim()) {
        setModalError('Please enter a meeting purpose / title.');
        setSubmitting(false);
        return;
      }

      const payload = {
        cabin_id: parseInt(cabinId),
        booking_date: bookingDate,
        start_time: overallStart,
        end_time: overallEnd,
        purpose: finalPurpose.trim(),
        notes: (modalNotes || notes || '').trim()
      };

      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccess(res);
      setShowConfirmModal(false);
      setSelectedSlotKeys([]);
      setPurpose('');
      setNotes('');
      // Refresh live availability so booked slots turn into YOUR BOOKING!
      checkAvailability();
    } catch (err) {
      setModalError(err.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form submission handler from left-side form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedSlotKeys.length > 0) {
      handleOpenConfirmModal();
    } else {
      // If user typed time manually in left form
      const key = `${startTime}-${endTime}`;
      setSelectedSlotKeys([key]);
      setModalPurpose(purpose);
      setModalNotes(notes);
      setShowConfirmModal(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Request a Cabin Booking</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Select available time slots and submit reservation request for Central Admin approval.
        </p>
      </div>

      {success && (
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #166534', background: '#DCFCE7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={24} color="#166534" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>Booking Request Submitted Successfully!</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#166534' }}>
            Reference ID: <strong style={{ color: '#166534', fontSize: '1rem' }}>{success.booking?.booking_code}</strong> for <strong>{success.booking?.cabin_name}</strong> on {success.booking?.booking_date} ({success.booking?.start_time} - {success.booking?.end_time}). Status is <strong>PENDING REVIEW</strong>.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('my_bookings')}>View My Bookings</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSuccess(null)}>Submit Another Request</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="book-cabin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Booking Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.25rem' }}>
            Booking Details
          </h3>

          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Select Shared Cabin</label>
              <select
                className="form-select"
                value={cabinId}
                onChange={(e) => setCabinId(e.target.value)}
                required
              >
                {cabins.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Cap: {c.capacity}) {c.status === 'MAINTENANCE' ? '⚠️ MAINTENANCE' : ''}
                  </option>
                ))}
              </select>
              {selectedCabinObj && (
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Location: {selectedCabinObj.location} • {selectedCabinObj.description}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Booking Date</label>
              <input
                type="date"
                className="form-input"
                value={bookingDate}
                min={getLocalTodayStr()}
                max={getMax7DaysStr()}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', display: 'block' }}>
                📅 Advance booking limit: Max 1 week (7 days) in advance (until {getMax7DaysStr()}).
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <select
                  className="form-select"
                  value={startTime}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartTime(newStart);
                    setEndTime(computeEndTime(newStart));
                  }}
                  required
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <select
                  className="form-select"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                >
                  {timeOptions.filter(opt => opt.value > startTime).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Meeting Purpose / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Client Demo & Sprint Review"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>



            <div className="form-group">
              <label className="form-label">Additional Notes / AV Setup</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Optional notes for facility team (e.g. Whiteboard markers, Zoom setup)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
              disabled={submitting || (selectedCabinObj && selectedCabinObj.status === 'MAINTENANCE')}
            >
              {selectedSlotKeys.length > 0
                ? `Proceed with ${selectedSlotKeys.length} Selected Slot${selectedSlotKeys.length > 1 ? 's' : ''}`
                : 'Submit Booking Request'}
            </button>
          </form>
        </div>

        {/* Real-time Cabin Availability Grid Panel with Slot Selection */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Live Cabin Availability Grid</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Grid Interval Switcher */}
                <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setGridStep(15)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      background: gridStep === 15 ? '#2563EB' : 'transparent',
                      color: gridStep === 15 ? '#FFFFFF' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    15-Min Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStep(30)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      background: gridStep === 30 ? '#2563EB' : 'transparent',
                      color: gridStep === 30 ? '#FFFFFF' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    30-Min Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStep(60)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      background: gridStep === 60 ? '#2563EB' : 'transparent',
                      color: gridStep === 60 ? '#FFFFFF' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    1-Hour Grid
                  </button>
                </div>

                {selectedSlotKeys.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => setSelectedSlotKeys([])}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    Clear ({selectedSlotKeys.length})
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Checking slots for <strong style={{ color: '#0F172A' }}>{selectedCabinObj?.name}</strong> on {bookingDate}
            </p>
          </div>

          {checkingAvailability ? (
            <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Loading live slot data...</p>
          ) : visibleSlots.length === 0 ? (
            <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>
                ⏰ All cabin operating slots for today ({bookingDate}) have finished.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '4px' }}>
                Please select a future date to check cabin availability and submit your request.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {visibleSlots.map((slot, index) => {
                const slotKey = `${slot.start_time}-${slot.end_time}`;
                const isAvailable = slot.status === 'AVAILABLE';
                const isPending = slot.status === 'PENDING_APPROVAL';
                const isOwn = slot.booking?.is_own;
                const isSelected = selectedSlotKeys.includes(slotKey);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isAvailable) toggleSlotSelection(slot);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      background: isSelected
                        ? '#DBEAFE'
                        : isAvailable
                          ? '#EFF6FF'
                          : isPending
                            ? '#FEF2F2'
                            : '#F8FAFC',
                      border: isSelected
                        ? '2px solid #2563EB'
                        : isAvailable
                          ? '1px solid #BFDBFE'
                          : isPending
                            ? '1px solid #FCA5A5'
                            : '1px solid #CBD5E1',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease'
                    }}
                    className={isAvailable ? 'slot-card-hover' : ''}
                    title={
                      isSelected
                        ? `Click to deselect ${slot.start_time} - ${slot.end_time}`
                        : isAvailable
                          ? `Click to select slot ${slot.start_time} - ${slot.end_time}`
                          : isPending
                            ? `First request pending approval: ${slot.booking?.booking_code || 'Pending'}`
                            : `Confirmed booking: ${slot.booking?.booking_code || 'Booked'}`
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>

                    <div>
                      {isAvailable ? (
                        isSelected ? (
                          <div style={{
                            background: '#2563EB',
                            color: '#FFFFFF',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check size={14} /> ✓ SELECTED
                          </div>
                        ) : (
                          <div style={{
                            background: '#EFF6FF',
                            color: '#1E40AF',
                            border: '1px solid #93C5FD',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            + SELECT
                          </div>
                        )
                      ) : isPending ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#DC2626', color: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {isOwn ? `YOUR REQ (${slot.booking?.booking_code})` : '1ST REQUEST (PENDING)'}
                        </span>
                      ) : isOwn ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#0F172A', color: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                          YOUR BOOKING ({slot.booking?.booking_code})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#0F172A', color: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                          BOOKED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prominent BOOK SELECTED SLOTS Button */}
          <div style={{ marginTop: '0.5rem' }}>
            {selectedSlotKeys.length === 0 ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  border: '1px solid #E2E8F0',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                SELECT SLOTS TO BOOK
              </button>
            ) : (
              <button
                onClick={handleOpenConfirmModal}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#2563EB',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <span>BOOK SELECTED SLOTS ({selectedSlotKeys.length})</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        title="Confirm Cabin Booking"
      >
        <form onSubmit={handleConfirmModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {modalError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{modalError}</span>
            </div>
          )}

          {/* Overview Summary Card */}
          <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Cabin:</span>
              <strong style={{ color: '#0F172A', fontSize: '1.05rem', fontWeight: 700 }}>{selectedCabinObj?.name}</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                Cap: {selectedCabinObj?.capacity} • {selectedCabinObj?.location}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Date:</span>
              <strong style={{ color: '#0F172A', fontSize: '1.05rem', fontWeight: 700 }}>
                {new Date(bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                Total: {calculateDuration().text}
              </span>
            </div>
          </div>

          {/* Selected Time Slots List */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>
              Selected Time Slots ({selectedSlotObjects.length}):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
              {selectedSlotObjects.length > 0 ? (
                selectedSlotObjects.map((slot, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#1E40AF' }}>
                    <span>{slot.start_time} - {slot.end_time}</span>
                    <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>30 mins</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#1E40AF' }}>
                  {startTime} - {endTime}
                </div>
              )}
            </div>
          </div>

          {/* Meeting Purpose Field */}
          <div className="form-group">
            <label className="form-label">Meeting Purpose / Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Client Demo & Sprint Review"
              value={modalPurpose}
              onChange={(e) => {
                setModalPurpose(e.target.value);
                setPurpose(e.target.value);
              }}
              required
            />
          </div>



          {/* Notes Field */}
          <div className="form-group">
            <label className="form-label">Additional Notes / AV Setup (Optional)</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Optional notes (e.g. Whiteboard markers, Zoom setup)"
              value={modalNotes}
              onChange={(e) => {
                setModalNotes(e.target.value);
                setNotes(e.target.value);
              }}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Validating & Confirming...' : 'CONFIRM BOOKING'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .slot-card-hover:hover {
          border-color: #2563EB !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
