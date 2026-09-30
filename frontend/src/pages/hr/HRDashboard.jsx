import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Plus,
  ArrowRight,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  History,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const HRDashboard = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/bookings');
      setBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const nextUpcoming = bookings.find(b => b.status === 'CONFIRMED' && b.booking_date >= getLocalTodayStr());
  const pendingRequests = bookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const recentBookings = bookings.slice(0, 5);

  const companyName = user?.company_name || 'your company';
  const userName = user?.name || 'HR Manager';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. HERO SECTION */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)',
          padding: '2.25rem 2.5rem',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Radial Overlay */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Hero Left Content */}
        <div style={{ zIndex: 1, maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#DBEAFE', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            <Sparkles size={13} color="#93C5FD" /> COMPANY HR PORTAL
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Welcome, {userName}!
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#DBEAFE', marginTop: '0.5rem', lineHeight: 1.5, fontWeight: 400 }}>
            Manage meeting cabin reservations for <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>{companyName}</strong>.
          </p>
        </div>

        {/* Hero Right CTA Button & Subtext */}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>
          <button
            onClick={() => setActiveTab('book_cabin')}
            style={{
              background: '#FFFFFF',
              color: '#1E40AF',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem 1.4rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
            className="hero-cta-btn"
          >
            <Plus size={18} strokeWidth={2.5} color="#1E40AF" />
            <span>Request New Cabin Booking</span>
            <ArrowRight size={16} strokeWidth={2.5} color="#1E40AF" />
          </button>
          <span style={{ fontSize: '0.75rem', color: '#BFDBFE', fontWeight: 500, paddingLeft: '4px' }}>
            Book a meeting space for your team
          </span>
        </div>
      </div>

      {/* 2. STAT CARDS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Total Company Requests */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            borderLeft: '4px solid #2563EB',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          className="stat-card-hover"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Total Company Requests
            </span>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#2563EB" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              {loading ? '...' : bookings.length}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.45rem', margin: 0 }}>
              All booking requests from your company
            </p>
          </div>
        </div>

        {/* Card 2: Pending Admin Approvals */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            borderLeft: '4px solid #D97706',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          className="stat-card-hover"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Pending Admin Approvals
            </span>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#D97706" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>
              {loading ? '...' : pendingRequests.length}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#78350F', marginTop: '0.45rem', margin: 0 }}>
              Requests waiting for approval
            </p>
          </div>
        </div>

        {/* Card 3: Confirmed Bookings */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            borderLeft: '4px solid #166534',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          className="stat-card-hover"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Confirmed Bookings
            </span>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#166534" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#166534', lineHeight: 1 }}>
              {loading ? '...' : confirmedBookings.length}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#14532D', marginTop: '0.45rem', margin: 0 }}>
              Your upcoming confirmed bookings
            </p>
          </div>
        </div>

      </div>

      {/* 3. UPCOMING BOOKINGS SECTION / EMPTY STATE */}
      {nextUpcoming ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            borderLeft: '4px solid #166534',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }}></span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Confirmed Meeting
              </span>
            </div>
            <StatusBadge status={nextUpcoming.status} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{nextUpcoming.purpose}</h3>
          <div style={{ display: 'flex', gap: '1.75rem', marginTop: '0.85rem', fontSize: '0.875rem', color: '#475569', flexWrap: 'wrap' }}>
            <div><strong style={{ color: '#0F172A' }}>Cabin:</strong> {nextUpcoming.cabin_name} ({nextUpcoming.cabin_location})</div>
            <div><strong style={{ color: '#0F172A' }}>Date:</strong> {nextUpcoming.booking_date}</div>
            <div><strong style={{ color: '#0F172A' }}>Time:</strong> {nextUpcoming.start_time} - {nextUpcoming.end_time}</div>
            <div><strong style={{ color: '#0F172A' }}>Attendees:</strong> {nextUpcoming.people_count} People</div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={28} color="#2563EB" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              No upcoming confirmed bookings scheduled.
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem', margin: 0 }}>
              Click the button above to submit a new request.
            </p>
          </div>
        </div>
      )}

      {/* 4. RECENT BOOKING REQUESTS CARD */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Recent Booking Requests
              </h3>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('my_bookings')}
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '0.5rem 0.9rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="view-all-btn-hover"
          >
            <span>View All My Bookings</span>
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>No recent bookings found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Code</th>
                  <th>Cabin</th>
                  <th>Date & Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{b.booking_code}</td>
                    <td>{b.cabin_name}</td>
                    <td>{b.booking_date} ({b.start_time} - {b.end_time})</td>
                    <td>{b.purpose}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .hero-cta-btn:hover {
          background: #F8FAFC !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.18) !important;
        }
        .stat-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06) !important;
        }
        .view-all-btn-hover:hover {
          background: #DBEAFE !important;
          border-color: #93C5FD !important;
        }
      `}</style>
    </div>
  );
};
