import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ListOrdered,
  Building2,
  Users,
  DoorClosed,
  BarChart3,
  FileText,
  Sliders,
  PlusCircle
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, userRole, mobileMenuOpen, setMobileMenuOpen }) => {
  const hrNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'book_cabin', label: 'Book Cabin', icon: PlusCircle },
    { id: 'my_bookings', label: 'My Bookings', icon: ListOrdered },
    { id: 'calendar', label: 'Availability Calendar', icon: CalendarDays }
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Booking Requests Queue', icon: CalendarCheck, badge: 'NEW' },
    { id: 'calendar', label: '5-Cabin Timeline Calendar', icon: CalendarDays },
    { id: 'all_bookings', label: 'All Bookings Database', icon: ListOrdered },
    { id: 'companies', label: 'Companies Directory', icon: Building2 },
    { id: 'cabins', label: 'Cabins Management', icon: DoorClosed }
  ];

  const superAdminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Booking Approvals', icon: CalendarCheck },
    { id: 'calendar', label: 'Cabin Calendar', icon: CalendarDays },
    { id: 'companies', label: 'Companies Directory', icon: Building2 },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'cabins', label: 'Cabins Config', icon: DoorClosed },
    { id: 'rules', label: 'Booking Rules & Hours', icon: Sliders },
    { id: 'reports', label: 'Analytics Reports', icon: BarChart3 },
    { id: 'audit_logs', label: 'Audit Logs', icon: FileText }
  ];

  const navItems =
    userRole === 'SUPER_ADMIN'
      ? superAdminNav
      : userRole === 'CENTRAL_ADMIN'
        ? adminNav
        : hrNav;

  const activeIndex = Math.max(0, navItems.findIndex(item => item.id === activeTab));

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <aside
      className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}
      style={{
        width: '260px',
        background: '#0F172A',
        borderRight: '1px solid #1E293B',
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexShrink: 0
      }}
    >
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em', padding: '0 0.75rem 0.5rem' }}>
        Main Navigation
      </div>

      <nav style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Lottie-style Spring Animated Active Pill Indicator */}
        <div
          className="lottie-active-pill"
          style={{
            position: 'absolute',
            top: `${activeIndex * 46}px`,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.2)',
            transition: 'top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          {/* Glowing accent border bar */}
          <div style={{
            position: 'absolute',
            left: '4px',
            top: '20%',
            bottom: '20%',
            width: '4px',
            background: '#60A5FA',
            borderRadius: '4px',
            boxShadow: '0 0 8px #60A5FA'
          }} />
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`lottie-nav-btn ${isActive ? 'is-active' : ''}`}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                height: '40px',
                marginBottom: '6px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : '#94A3B8'}
                  className="lottie-nav-icon"
                  style={{
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease',
                    transform: isActive ? 'scale(1.18) rotate(-3deg)' : 'scale(1)'
                  }}
                />
                <span style={{ transition: 'all 0.2s ease' }}>{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#93C5FD',
                  boxShadow: '0 0 8px #93C5FD',
                  display: 'inline-block'
                }} />
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
