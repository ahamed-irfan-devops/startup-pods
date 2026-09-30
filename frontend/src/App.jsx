import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';

// HR Pages
import { HRDashboard } from './pages/hr/HRDashboard';
import { BookCabin } from './pages/hr/BookCabin';
import { MyBookings } from './pages/hr/MyBookings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BookingRequests } from './pages/admin/BookingRequests';
import { AllBookings } from './pages/admin/AllBookings';
import { ReportsPage } from './pages/admin/ReportsPage';
import { InteractiveCalendar } from './components/InteractiveCalendar';

// Super Admin Pages
import { CompaniesPage } from './pages/superadmin/CompaniesPage';
import { UsersPage } from './pages/superadmin/UsersPage';
import { CabinsPage } from './pages/superadmin/CabinsPage';
import { RulesConfigPage } from './pages/superadmin/RulesConfigPage';
import { AuditLogsPage } from './pages/superadmin/AuditLogsPage';

// Account Activation Page
import { ActivateAccount } from './pages/ActivateAccount';
import { NotFound } from './pages/NotFound';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingParams, setBookingParams] = useState(null);

  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSelectSlotToBook = (cabinId = '', startTime = '', date = '') => {
    setBookingParams({
      cabinId,
      startTime,
      date: date || getLocalTodayStr()
    });
    setActiveTab('book_cabin');
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          gap: '1.25rem'
        }}
      >
        <div
          className="spin-ring-loader"
          style={{
            width: '40px',
            height: '40px',
            border: '2.5px solid #F1F5F9',
            borderTopColor: '#0F172A',
            borderRadius: '50%',
            animation: 'spinRing 0.8s linear infinite, ringAppear 0.4s ease-out forwards'
          }}
        />
        <h1
          className="text-fade-up"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '1.35rem',
            fontWeight: 600,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0,
            padding: 0,
            opacity: 0,
            animation: 'textFadeUp 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            userSelect: 'none'
          }}
        >
          Startup Pods
        </h1>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'COMPANY_HR' ? (
          <HRDashboard setActiveTab={setActiveTab} onSelectSlotToBook={handleSelectSlotToBook} />
        ) : (
          <AdminDashboard setActiveTab={setActiveTab} />
        );

      case 'book_cabin':
        return (
          <BookCabin
            setActiveTab={setActiveTab}
            preselectedCabinId={bookingParams?.cabinId}
            preselectedStartHour={bookingParams?.startTime}
            preselectedDate={bookingParams?.date}
          />
        );

      case 'my_bookings':
        return <MyBookings />;

      case 'calendar':
        return (
          <InteractiveCalendar
            userRole={user.role}
            onSelectSlotToBook={handleSelectSlotToBook}
          />
        );


      case 'requests':
        return <BookingRequests />;

      case 'all_bookings':
        return <AllBookings />;

      case 'companies':
        return <CompaniesPage />;

      case 'users':
        return user.role === 'SUPER_ADMIN' ? <UsersPage /> : <AdminDashboard setActiveTab={setActiveTab} />;

      case 'cabins':
        return <CabinsPage />;

      case 'rules':
        return user.role === 'SUPER_ADMIN' ? <RulesConfigPage /> : <AdminDashboard setActiveTab={setActiveTab} />;

      case 'reports':
        return user.role === 'SUPER_ADMIN' ? <ReportsPage /> : <AdminDashboard setActiveTab={setActiveTab} />;

      case 'audit_logs':
        return user.role === 'SUPER_ADMIN' ? <AuditLogsPage /> : <AdminDashboard setActiveTab={setActiveTab} />;

      case '404':
        return <NotFound onGoHome={() => setActiveTab('dashboard')} />;

      default:
        return user.role === 'COMPANY_HR' ? (
          <HRDashboard setActiveTab={setActiveTab} />
        ) : (
          <AdminDashboard setActiveTab={setActiveTab} />
        );
    }
  };

  return (
    <div className="app-layout">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="app-body" style={{ position: 'relative' }}>
        {mobileMenuOpen && (
          <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={user.role}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const isActivateRoute = window.location.pathname.includes('/activate-account') || window.location.search.includes('token=');
  const is404Route = window.location.pathname !== '/' && !isActivateRoute;

  if (isActivateRoute) {
    return <ActivateAccount onGoToLogin={() => window.location.href = '/'} />;
  }

  if (is404Route) {
    return <NotFound onGoHome={() => window.location.href = '/'} />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
