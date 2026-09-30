import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cabin_booking_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cabin_booking_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check auth session on load
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
          localStorage.setItem('cabin_booking_user', JSON.stringify(res.user));
          fetchNotifications();
        } catch (_err) {
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('cabin_booking_token', res.token);
    localStorage.setItem('cabin_booking_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    fetchNotifications();
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('cabin_booking_token');
    localStorage.removeItem('cabin_booking_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markNotificationRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const setSession = (newToken, newUser) => {
    localStorage.setItem('cabin_booking_token', newToken);
    localStorage.setItem('cabin_booking_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        setSession,
        loading,
        login,
        logout,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
