import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Modal } from './Modal';

export const Navbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span style={{ background: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>SUPER ADMIN</span>;
      case 'CENTRAL_ADMIN':
        return <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>CENTRAL ADMIN</span>;
      case 'COMPANY_HR':
        return <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>COMPANY HR</span>;
      default:
        return null;
    }
  };

  return (
    <header className="app-header">
      <div className="navbar-container">
        {/* Brand & Mobile Menu Button */}
        <div className="navbar-brand-wrapper">
          {user && (
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="navbar-logo-badge">
            <img
              src="/startup-pods-logo.png"
              alt="iQue Startup Pods Logo"
              className="navbar-logo-img"
            />
          </div>
          <div className="navbar-brand-text">
            <h1 className="navbar-title">
              iQue Startup Pods
            </h1>
            <p className="navbar-subtitle">
              Bengaluru Facility • Shared Office Pods Management
            </p>
          </div>
        </div>

        {/* User Actions */}
        {user && (
          <div className="navbar-user-actions">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="navbar-icon-btn"
                title="Notifications"
              >
                <Bell size={18} className="bell-icon" />
                {unreadCount > 0 && (
                  <span className="navbar-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div
                  className="notifications-dropdown"
                  style={{
                    position: 'absolute',
                    top: '45px',
                    right: 0,
                    width: '300px',
                    maxWidth: '90vw',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '1rem',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    zIndex: 200
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', padding: '1rem', margin: 0 }}>No notifications yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          style={{
                            background: n.is_read ? '#F8FAFC' : '#EFF6FF',
                            borderLeft: `3px solid ${n.type === 'APPROVED' ? '#166534' : n.type === 'REJECTED' ? '#991B1B' : '#2563EB'}`,
                            padding: '0.625rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                            <span>{n.title}</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', margin: 0 }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="navbar-profile-wrapper">
              <div className="navbar-user-text">
                <div className="navbar-user-name">
                  {user.name}
                </div>
                <div className="navbar-user-role">
                  {getRoleBadge(user.role)}
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="navbar-icon-btn"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Log Out"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: '#FEE2E2', padding: '0.65rem', borderRadius: '50%', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Are you sure you want to log out?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} /> Confirm Log Out
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};

