/**
 * Centralized API Configuration for Hotel Rama Inn
 * Directs all frontend communication to the Next.js backend.
 */

// In development, the Vite dev server proxies /api requests to http://127.0.0.1:3000.
// In production on Hostinger, set VITE_API_BASE_URL if the backend is hosted on a separate URL or subdomain.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  ROOMS: `${API_BASE_URL}/api/v1/rooms`,
  ROOM_DETAIL: (slug) => `${API_BASE_URL}/api/v1/rooms/${slug}`,
  ROOM_CALENDAR: (idOrSlug, year, month) =>
    `${API_BASE_URL}/api/v1/rooms/${idOrSlug}/calendar?year=${year}&month=${month}`,
  AVAILABILITY: `${API_BASE_URL}/api/v1/availability`,
  BOOKINGS_INITIATE: `${API_BASE_URL}/api/v1/bookings/initiate`,
  BOOKINGS_LOOKUP: (ref) => `${API_BASE_URL}/api/v1/bookings/lookup/${ref}`,
  BOOKING_DETAIL: (id) => `${API_BASE_URL}/api/v1/bookings/${id}`,
  PAYMENTS_VERIFY: `${API_BASE_URL}/api/v1/payments/verify`,

  // Admin Endpoints
  ADMIN_METRICS: `${API_BASE_URL}/api/v1/admin/metrics`,
  ADMIN_ROOMS: `${API_BASE_URL}/api/v1/admin/rooms`,
  ADMIN_ROOM: (id) => `${API_BASE_URL}/api/v1/admin/rooms/${id}`,
  ADMIN_ROOM_CALENDAR: (id, year, month) =>
    `${API_BASE_URL}/api/v1/admin/rooms/${id}/calendar?year=${year}&month=${month}`,
  ADMIN_ROOM_OVERRIDE: (id) => `${API_BASE_URL}/api/v1/admin/rooms/${id}/calendar/override`,
  ADMIN_BOOKINGS: `${API_BASE_URL}/api/v1/admin/bookings`,
  ADMIN_BOOKING_STATUS: (id) => `${API_BASE_URL}/api/v1/admin/bookings/${id}/status`,
  ADMIN_PAYMENTS: `${API_BASE_URL}/api/v1/admin/payments`,
  ADMIN_PAYMENTS_RECONCILE: `${API_BASE_URL}/api/v1/admin/payments/reconcile`,
  ADMIN_AUTH_LOGIN: `${API_BASE_URL}/api/v1/admin/auth/login`,
  ADMIN_USERS: `${API_BASE_URL}/api/v1/admin/users`,
  ADMIN_USER_STATUS: (id) => `${API_BASE_URL}/api/v1/admin/users/${id}/status`,
  ADMIN_AUDIT_LOGS: `${API_BASE_URL}/api/v1/admin/audit-logs`,
  ADMIN_AUDIT_LOGS_RECORD: `${API_BASE_URL}/api/v1/admin/audit-logs/record`,
};

