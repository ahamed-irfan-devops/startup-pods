export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch wrapper handling auth headers and API errors
 * Supports both signatures:
 *   1) apiRequest('/endpoint', { method: 'POST', body: JSON.stringify(...) })
 *   2) apiRequest('/endpoint', 'POST', { key: 'value' })
 */
export async function apiRequest(endpoint, options = {}, bodyData = null) {
  const token = localStorage.getItem('cabin_booking_token');

  let config = {};

  if (typeof options === 'string') {
    config = {
      method: options,
      body: bodyData ? (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)) : undefined
    };
  } else {
    config = { ...options };
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(config.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...config,
    headers
  });

  // If unauthorized token, trigger logout
  if (response.status === 401) {
    localStorage.removeItem('cabin_booking_token');
    localStorage.removeItem('cabin_booking_user');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred while processing your request.');
  }

  return data;
}
