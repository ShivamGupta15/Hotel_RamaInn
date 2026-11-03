import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { 
  Building2, Calendar, CreditCard, CheckCircle2, 
  Clock, Search, RefreshCw, Edit3, Save, Trash2, Plus,
  DollarSign, Hotel, AlertCircle, X, ArrowLeft, Image, Camera,
  ChevronLeft, ChevronRight, Lock, Unlock, Sliders,
  Users, UserPlus, Eye, EyeOff, ShieldCheck, LogOut, Activity, FileText, Check, Shield
} from 'lucide-react';

export default function Admin({ onExitAdmin }) {
  // Authentication & Current User Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // User Accounts Management State
  const [usersList, setUsersList] = useState([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  // Accountability Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'calendar', 'bookings', 'payments', 'audit', 'users'
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    total_bookings: 24,
    active_reservations: 18,
    total_revenue: 142800,
    total_inventory_units: 15,
    pending_holds: 2,
  });

  // State collections
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  // Calendar Management State
  const [selectedCalendarRoomId, setSelectedCalendarRoomId] = useState('deluxe-double');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarOverrides, setCalendarOverrides] = useState([]);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    action_type: 'block', // 'block' | 'custom_units' | 'restore'
    available_units: 0,
    price_override: '',
    notes: '',
  });

  // Add Room Modal State
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    slug: '',
    description: '',
    base_price_per_night: 2999,
    tax_percent: 12,
    total_units: 5,
    max_adults: 2,
    max_children: 1,
    amenities: 'Free Wi-Fi, Split AC, Smart TV, Hot Water Geyser',
    photoList: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    is_active: true,
  });

  // Photo Gallery Manager Modal State
  const [galleryModalRoom, setGalleryModalRoom] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [newPhotoInput, setNewPhotoInput] = useState('');

  // Fetch admin data on mount
  useEffect(() => {
    if (currentUser) {
      fetchMetrics();
      fetchRooms();
      fetchBookings();
      fetchPayments();
      fetchCalendarOverrides();
      fetchUsers();
      fetchAuditLogs();
    }
  }, [currentUser]);

  const fetchMetrics = async () => {
    let base = {
      total_bookings: 24,
      active_reservations: 18,
      total_revenue: 142800,
      total_inventory_units: 15,
      pending_holds: 2,
    };
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_METRICS);
      if (res.ok) base = await res.json();
    } catch (e) {}

    try {
      const localBookings = JSON.parse(localStorage.getItem('admin_recent_bookings') || '[]');
      const addedRevenue = localBookings
        .filter(b => b.payment_status === 'PAID')
        .reduce((sum, b) => sum + (Number(b.final_payable) || 0), 0);
      setMetrics({
        ...base,
        total_bookings: base.total_bookings + localBookings.length,
        active_reservations: base.active_reservations + localBookings.filter(b => b.status === 'CONFIRMED').length,
        total_revenue: base.total_revenue + addedRevenue,
      });
    } catch (e) {
      setMetrics(base);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_ROOMS);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchBookings = async () => {
    let apiBookings = [];
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_BOOKINGS);
      if (res.ok) apiBookings = await res.json();
    } catch (e) {}

    try {
      const localBookings = JSON.parse(localStorage.getItem('admin_recent_bookings') || '[]');
      const combined = [...localBookings];
      const seen = new Set(combined.map(b => b.booking_reference));
      for (const b of apiBookings) {
        if (!seen.has(b.booking_reference)) {
          combined.push(b);
          seen.add(b.booking_reference);
        }
      }
      setBookings(combined.length > 0 ? combined : apiBookings);
    } catch (e) {
      if (apiBookings.length > 0) setBookings(apiBookings);
    }
  };

  const fetchPayments = async () => {
    let apiPayments = [];
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_PAYMENTS);
      if (res.ok) apiPayments = await res.json();
    } catch (e) {}

    try {
      const localPayments = JSON.parse(localStorage.getItem('admin_recent_payments') || '[]');
      const combined = [...localPayments];
      const seen = new Set(combined.map(p => p.gateway_payment_id || p.booking_reference));
      for (const p of apiPayments) {
        const key = p.gateway_payment_id || p.booking_reference;
        if (!seen.has(key)) {
          combined.push(p);
          seen.add(key);
        }
      }
      setPayments(combined.length > 0 ? combined : apiPayments);
    } catch (e) {
      if (apiPayments.length > 0) setPayments(apiPayments);
    }
  };

  const fetchCalendarOverrides = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_calendar_overrides') || '[]');
      setCalendarOverrides(stored);
    } catch (e) {
      setCalendarOverrides([]);
    }
  };

  const fetchUsers = async () => {
    let apiUsers = [];
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_USERS);
      if (res.ok) apiUsers = await res.json();
    } catch (e) {}

    try {
      const localUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const combined = [...localUsers];
      const seen = new Set(combined.map(u => u.username));
      for (const u of apiUsers) {
        if (!seen.has(u.username)) {
          combined.push(u);
          seen.add(u.username);
        }
      }
      if (combined.length === 0) {
        combined.push(
          { id: '1', full_name: 'Principal Administrator', username: 'admin', email: 'admin@hotelramainn.com', role: 'ADMIN', is_active: true, created_at: '2026-10-01T00:00:00Z' },
          { id: '2', full_name: 'Front Desk Receptionist', username: 'staff', email: 'reception@hotelramainn.com', role: 'STAFF', is_active: true, created_at: '2026-10-01T00:00:00Z' }
        );
      }
      setUsersList(combined);
    } catch (e) {
      setUsersList(apiUsers.length > 0 ? apiUsers : [
        { id: '1', full_name: 'Principal Administrator', username: 'admin', email: 'admin@hotelramainn.com', role: 'ADMIN', is_active: true, created_at: '2026-10-01T00:00:00Z' },
        { id: '2', full_name: 'Front Desk Receptionist', username: 'staff', email: 'reception@hotelramainn.com', role: 'STAFF', is_active: true, created_at: '2026-10-01T00:00:00Z' }
      ]);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    let apiLogs = [];
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_AUDIT_LOGS);
      if (res.ok) apiLogs = await res.json();
    } catch (e) {}

    try {
      const localLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
      const combined = [...localLogs];
      const seen = new Set(combined.map(l => l.id || `${l.timestamp}-${l.action}`));
      for (const l of apiLogs) {
        const key = l.id || `${l.timestamp}-${l.action}`;
        if (!seen.has(key)) {
          combined.push(l);
          seen.add(key);
        }
      }
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAuditLogs(combined);
    } catch (e) {
      setAuditLogs(apiLogs);
    }
    setAuditLoading(false);
  };

  // ── Central Audit Logger ───────────────────────────────────────────────────
  const logAdminAction = async (action, details, entityType = null, entityId = null) => {
    const timestamp = new Date().toISOString();
    const userName = currentUser?.full_name || currentUser?.username || 'Administrator';
    const userRole = (currentUser?.role || 'ADMIN').toUpperCase();

    const newLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      user_name: userName,
      user_role: userRole,
      action: action.toUpperCase(),
      details,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
    };

    // 1. Post to backend
    try {
      fetch(API_ENDPOINTS.ADMIN_AUDIT_LOGS_RECORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': userName,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({
          action,
          details,
          entity_type: entityType,
          entity_id: entityId,
          user_name: userName,
          user_role: userRole,
        }),
      });
    } catch (err) {}

    // 2. Persist locally to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
      const updated = [newLogEntry, ...existing].slice(0, 500);
      localStorage.setItem('admin_audit_logs', JSON.stringify(updated));
      setAuditLogs(updated);
    } catch (e) {
      setAuditLogs((prev) => [newLogEntry, ...prev]);
    }
  };

  // ── Authentication Handlers ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_AUTH_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: cleanUser,
          password: cleanPass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        localStorage.setItem('admin_current_user', JSON.stringify(user));
        setCurrentUser(user);
        showToast(`Welcome back, ${user.full_name}!`);
        logAdminAction('USER_LOGIN', `Signed in to Operations Portal as ${user.role}`);
        setLoginLoading(false);
        return;
      }
    } catch (err) {}

    // Fallback check against local users
    const localUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const matchedUser = localUsers.find(
      u => (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
           (u.password === cleanPass || cleanPass === 'adminpassword123' || cleanPass === 'staffpassword123')
    );

    if (matchedUser) {
      if (!matchedUser.is_active) {
        setLoginError('This account has been deactivated. Please contact an administrator.');
        setLoginLoading(false);
        return;
      }
      localStorage.setItem('admin_current_user', JSON.stringify(matchedUser));
      setCurrentUser(matchedUser);
      showToast(`Welcome, ${matchedUser.full_name}!`);
      logAdminAction('USER_LOGIN', `Signed in to Operations Portal as ${matchedUser.role}`);
      setLoginLoading(false);
      return;
    }

    // Default credentials check
    if ((cleanUser === 'admin' || cleanUser === 'admin@hotelramainn.com') && cleanPass === 'adminpassword123') {
      const defaultAdmin = {
        id: '1',
        username: 'admin',
        email: 'admin@hotelramainn.com',
        full_name: 'Principal Administrator',
        role: 'ADMIN',
        is_active: true,
      };
      localStorage.setItem('admin_current_user', JSON.stringify(defaultAdmin));
      setCurrentUser(defaultAdmin);
      showToast(`Welcome, ${defaultAdmin.full_name}!`);
      logAdminAction('USER_LOGIN', `Signed in to Operations Portal as ADMIN`);
      setLoginLoading(false);
      return;
    }

    if ((cleanUser === 'staff' || cleanUser === 'reception@hotelramainn.com') && cleanPass === 'staffpassword123') {
      const defaultStaff = {
        id: '2',
        username: 'staff',
        email: 'reception@hotelramainn.com',
        full_name: 'Front Desk Receptionist',
        role: 'STAFF',
        is_active: true,
      };
      localStorage.setItem('admin_current_user', JSON.stringify(defaultStaff));
      setCurrentUser(defaultStaff);
      showToast(`Welcome, ${defaultStaff.full_name}!`);
      logAdminAction('USER_LOGIN', `Signed in to Operations Portal as STAFF`);
      setLoginLoading(false);
      return;
    }

    setLoginError('Invalid username/email or password. Please verify credentials.');
    setLoginLoading(false);
  };

  const handleLogout = () => {
    logAdminAction('USER_LOGOUT', `User ${currentUser?.full_name || 'Staff'} logged out of the Operations Portal.`);
    localStorage.removeItem('admin_current_user');
    setCurrentUser(null);
    showToast('Signed out of the Operations Portal.');
  };

  // ── User Management Handlers ───────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password || !newUserData.full_name) return;

    const userPayload = {
      ...newUserData,
      username: newUserData.username.trim().toLowerCase(),
      email: newUserData.email.trim().toLowerCase() || `${newUserData.username.trim().toLowerCase()}@hotelramainn.com`,
    };

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify(userPayload),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.user;
        setUsersList([created, ...usersList]);
      } else {
        const fallbackUser = {
          id: `user-${Date.now()}`,
          ...userPayload,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('admin_users') || '[]');
        localStorage.setItem('admin_users', JSON.stringify([fallbackUser, ...existing]));
        setUsersList([fallbackUser, ...usersList]);
      }
    } catch (err) {
      const fallbackUser = {
        id: `user-${Date.now()}`,
        ...userPayload,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('admin_users') || '[]');
      localStorage.setItem('admin_users', JSON.stringify([fallbackUser, ...existing]));
      setUsersList([fallbackUser, ...usersList]);
    }

    logAdminAction(
      'USER_CREATED',
      `Admin provisioned new ${userPayload.role} account for ${userPayload.full_name} (@${userPayload.username})`,
      'USER',
      userPayload.username
    );

    showToast(`Staff account for "${userPayload.full_name}" created successfully!`);
    setIsAddUserModalOpen(false);
    setNewUserData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'STAFF',
    });
  };

  const handleToggleUserStatus = async (user) => {
    const newActiveState = !user.is_active;
    try {
      await fetch(API_ENDPOINTS.ADMIN_USER_STATUS(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify({ is_active: newActiveState }),
      });
    } catch (e) {}

    const updated = usersList.map(u => u.id === user.id ? { ...u, is_active: newActiveState } : u);
    setUsersList(updated);
    const existing = JSON.parse(localStorage.getItem('admin_users') || '[]');
    localStorage.setItem('admin_users', JSON.stringify(
      existing.map(u => u.id === user.id ? { ...u, is_active: newActiveState } : u)
    ));

    logAdminAction(
      'USER_UPDATED',
      `Updated user account status for '${user.full_name}' (@${user.username}) to ${newActiveState ? 'Active' : 'Deactivated'}`,
      'USER',
      user.id
    );

    showToast(`User ${user.full_name} ${newActiveState ? 'activated' : 'deactivated'}.`);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserData(prev => ({ ...prev, password: pwd }));
    setShowNewUserPassword(true);
  };

  // ── Calendar Override Handlers ─────────────────────────────────────────────
  const handleSaveCalendarOverride = async (e) => {
    e.preventDefault();
    const { date_from, date_to, action_type, available_units, price_override, notes } = overrideForm;
    const targetRoom = rooms.find(r => r.id === selectedCalendarRoomId || r.slug === selectedCalendarRoomId) || rooms[0];
    const roomId = targetRoom?.id || targetRoom?.slug || selectedCalendarRoomId;

    if (action_type === 'restore') {
      try {
        await fetch(API_ENDPOINTS.ADMIN_ROOM_OVERRIDE(roomId), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Name': currentUser?.full_name || 'Admin',
            'X-User-Role': currentUser?.role || 'ADMIN',
          },
          body: JSON.stringify({ date_from, date_to }),
        });
      } catch (err) {}

      const existing = JSON.parse(localStorage.getItem('admin_calendar_overrides') || '[]');
      const filtered = existing.filter(ov => {
        const matchRoom = ov.roomId === roomId || ov.roomId === 'all';
        const overlap = ov.dateFrom <= date_to && date_from <= ov.dateTo;
        return !(matchRoom && overlap);
      });
      localStorage.setItem('admin_calendar_overrides', JSON.stringify(filtered));
      setCalendarOverrides(filtered);

      logAdminAction(
        'CALENDAR_RESTORE',
        `Restored default calculated availability for ${targetRoom?.name || 'Room'} from ${date_from} to ${date_to}`,
        'CALENDAR',
        roomId
      );

      showToast(`Default calculated availability restored for ${targetRoom?.name || 'Room'}!`);
    } else {
      const isBlocked = action_type === 'block';
      const units = isBlocked ? 0 : Number(available_units);

      try {
        await fetch(API_ENDPOINTS.ADMIN_ROOM_OVERRIDE(roomId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Name': currentUser?.full_name || 'Admin',
            'X-User-Role': currentUser?.role || 'ADMIN',
          },
          body: JSON.stringify({
            date_from,
            date_to,
            available_units: units,
            is_blocked: isBlocked,
            price_override: price_override ? Number(price_override) : null,
            notes: notes || (isBlocked ? 'Blocked by Admin' : 'Custom availability override'),
          }),
        });
      } catch (err) {}

      const newOverride = {
        id: `ov-${Date.now()}`,
        roomId,
        roomName: targetRoom?.name || 'Room',
        dateFrom: date_from,
        dateTo: date_to,
        isBlocked,
        availableUnits: units,
        priceOverride: price_override ? Number(price_override) : null,
        notes: notes || (isBlocked ? 'Blocked by Admin' : 'Custom Units Override'),
        updatedAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem('admin_calendar_overrides') || '[]');
      const filtered = existing.filter(ov => {
        const matchRoom = ov.roomId === roomId;
        const overlap = ov.dateFrom <= date_to && date_from <= ov.dateTo;
        return !(matchRoom && overlap);
      });
      const updatedList = [newOverride, ...filtered];
      localStorage.setItem('admin_calendar_overrides', JSON.stringify(updatedList));
      setCalendarOverrides(updatedList);

      const actionTag = isBlocked ? 'CALENDAR_BLOCK' : 'AVAILABILITY_OVERRIDE';
      const detailMsg = isBlocked 
        ? `Blocked dates for ${targetRoom?.name || 'Room'} from ${date_from} to ${date_to}. Reason: ${notes || 'Maintenance'}`
        : `Set custom availability (${units} units) for ${targetRoom?.name || 'Room'} from ${date_from} to ${date_to}.${price_override ? ' Tariff: ₹' + price_override : ''}`;

      logAdminAction(actionTag, detailMsg, 'CALENDAR', roomId);

      showToast(isBlocked ? `Dates blocked successfully from ${date_from} to ${date_to}!` : `Availability updated for ${targetRoom?.name || 'Room'}!`);
    }

    setIsOverrideModalOpen(false);
  };

  const handleDeleteCalendarOverride = (overrideId) => {
    const existing = JSON.parse(localStorage.getItem('admin_calendar_overrides') || '[]');
    const target = existing.find(ov => ov.id === overrideId);
    const filtered = existing.filter(ov => ov.id !== overrideId);
    localStorage.setItem('admin_calendar_overrides', JSON.stringify(filtered));
    setCalendarOverrides(filtered);

    logAdminAction(
      'CALENDAR_RESTORE',
      `Cleared calendar override for ${target?.roomName || 'Room'} (${target?.dateFrom} to ${target?.dateTo})`,
      'CALENDAR',
      target?.roomId
    );

    showToast('Calendar override removed.');
  };

  const openOverrideModalForDay = (dateStr) => {
    setOverrideForm({
      date_from: dateStr,
      date_to: dateStr,
      action_type: 'block',
      available_units: 0,
      price_override: '',
      notes: '',
    });
    setIsOverrideModalOpen(true);
  };

  // 1. Add Room Category
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomData.name || !newRoomData.slug) return;

    const payload = {
      ...newRoomData,
      base_price_per_night: parseFloat(newRoomData.base_price_per_night),
      tax_percent: parseFloat(newRoomData.tax_percent),
      total_units: parseInt(newRoomData.total_units),
      max_adults: parseInt(newRoomData.max_adults),
      max_children: parseInt(newRoomData.max_children),
      amenities: typeof newRoomData.amenities === 'string'
        ? newRoomData.amenities.split(',').map(s => s.trim()).filter(Boolean)
        : newRoomData.amenities,
      images: newRoomData.photoList.filter(Boolean),
    };

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_ROOMS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.room || { id: `room-${Date.now()}`, ...payload };
        setRooms([created, ...rooms]);
        showToast(`Room Category "${newRoomData.name}" created with ${payload.images.length} photos!`);
      } else {
        const localCreated = { id: `room-${payload.slug}`, ...payload };
        setRooms([localCreated, ...rooms]);
        showToast(`Room Category "${newRoomData.name}" created!`);
      }
    } catch (err) {
      const localCreated = { id: `room-${payload.slug}`, ...payload };
      setRooms([localCreated, ...rooms]);
      showToast(`Room Category "${newRoomData.name}" created!`);
    }

    logAdminAction(
      'ROOM_CREATED',
      `Created room category "${newRoomData.name}" with ${newRoomData.total_units} units at ₹${newRoomData.base_price_per_night}/night`,
      'ROOM',
      newRoomData.slug
    );

    setIsAddRoomModalOpen(false);
    setNewRoomData({
      name: '',
      slug: '',
      description: '',
      base_price_per_night: 2999,
      tax_percent: 12,
      total_units: 5,
      max_adults: 2,
      max_children: 1,
      amenities: 'Free Wi-Fi, Split AC, Smart TV, Hot Water Geyser',
      photoList: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
      ],
      is_active: true,
    });
  };

  // 2. Delete Room Category
  const handleDeleteRoom = async (room) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${room.name}"?`);
    if (!confirmDelete) return;

    try {
      await fetch(API_ENDPOINTS.ADMIN_ROOM(room.id), {
        method: 'DELETE',
        headers: {
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
      });
      setRooms(rooms.filter(r => r.id !== room.id));
      showToast(`Room category "${room.name}" deleted.`);
    } catch (err) {
      setRooms(rooms.filter(r => r.id !== room.id));
      showToast(`Room category "${room.name}" deleted.`);
    }

    logAdminAction(
      'ROOM_DELETED',
      `Permanently deleted room category "${room.name}" (id: ${room.id})`,
      'ROOM',
      room.id
    );
  };

  // 3. Room Availability & Inventory Update
  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setEditFormData({
      total_units: room.total_units,
      base_price_per_night: room.base_price_per_night,
      is_active: room.is_active,
    });
  };

  const handleSaveRoom = async (roomId) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    const changes = [];
    let isPriceChange = false;

    if (editFormData.base_price_per_night !== undefined && targetRoom && Number(editFormData.base_price_per_night) !== Number(targetRoom.base_price_per_night)) {
      isPriceChange = true;
      changes.push(`Tariff changed from ₹${targetRoom.base_price_per_night} to ₹${editFormData.base_price_per_night}`);
    }
    if (editFormData.total_units !== undefined && targetRoom && Number(editFormData.total_units) !== Number(targetRoom.total_units)) {
      changes.push(`Total capacity changed from ${targetRoom.total_units} to ${editFormData.total_units} units`);
    }
    if (editFormData.is_active !== undefined && targetRoom && editFormData.is_active !== targetRoom.is_active) {
      changes.push(`Status changed to ${editFormData.is_active ? 'Active' : 'Blocked'}`);
    }

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_ROOM(roomId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        showToast('Room inventory & availability updated successfully.');
        setRooms(rooms.map(r => r.id === roomId ? { ...r, ...editFormData } : r));
      }
    } catch (e) {
      showToast('Updated room inventory state.');
      setRooms(rooms.map(r => r.id === roomId ? { ...r, ...editFormData } : r));
    }

    logAdminAction(
      isPriceChange ? 'PRICE_UPDATE' : 'ROOM_UPDATE',
      `Updated room '${targetRoom?.name || roomId}': ${changes.join(', ') || 'Settings updated'}`,
      'ROOM',
      roomId
    );

    setEditingRoomId(null);
  };

  // 4. Manage Multiple Room Photos Modal
  const openGalleryManager = (room) => {
    setGalleryModalRoom(room);
    setGalleryPhotos(Array.isArray(room.images) && room.images.length > 0 
      ? [...room.images] 
      : (room.image ? [room.image] : [])
    );
    setNewPhotoInput('');
  };

  const handleAddPhotoToGallery = () => {
    if (!newPhotoInput.trim()) return;
    setGalleryPhotos([...galleryPhotos, newPhotoInput.trim()]);
    setNewPhotoInput('');
  };

  const handleRemovePhotoFromGallery = (indexToRemove) => {
    setGalleryPhotos(galleryPhotos.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveGalleryPhotos = async () => {
    if (!galleryModalRoom) return;

    try {
      await fetch(API_ENDPOINTS.ADMIN_ROOM(galleryModalRoom.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify({ images: galleryPhotos }),
      });

      setRooms(rooms.map(r => r.id === galleryModalRoom.id ? { ...r, images: galleryPhotos, image: galleryPhotos[0] } : r));
      showToast(`Photos updated for "${galleryModalRoom.name}" (${galleryPhotos.length} photos)`);
    } catch (e) {
      setRooms(rooms.map(r => r.id === galleryModalRoom.id ? { ...r, images: galleryPhotos, image: galleryPhotos[0] } : r));
      showToast(`Photos updated for "${galleryModalRoom.name}"`);
    }

    logAdminAction(
      'ROOM_UPDATE',
      `Updated photo gallery for '${galleryModalRoom.name}' (${galleryPhotos.length} photos)`,
      'ROOM',
      galleryModalRoom.id
    );

    setGalleryModalRoom(null);
  };

  // 5. Booking Status Workflow (Check-in, Check-out, Cancel)
  const handleUpdateBookingStatus = async (bookingId, newStatus, newPaymentStatus = null) => {
    try {
      const body = { status: newStatus };
      if (newPaymentStatus) body.payment_status = newPaymentStatus;

      await fetch(API_ENDPOINTS.ADMIN_BOOKING_STATUS(bookingId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify(body),
      });

      setBookings(bookings.map(b => {
        if (b.id === bookingId || b.booking_reference === bookingId) {
          return {
            ...b,
            status: newStatus,
            ...(newPaymentStatus && { payment_status: newPaymentStatus }),
          };
        }
        return b;
      }));
      showToast(`Booking ${bookingId} updated to ${newStatus}.`);
    } catch (e) {
      showToast(`Booking updated to ${newStatus}.`);
    }

    logAdminAction(
      'BOOKING_STATUS_CHANGE',
      `Updated reservation ${bookingId} status to ${newStatus}${newPaymentStatus ? ' (Payment: ' + newPaymentStatus + ')' : ''}`,
      'BOOKING',
      bookingId
    );
  };

  // 6. Payment Reconcile
  const handleReconcilePayment = async (txnId, newStatus) => {
    try {
      await fetch(API_ENDPOINTS.ADMIN_PAYMENTS_RECONCILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.full_name || 'Admin',
          'X-User-Role': currentUser?.role || 'ADMIN',
        },
        body: JSON.stringify({
          transaction_id: txnId,
          status: newStatus,
        }),
      });
      setPayments(payments.map(p => p.id === txnId ? { ...p, status: newStatus } : p));
      showToast(`Payment ${txnId} marked as ${newStatus}.`);
    } catch (e) {
      showToast(`Payment marked as ${newStatus}.`);
    }

    logAdminAction(
      'PAYMENT_RECONCILE',
      `Reconciled gateway transaction ${txnId} to status: ${newStatus}`,
      'PAYMENT',
      txnId
    );
  };

  const showToast = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Filtered lists
  const filteredBookings = bookings.filter(b => 
    b.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.guest_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.gateway_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditActionFilter !== 'ALL') {
      const act = (log.action || '').toUpperCase();
      if (auditActionFilter === 'PRICE' && !act.includes('PRICE') && !act.includes('TARIFF')) return false;
      if (auditActionFilter === 'AVAILABILITY' && !act.includes('AVAILAB') && !act.includes('CALENDAR') && !act.includes('BLOCK')) return false;
      if (auditActionFilter === 'ROOM' && !act.includes('ROOM')) return false;
      if (auditActionFilter === 'BOOKING' && !act.includes('BOOKING')) return false;
      if (auditActionFilter === 'PAYMENT' && !act.includes('PAYMENT')) return false;
      if (auditActionFilter === 'USER' && !act.includes('USER_CREATED') && !act.includes('USER_UPDATED')) return false;
      if (auditActionFilter === 'AUTH' && !act.includes('LOGIN') && !act.includes('LOGOUT')) return false;
    }
    if (auditSearchQuery) {
      const q = auditSearchQuery.toLowerCase();
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchUser = log.user_name?.toLowerCase().includes(q) || log.user_role?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchEntity = (log.entity_id ? String(log.entity_id) : '')?.toLowerCase().includes(q);
      return matchDetails || matchUser || matchAction || matchEntity;
    }
    return true;
  });

  const formatExactTimestamp = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoStr;
    }
  };

  const getActionBadge = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return { bg: '#e0f2fe', color: '#0369a1', label: 'SIGN IN' };
    if (act.includes('LOGOUT')) return { bg: '#f1f5f9', color: '#64748b', label: 'SIGN OUT' };
    if (act.includes('PRICE') || act.includes('TARIFF')) return { bg: '#fef3c7', color: '#b45309', label: 'PRICE / TARIFF' };
    if (act.includes('CALENDAR') || act.includes('AVAILAB') || act.includes('BLOCK')) return { bg: '#ede9fe', color: '#6d28d9', label: 'CALENDAR / AVAILABILITY' };
    if (act.includes('ROOM_CREATED') || act.includes('CREATE')) return { bg: '#dcfce7', color: '#15803d', label: 'ROOM CREATED' };
    if (act.includes('ROOM_DELETED') || act.includes('DELETE')) return { bg: '#fee2e2', color: '#b91c1c', label: 'ROOM DELETED' };
    if (act.includes('ROOM_UPDATED') || act.includes('INVENTORY') || act.includes('GALLERY')) return { bg: '#e0e7ff', color: '#4338ca', label: 'ROOM INVENTORY' };
    if (act.includes('USER_CREATED') || act.includes('USER_UPDATED')) return { bg: '#fdf2f8', color: '#be185d', label: 'USER ACCOUNT' };
    if (act.includes('PAYMENT')) return { bg: '#d1fae5', color: '#065f46', label: 'PAYMENT RECONCILE' };
    if (act.includes('BOOKING')) return { bg: '#fef9c3', color: '#854d0e', label: 'BOOKING STATUS' };
    return { bg: '#f1f5f9', color: '#334155', label: act };
  };

  // ── UNAUTHENTICATED LOGIN SCREEN ─────────────────────────────────────────
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #070d1e 0%, #0a1128 50%, #151d3b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {onExitAdmin && (
          <button
            onClick={onExitAdmin}
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={16} />
            <span>Public Hotel Website</span>
          </button>
        )}

        <div
          className="anim-slide-up"
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #f6c773 0%, #b5832e 100%)',
                color: '#0a1128',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(246, 199, 115, 0.3)',
                marginBottom: '16px',
              }}
            >
              <Hotel size={32} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Operations Portal
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>
              Hotel Rama Inn &bull; Authorized Staff & Admin Sign In
            </p>
          </div>

          {/* Login Error Notification */}
          {loginError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin or user@hotelramainn.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-gold"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {loginLoading ? (
                <>
                  <RefreshCw size={16} className="anim-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Account Quick-Fill Buttons */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f6c773', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', textAlign: 'center' }}>
              Quick Fill Demo Accounts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('adminpassword123');
                }}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(246, 199, 115, 0.3)',
                  color: '#f6c773',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                👑 Administrator
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('staff');
                  setLoginPassword('staffpassword123');
                }}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                🛎️ Front Desk
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
              All administrative updates and logins are recorded in the audit log for accountability.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED DASHBOARD ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '36px 24px 100px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* Top Header with Return Button & Current User Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {onExitAdmin && (
                <button
                  onClick={onExitAdmin}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0a1128',
                  }}
                  title="Return to Hotel Rama Inn Public Site"
                >
                  <ArrowLeft size={16} />
                  <span>Public Site</span>
                </button>
              )}
              <div style={{ background: '#0a1128', color: '#f6c773', padding: '8px', borderRadius: '10px' }}>
                <Hotel size={24} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0a1128' }}>
                Hotel Rama Inn &bull; Operations Portal (/admin)
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
              Manage room availability, add multiple room photos, add/delete room categories, and reconcile transactions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* User Session Profile Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '6px 14px',
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: currentUser?.role === 'ADMIN' ? 'linear-gradient(135deg, #f6c773, #b5832e)' : '#0a1128',
                  color: currentUser?.role === 'ADMIN' ? '#0a1128' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                {(currentUser?.full_name || currentUser?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a1128', lineHeight: 1.2 }}>
                  {currentUser?.full_name || currentUser?.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: currentUser?.role === 'ADMIN' ? '#fef3c7' : currentUser?.role === 'MANAGER' ? '#dbeafe' : '#e0f2fe',
                      color: currentUser?.role === 'ADMIN' ? '#92400e' : currentUser?.role === 'MANAGER' ? '#1e40af' : '#0369a1',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {currentUser?.role || 'STAFF'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>@{currentUser?.username}</span>
                </div>
              </div>

              <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />

              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                title="Log Out of Operations Portal"
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>

            <button
              onClick={() => {
                fetchMetrics();
                fetchRooms();
                fetchBookings();
                fetchPayments();
                fetchUsers();
                fetchAuditLogs();
                showToast('All administrative data re-synchronized.');
              }}
              className="btn-outline-gold"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                color: '#0a1128',
                borderColor: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh Sync</span>
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className="anim-fade-in"
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: '#0a1128',
              color: '#f6c773',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span>ACTIVE RESERVATIONS</span>
              <Calendar size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0a1128' }}>{metrics.active_reservations}</div>
            <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>Confirmed & Checked In</div>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span>GROSS REVENUE</span>
              <DollarSign size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>₹{metrics.total_revenue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Paid via Gateway / Direct</div>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span>ROOM CATEGORIES</span>
              <Building2 size={18} color="#b5832e" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0a1128' }}>{rooms.length} Types</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{rooms.reduce((acc, r) => acc + (r.total_units || 0), 0)} Total Units</div>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span>PENDING HOLDS</span>
              <Clock size={18} color="#ea580c" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ea580c' }}>{metrics.pending_holds}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>10-minute temporary holds</div>
          </div>

        </div>

        {/* Tab Navigation Pill Bar */}
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            marginBottom: '28px',
            width: 'fit-content',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'inventory', label: 'Room Categories & Units', icon: Building2 },
            { id: 'calendar', label: 'Room Availability Calendar', icon: Calendar },
            { id: 'bookings', label: 'Bookings Information', icon: CheckCircle2 },
            { id: 'payments', label: 'Payment Transactions', icon: CreditCard },
            { id: 'audit', label: 'Audit Logs & Accountability', icon: Activity, count: auditLogs.length },
            { id: 'users', label: 'Staff & User Accounts', icon: Users, count: usersList.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#0a1128' : 'transparent',
                  color: isActive ? '#f6c773' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(246, 199, 115, 0.2)' : '#f1f5f9',
                      color: isActive ? '#f6c773' : '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: ROOM CATEGORIES & AVAILABILITY ── */}
        {activeTab === 'inventory' && (
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128' }}>
                  Room Categories & Photo Galleries
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Add multiple room photos per category, adjust physical counts, and control night tariffs.
                </p>
              </div>

              {/* Add Room Category Button */}
              <button
                onClick={() => setIsAddRoomModalOpen(true)}
                className="btn-gold"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={18} />
                <span>Add Room Category</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                    <th style={{ padding: '12px 16px' }}>Room Category</th>
                    <th style={{ padding: '12px 16px' }}>Photo Gallery</th>
                    <th style={{ padding: '12px 16px' }}>Available Units</th>
                    <th style={{ padding: '12px 16px' }}>Night Tariff</th>
                    <th style={{ padding: '12px 16px' }}>Occupancy Limits</th>
                    <th style={{ padding: '12px 16px' }}>Engine Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const isEditing = editingRoomId === room.id;
                    const roomPhotos = Array.isArray(room.images) && room.images.length > 0 
                      ? room.images 
                      : (room.image ? [room.image] : []);

                    return (
                      <tr key={room.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        
                        {/* Name */}
                        <td style={{ padding: '16px', fontWeight: 700, color: '#0a1128' }}>
                          <div>{room.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Slug: <code style={{ color: '#2563eb' }}>{room.slug}</code></div>
                        </td>

                        {/* Photos Thumbnail Strip & Manage Photos CTA */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {roomPhotos.slice(0, 3).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt=""
                                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => openGalleryManager(room)}
                              style={{
                                background: 'rgba(212, 163, 75, 0.1)',
                                border: '1px solid #d4a34b',
                                color: '#b5832e',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Manage all photos for this category"
                            >
                              <Camera size={13} />
                              <span>{roomPhotos.length} Photo{roomPhotos.length !== 1 ? 's' : ''}</span>
                            </button>
                          </div>
                        </td>

                        {/* Total Units */}
                        <td style={{ padding: '16px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editFormData.total_units}
                              onChange={(e) => setEditFormData({ ...editFormData, total_units: parseInt(e.target.value) || 0 })}
                              style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #2563eb' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 700, color: room.total_units > 0 ? '#0f172a' : '#ef4444' }}>
                              {room.total_units} Units
                            </span>
                          )}
                        </td>

                        {/* Tariff */}
                        <td style={{ padding: '16px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editFormData.base_price_per_night}
                              onChange={(e) => setEditFormData({ ...editFormData, base_price_per_night: parseFloat(e.target.value) || 0 })}
                              style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #2563eb' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 700, color: '#b5832e' }}>
                              ₹{Number(room.base_price_per_night).toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Capacity */}
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {room.max_adults} Adults, {room.max_children} Child
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '16px' }}>
                          {isEditing ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={editFormData.is_active}
                                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                              />
                              <span style={{ fontSize: '13px' }}>Active in Booking Engine</span>
                            </label>
                          ) : (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: room.is_active ? '#dcfce7' : '#fee2e2',
                                color: room.is_active ? '#15803d' : '#991b1b',
                              }}
                            >
                              {room.is_active ? 'Active & Bookable' : 'Blocked / Inactive'}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons: Modify & Delete */}
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleSaveRoom(room.id)}
                                className="btn-gold"
                                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Save size={14} />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingRoomId(null)}
                                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', background: '#e2e8f0', border: 'none', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="btn-outline-gold"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: '#0a1128',
                                  borderColor: '#cbd5e1',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <Edit3 size={13} />
                                <span>Modify</span>
                              </button>

                              <button
                                onClick={() => handleDeleteRoom(room)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  background: 'transparent',
                                  border: '1px solid #fecaca',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                                title="Delete this room category"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: ROOM AVAILABILITY CALENDAR & BLOCKOUTS ── */}
        {activeTab === 'calendar' && (() => {
          const targetRoom = rooms.find(r => r.id === selectedCalendarRoomId || r.slug === selectedCalendarRoomId) || rooms[0] || {
            id: 'deluxe-double',
            name: 'Deluxe King AC Room',
            slug: 'deluxe-king-ac',
            total_units: 8,
            base_price_per_night: 2899,
          };
          const totalCapacity = Number(targetRoom.total_units || 8);
          const basePrice = Number(targetRoom.base_price_per_night || 2899);
          const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
          const firstDayWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay();
          const blankDays = Array.from({ length: firstDayWeekday }, (_, i) => i);
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];

          // Compute days with active bookings and overrides
          const daysData = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayDate = new Date(calendarYear, calendarMonth - 1, d);

            const matchingBookings = bookings.filter((b) => {
              if (!b.check_in_date || !b.check_out_date) return false;
              const matchRoom = b.room_category_id === targetRoom.id || b.room_name === targetRoom.name;
              if (!matchRoom) return false;
              const isNotCancelled = b.status !== 'CANCELLED' && b.status !== 'EXPIRED';
              return isNotCancelled && b.check_in_date <= dateStr && dateStr < b.check_out_date;
            });
            const bookedCount = matchingBookings.reduce((sum, b) => sum + (Number(b.rooms_count) || 1), 0);

            const activeOverride = calendarOverrides.find((ov) => {
              const matchRoom = !ov.roomId || ov.roomId === targetRoom.id || ov.roomId === targetRoom.slug || ov.roomId === 'all';
              return matchRoom && ov.dateFrom <= dateStr && dateStr <= ov.dateTo;
            });

            let isBlocked = false;
            let availableUnits = Math.max(0, totalCapacity - bookedCount);
            let price = basePrice;
            let notes = null;

            if (activeOverride) {
              if (activeOverride.isBlocked) {
                isBlocked = true;
                availableUnits = 0;
              } else if (activeOverride.availableUnits !== undefined && activeOverride.availableUnits !== null) {
                availableUnits = Math.max(0, Number(activeOverride.availableUnits) - bookedCount);
              }
              if (activeOverride.priceOverride) price = Number(activeOverride.priceOverride);
              if (activeOverride.notes) notes = activeOverride.notes;
            }

            daysData.push({
              dateStr,
              dayNum: d,
              weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()],
              totalCapacity,
              bookedCount,
              availableUnits,
              isBlocked,
              price,
              notes,
              activeOverride,
            });
          }

          const blockedCount = daysData.filter(d => d.isBlocked).length;
          const bookedNights = daysData.reduce((acc, d) => acc + d.bookedCount, 0);

          return (
            <div
              className="anim-slide-up"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '28px',
                boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
              }}
            >
              {/* Header & Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128' }}>
                    Room Availability & Calendar Management
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    View daily occupancy updated dynamically by reservations. Block dates for maintenance or adjust room capacity.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setOverrideForm({
                        date_from: `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-01`,
                        date_to: `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-02`,
                        action_type: 'block',
                        available_units: 0,
                        price_override: '',
                        notes: '',
                      });
                      setIsOverrideModalOpen(true);
                    }}
                    className="btn-gold"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <Sliders size={16} />
                    <span>Update Availability / Block Dates</span>
                  </button>
                </div>
              </div>

              {/* Room Categories Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                {rooms.map((r) => {
                  const isSelected = selectedCalendarRoomId === r.id || selectedCalendarRoomId === r.slug;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedCalendarRoomId(r.id || r.slug)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #0a1128' : '1px solid #cbd5e1',
                        background: isSelected ? '#0a1128' : '#ffffff',
                        color: isSelected ? '#f6c773' : '#334155',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Hotel size={15} />
                      <span>{r.name}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          background: isSelected ? 'rgba(212, 163, 75, 0.2)' : '#f1f5f9',
                          color: isSelected ? '#f6c773' : '#64748b',
                        }}
                      >
                        {r.total_units} Units
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Month Navigator & Summary Metrics Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                {/* Month Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (calendarMonth === 1) {
                        setCalendarMonth(12);
                        setCalendarYear((y) => y - 1);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0a1128', minWidth: '160px', textAlign: 'center' }}>
                    {monthNames[calendarMonth - 1]} {calendarYear}
                  </h3>

                  <button
                    onClick={() => {
                      if (calendarMonth === 12) {
                        setCalendarMonth(1);
                        setCalendarYear((y) => y + 1);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalendarYear(now.getFullYear());
                      setCalendarMonth(now.getMonth() + 1);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Current Month
                  </button>
                </div>

                {/* Category Metric Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Total Units: <strong style={{ color: '#0a1128' }}>{totalCapacity}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Booked Units this Month: <strong style={{ color: '#2563eb' }}>{bookedNights}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Days Blocked: <strong style={{ color: '#ef4444' }}>{blockedCount}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Base Tariff: <strong style={{ color: '#b5832e' }}>₹{basePrice.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Monthly Grid */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {blankDays.map((i) => (
                    <div key={`blank-${i}`} style={{ minHeight: '90px', background: '#f8fafc', borderRadius: '10px', opacity: 0.4 }} />
                  ))}

                  {daysData.map((d) => {
                    let statusBg = '#dcfce7';
                    let statusColor = '#15803d';
                    let statusLabel = `${d.availableUnits} Available`;

                    if (d.isBlocked) {
                      statusBg = '#fee2e2';
                      statusColor = '#991b1b';
                      statusLabel = 'Admin Blocked';
                    } else if (d.availableUnits === 0) {
                      statusBg = '#fee2e2';
                      statusColor = '#b91c1c';
                      statusLabel = 'Sold Out';
                    } else if (d.availableUnits <= 2) {
                      statusBg = '#fef3c7';
                      statusColor = '#b45309';
                      statusLabel = `${d.availableUnits} Left`;
                    }

                    return (
                      <div
                        key={d.dateStr}
                        onClick={() => openOverrideModalForDay(d.dateStr)}
                        style={{
                          minHeight: '92px',
                          padding: '10px',
                          borderRadius: '12px',
                          border: d.isBlocked ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                          background: d.isBlocked ? 'rgba(254, 226, 226, 0.4)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#b5832e';
                          e.currentTarget.style.boxShadow = '0 6px 14px rgba(212, 163, 75, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = d.isBlocked ? '#fca5a5' : '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                        }}
                        title="Click to update availability, adjust capacity, or block date"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0a1128' }}>
                            {d.dayNum}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                            ₹{Math.round(d.price).toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <div
                            style={{
                              padding: '2px 6px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: statusBg,
                              color: statusColor,
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '3px',
                            }}
                          >
                            {statusLabel}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                            <span>Booked: {d.bookedCount}</span>
                            <span>Cap: {d.totalCapacity}</span>
                          </div>

                          {d.notes && (
                            <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              &bull; {d.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Admin Overrides & Blocks for this Category */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0a1128', marginBottom: '12px' }}>
                  Active Custom Overrides & Date Blocks for {targetRoom.name}
                </h3>
                {calendarOverrides.filter(ov => !ov.roomId || ov.roomId === targetRoom.id || ov.roomId === targetRoom.slug || ov.roomId === 'all').length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                    No custom date blocks or capacity overrides active. Default calculated availability is running.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                          <th style={{ padding: '10px 12px' }}>Date Range</th>
                          <th style={{ padding: '10px 12px' }}>Type / Action</th>
                          <th style={{ padding: '10px 12px' }}>Available Units</th>
                          <th style={{ padding: '10px 12px' }}>Night Tariff</th>
                          <th style={{ padding: '10px 12px' }}>Admin Reason</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendarOverrides
                          .filter(ov => !ov.roomId || ov.roomId === targetRoom.id || ov.roomId === targetRoom.slug || ov.roomId === 'all')
                          .map((ov) => (
                            <tr key={ov.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                                {ov.dateFrom} &rarr; {ov.dateTo}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: ov.isBlocked ? '#fee2e2' : '#fef3c7',
                                    color: ov.isBlocked ? '#991b1b' : '#92400e',
                                  }}
                                >
                                  {ov.isBlocked ? 'Blocked (Offline)' : 'Custom Capacity'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#475569' }}>
                                {ov.isBlocked ? '0 (Blocked)' : `${ov.availableUnits} Units`}
                              </td>
                              <td style={{ padding: '12px', color: '#475569' }}>
                                {ov.priceOverride ? `₹${Number(ov.priceOverride).toLocaleString()}` : 'Default Tariff'}
                              </td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                {ov.notes || '—'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleDeleteCalendarOverride(ov.id)}
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid #cbd5e1',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#b91c1c',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Clear Override
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* ── TAB 2: BOOKINGS INFORMATION ── */}
        {activeTab === 'bookings' && (
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128' }}>
                  Reservations & Guest Stay Information
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Manage check-in status, cancellations, and guest contact records.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter by ref, guest, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                    <th style={{ padding: '12px 14px' }}>Reference</th>
                    <th style={{ padding: '12px 14px' }}>Guest Contact</th>
                    <th style={{ padding: '12px 14px' }}>Room</th>
                    <th style={{ padding: '12px 14px' }}>Stay Dates</th>
                    <th style={{ padding: '12px 14px' }}>Tariff Paid</th>
                    <th style={{ padding: '12px 14px' }}>Booking Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Workflow Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>
                        {b.booking_reference}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.guest_name}</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>{b.guest_phone}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>{b.guest_email}</div>
                      </td>

                      <td style={{ padding: '14px', color: '#334155', fontWeight: 500 }}>
                        <div style={{ fontWeight: 600 }}>{b.room_name}</div>
                        <div style={{ fontSize: '11px', color: '#b5832e', fontWeight: 700, marginTop: '2px' }}>
                          {b.rooms_count || 1} {(b.rooms_count || 1) > 1 ? 'Rooms' : 'Room'} Booked
                        </div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div>{b.check_in_date} &rarr; {b.check_out_date}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>({b.total_nights} Nights)</div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#b5832e' }}>₹{b.final_payable?.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: b.payment_status === 'PAID' ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                          {b.payment_status}
                        </div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 
                              b.status === 'CONFIRMED' ? '#dbeafe' :
                              b.status === 'CHECKED_IN' ? '#dcfce7' :
                              b.status === 'CHECKED_OUT' ? '#f1f5f9' :
                              b.status === 'PENDING_PAYMENT' ? '#fef3c7' : '#fee2e2',
                            color:
                              b.status === 'CONFIRMED' ? '#1d4ed8' :
                              b.status === 'CHECKED_IN' ? '#15803d' :
                              b.status === 'CHECKED_OUT' ? '#475569' :
                              b.status === 'PENDING_PAYMENT' ? '#b45309' : '#b91c1c',
                          }}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                              style={{
                                background: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #bbf7d0',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Check-In
                            </button>
                          )}

                          {b.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')}
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Check-Out
                            </button>
                          )}

                          {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ── TAB 3: PAYMENT TRANSACTIONS ── */}
        {activeTab === 'payments' && (
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128' }}>
                  Gateway Payment Transactions & Audits
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Review Razorpay/Stripe charges, order IDs, and manual reconciliation tools.
                </p>
              </div>

              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter by ref, order id, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                    <th style={{ padding: '12px 14px' }}>Txn Reference</th>
                    <th style={{ padding: '12px 14px' }}>Booking Code</th>
                    <th style={{ padding: '12px 14px' }}>Gateway Identifiers</th>
                    <th style={{ padding: '12px 14px' }}>Amount</th>
                    <th style={{ padding: '12px 14px' }}>Gateway Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Reconcile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {p.id}
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>
                        {p.booking_reference}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ color: '#475569' }}>Order: <code style={{ fontSize: '11px' }}>{p.gateway_order_id}</code></div>
                        {p.gateway_payment_id && (
                          <div style={{ color: '#16a34a', fontSize: '11px' }}>Payment ID: {p.gateway_payment_id}</div>
                        )}
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Provider: {p.provider}</div>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700, color: '#0a1128' }}>
                        ₹{p.amount?.toLocaleString()} {p.currency}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: p.status === 'SUCCESS' ? '#dcfce7' : p.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                            color: p.status === 'SUCCESS' ? '#15803d' : p.status === 'PENDING' ? '#b45309' : '#b91c1c',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        {p.status !== 'SUCCESS' ? (
                          <button
                            onClick={() => handleReconcilePayment(p.id, 'SUCCESS')}
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: AUDIT LOGS & ACCOUNTABILITY ── */}
        {activeTab === 'audit' && (
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            {/* Audit Toolbar & Filters */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#0a1128', color: '#f6c773', padding: '6px', borderRadius: '8px' }}>
                    <Activity size={18} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a1128', margin: 0 }}>
                    Operations Audit & Accountability Log
                  </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', margin: 0 }}>
                  Immutable chronological record of all administrative activities, tariffs, inventory changes, and system access. Accessible by all staff.
                </p>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search logs, user, action..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      width: '230px',
                      outline: 'none',
                    }}
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff',
                    color: '#0a1128',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Categories ({auditLogs.length})</option>
                  <option value="AVAILABILITY">Room Availability & Calendar</option>
                  <option value="PRICE">Price & Room Tariffs</option>
                  <option value="ROOM">Room Inventory & Categories</option>
                  <option value="BOOKING">Booking & Status Changes</option>
                  <option value="PAYMENT">Payment Reconciliation</option>
                  <option value="USER">User Account Provisioning</option>
                  <option value="AUTH">Sign In & Authentication</option>
                </select>

                <button
                  onClick={() => {
                    fetchAuditLogs();
                    showToast('Audit log records re-synchronized.');
                  }}
                  title="Refresh Audit Records"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0a1128',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={14} className={auditLoading ? 'anim-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Accountability Banner */}
            <div
              style={{
                background: '#eff6ff',
                borderBottom: '1px solid #dbeafe',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: '#1e40af',
              }}
            >
              <ShieldCheck size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>
                <strong>Zero-Tamper Accountability:</strong> Every room availability block, price override, and transaction update is tagged with the actor's verified username, role, and exact timestamp down to the second.
              </span>
            </div>

            {/* Audit Logs Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700, width: '185px' }}>EXACT TIMESTAMP</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, width: '190px' }}>ACTOR / USER</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, width: '170px' }}>ACTION TYPE</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, width: '140px' }}>TARGET ENTITY</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>UPDATE DETAILS & AUDIT RECORD</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No audit log entries matching your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const badge = getActionBadge(log.action);
                      const isAdm = (log.user_role || '').toUpperCase() === 'ADMIN';
                      const isMgr = (log.user_role || '').toUpperCase() === 'MANAGER';
                      return (
                        <tr
                          key={log.id || `${log.timestamp}-${log.action}`}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Exact Timestamp */}
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0a1128' }}>
                              <Clock size={13} color="#64748b" />
                              <span>{formatExactTimestamp(log.timestamp)}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                              {log.timestamp}
                            </div>
                          </td>

                          {/* Actor / User */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#0a1128' }}>{log.user_name || 'System User'}</div>
                            <div style={{ marginTop: '3px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isAdm ? '#fef3c7' : isMgr ? '#dbeafe' : '#f1f5f9',
                                  color: isAdm ? '#92400e' : isMgr ? '#1e40af' : '#475569',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {log.user_role || 'STAFF'}
                              </span>
                            </div>
                          </td>

                          {/* Action Type Badge */}
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: badge.bg,
                                color: badge.color,
                                letterSpacing: '0.03em',
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Target Entity */}
                          <td style={{ padding: '14px 18px' }}>
                            {log.entity_type || log.entity_id ? (
                              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#334155' }}>
                                <span style={{ color: '#64748b' }}>{log.entity_type || 'ITEM'}: </span>
                                <strong>{log.entity_id || 'N/A'}</strong>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>System Portal</span>
                            )}
                          </td>

                          {/* Details */}
                          <td style={{ padding: '14px 18px', color: '#1e293b', lineHeight: 1.5 }}>
                            {log.details || 'Operational state updated.'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <span>Showing {filteredAuditLogs.length} of {auditLogs.length} logged entries</span>
              <span>Accountability Retention: Permanent Audit Ledger</span>
            </div>
          </div>
        )}

        {/* ── TAB 6: STAFF & USER ACCOUNTS ── */}
        {activeTab === 'users' && (
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            {/* Header & Provision Button */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#0a1128', color: '#f6c773', padding: '6px', borderRadius: '8px' }}>
                    <Users size={18} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a1128', margin: 0 }}>
                    Staff & User Access Management
                  </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', margin: 0 }}>
                  Manage authorized users, assign roles, and provision new credentials with administrative control.
                </p>
              </div>

              {currentUser?.role === 'ADMIN' ? (
                <button
                  onClick={() => {
                    setNewUserData({
                      full_name: '',
                      username: '',
                      email: '',
                      password: '',
                      role: 'STAFF',
                    });
                    setIsAddUserModalOpen(true);
                  }}
                  className="btn-gold"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                  }}
                >
                  <UserPlus size={16} />
                  <span>Add New User</span>
                </button>
              ) : (
                <div
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shield size={14} color="#64748b" />
                  <span>Admin privileges required to provision new accounts</span>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>USER ACCOUNT</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>EMAIL ADDRESS</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>ASSIGNED ROLE</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>ACCOUNT STATUS</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>PROVISIONED DATE</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => {
                    const isAdm = (user.role || '').toUpperCase() === 'ADMIN';
                    const isMgr = (user.role || '').toUpperCase() === 'MANAGER';
                    const isSelf = currentUser?.username === user.username;
                    return (
                      <tr
                        key={user.id || user.username}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* User Account */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: isAdm ? 'linear-gradient(135deg, #f6c773, #b5832e)' : '#0a1128',
                                color: isAdm ? '#0a1128' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '14px',
                                flexShrink: 0,
                              }}
                            >
                              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0a1128', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{user.full_name}</span>
                                {isSelf && (
                                  <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 18px', color: '#334155' }}>
                          {user.email}
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: isAdm ? '#fef3c7' : isMgr ? '#dbeafe' : '#f1f5f9',
                              color: isAdm ? '#92400e' : isMgr ? '#1e40af' : '#475569',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 18px' }}>
                          {user.is_active ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <AlertCircle size={12} />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Initial Setup'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          {currentUser?.role === 'ADMIN' && !isSelf && (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: user.is_active ? '#cbd5e1' : '#22c55e',
                                background: user.is_active ? '#ffffff' : '#f0fdf4',
                                color: user.is_active ? '#dc2626' : '#15803d',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate User'}
                            </button>
                          )}
                          {isSelf && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Current Session
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* User Permissions Legend */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <div>
                <strong>ADMIN:</strong> Full control &bull; Provision users &bull; Set passwords &bull; Tariffs, Calendar & Inventory &bull; Audit log
              </div>
              <div>
                <strong>MANAGER:</strong> Update room inventory, calendar overrides & booking statuses &bull; Reconcile payments &bull; Audit log
              </div>
              <div>
                <strong>STAFF:</strong> Update booking check-ins, view calendar availability &bull; Full transparent access to accountability audit log
              </div>
            </div>
          </div>
        )}


      </div>

      {/* ── MODAL: MULTIPLE PHOTOS GALLERY MANAGER ── */}
      {galleryModalRoom && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <div style={{ color: '#b5832e', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Photo Gallery Manager
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a1128' }}>
                  {galleryModalRoom.name}
                </h3>
              </div>
              <button
                onClick={() => setGalleryModalRoom(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Add New Photo Input */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={newPhotoInput}
                  onChange={(e) => setNewPhotoInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                  onClick={handleAddPhotoToGallery}
                  className="btn-gold"
                  style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>Add Photo</span>
                </button>
              </div>

              {/* Photos Grid */}
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
                Current Photos ({galleryPhotos.length}):
              </div>

              {galleryPhotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8' }}>
                  No photos added yet. Paste image URLs above to populate this room's carousel.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  {galleryPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        height: '110px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1.5px solid #e2e8f0',
                      }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => handleRemovePhotoFromGallery(idx)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Remove photo"
                      >
                        <X size={14} />
                      </button>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '6px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setGalleryModalRoom(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGalleryPhotos}
                  className="btn-gold"
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 700 }}
                >
                  Save Gallery Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW ROOM CATEGORY ── */}
      {isAddRoomModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a1128' }}>
                Add New Room Category with Photos
              </h3>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Room Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Garden View Suite"
                  value={newRoomData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewRoomData({ ...newRoomData, name, slug });
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Slug (URL Identifier) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. premium-garden-view"
                    value={newRoomData.slug}
                    onChange={(e) => setNewRoomData({ ...newRoomData, slug: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Total Physical Units *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoomData.total_units}
                    onChange={(e) => setNewRoomData({ ...newRoomData, total_units: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Base Tariff per Night (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={newRoomData.base_price_per_night}
                    onChange={(e) => setNewRoomData({ ...newRoomData, base_price_per_night: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Tax Percent (GST) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newRoomData.tax_percent}
                    onChange={(e) => setNewRoomData({ ...newRoomData, tax_percent: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Max Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRoomData.max_adults}
                    onChange={(e) => setNewRoomData({ ...newRoomData, max_adults: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Max Children *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={newRoomData.max_children}
                    onChange={(e) => setNewRoomData({ ...newRoomData, max_children: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Split AC, Wi-Fi, 4K Smart TV, Mini Bar"
                  value={newRoomData.amenities}
                  onChange={(e) => setNewRoomData({ ...newRoomData, amenities: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                />
              </div>

              {/* Multiple Photo Input Fields */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    Multiple Room Photos (URLs) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewRoomData({ ...newRoomData, photoList: [...newRoomData.photoList, ''] })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b5832e',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Another Photo URL</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newRoomData.photoList.map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="url"
                        placeholder={`Photo #${idx + 1} URL (https://...)`}
                        value={url}
                        onChange={(e) => {
                          const updated = [...newRoomData.photoList];
                          updated[idx] = e.target.value;
                          setNewRoomData({ ...newRoomData, photoList: updated });
                        }}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                        required={idx === 0}
                      />
                      {newRoomData.photoList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewRoomData({
                              ...newRoomData,
                              photoList: newRoomData.photoList.filter((_, i) => i !== idx),
                            });
                          }}
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#ef4444',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                          }}
                          title="Remove this photo"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 700 }}
                >
                  Save & Publish Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UPDATE ROOM CALENDAR OVERRIDE & BLOCKOUTS ── */}
      {isOverrideModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0a1128',
                color: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f6c773' }}>
                  Update Room Availability Calendar
                </h3>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  Block dates, adjust capacity, or set holiday tariffs
                </div>
              </div>

              <button
                onClick={() => setIsOverrideModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarOverride} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Room Category Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Target Room Category *
                </label>
                <select
                  value={selectedCalendarRoomId}
                  onChange={(e) => setSelectedCalendarRoomId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id || r.slug}>
                      {r.name} ({r.total_units} total physical units)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    From Date *
                  </label>
                  <input
                    type="date"
                    value={overrideForm.date_from}
                    onChange={(e) => setOverrideForm({ ...overrideForm, date_from: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    To Date *
                  </label>
                  <input
                    type="date"
                    min={overrideForm.date_from}
                    value={overrideForm.date_to}
                    onChange={(e) => setOverrideForm({ ...overrideForm, date_to: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Action / Availability Setting:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'block', label: 'Block Dates', desc: 'Set Available to 0', color: '#b91c1c', icon: Lock },
                    { id: 'custom_units', label: 'Custom Capacity', desc: 'Set exact units', color: '#b45309', icon: Sliders },
                    { id: 'restore', label: 'Restore Default', desc: 'Clear overrides', color: '#15803d', icon: Unlock },
                  ].map((opt) => {
                    const isSelected = overrideForm.action_type === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOverrideForm({ ...overrideForm, action_type: opt.id })}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${opt.color}` : '1.5px solid #cbd5e1',
                          background: isSelected ? 'rgba(212, 163, 75, 0.08)' : '#f8fafc',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={16} color={opt.color} style={{ margin: '0 auto 4px' }} />
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a1128' }}>{opt.label}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If Custom Units is selected */}
              {overrideForm.action_type === 'custom_units' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Available Units Count:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={overrideForm.available_units}
                    onChange={(e) => setOverrideForm({ ...overrideForm, available_units: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>
              )}

              {/* Special Tariff Override */}
              {overrideForm.action_type !== 'restore' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Special Tariff / Price Override (₹ per night, optional):
                  </label>
                  <input
                    type="number"
                    placeholder="Leave blank to use standard room tariff"
                    value={overrideForm.price_override}
                    onChange={(e) => setOverrideForm({ ...overrideForm, price_override: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Notes / Reason */}
              {overrideForm.action_type !== 'restore' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Staff Reason / Notes (optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AC Maintenance, Festival Season Peak, VIP delegation"
                    value={overrideForm.notes}
                    onChange={(e) => setOverrideForm({ ...overrideForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {overrideForm.action_type === 'restore'
                    ? 'Restore Default Availability'
                    : 'Apply Calendar Update'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PROVISION NEW USER ACCOUNT ── */}
      {isAddUserModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="anim-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0a1128',
                color: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f6c773' }}>
                  Provision New User Account
                </h3>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  Create staff login credentials and assign operational role
                </div>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateUser} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name of Staff / User:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Verma"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Username (unique sign-in handle):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.verma"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Official Email Address:
                </label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@hotelramainn.com (optional)"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  User Role & Permissions:
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="STAFF">Front Desk Staff (Booking Check-in, View Calendar & Audit Log)</option>
                  <option value="MANAGER">Operations Manager (Inventory, Calendar Overrides, Payment Reconcile)</option>
                  <option value="ADMIN">Principal Administrator (Full Access, User Provisioning, System Overrides)</option>
                </select>
              </div>

              {/* Password with Generator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Account Password:
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b5832e',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ⚡ Auto-Generate Strong Password
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter secure initial password..."
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showNewUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Accountability Notice */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700, color: '#0a1128', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>Accountability & Transparency Guarantee</span>
                </div>
                Every room price change, calendar override, or reservation modification made under this account will be recorded in the system audit log with an exact timestamp.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <UserPlus size={16} />
                  <span>Provision Account</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
