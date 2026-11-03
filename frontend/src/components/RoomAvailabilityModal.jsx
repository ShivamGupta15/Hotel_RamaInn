import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

export default function RoomAvailabilityModal({ room, onClose, onSelectDates }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarDays, setCalendarDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date selection state for booking from the calendar
  const [rangeStart, setRangeStart] = useState(null); // 'YYYY-MM-DD'
  const [rangeEnd, setRangeEnd] = useState(null); // 'YYYY-MM-DD'

  // Fetch or compute availability for (currentYear, currentMonth)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCalendarData = async () => {
      let apiData = null;
      try {
        const res = await fetch(API_ENDPOINTS.ROOM_CALENDAR(room?.id || room?.slug || 'deluxe-double', currentYear, currentMonth));
        if (res.ok) {
          apiData = await res.json();
        }
      } catch (err) {
        // Fallback to local computation
      }

      // Calculate days count in current month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0: Sun ... 6: Sat

      // Read local bookings & overrides from localStorage to ensure instant live reactivity
      let localBookings = [];
      try {
        localBookings = JSON.parse(localStorage.getItem('admin_recent_bookings') || '[]');
      } catch (e) {}

      let localOverrides = [];
      try {
        localOverrides = JSON.parse(localStorage.getItem('admin_calendar_overrides') || '[]');
      } catch (e) {}

      const totalCapacity = room?.totalUnits || room?.total_units || 8;
      const baseTariff = room?.basePrice || room?.base_price_per_night || 2899;

      const generatedDays = [];
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayDate = new Date(currentYear, currentMonth - 1, dayNum);

        // 1. Calculate booked units on this date from localBookings
        const matchingBookings = localBookings.filter((b) => {
          if (!b.check_in_date || !b.check_out_date) return false;
          // Match room category
          const matchRoom = !room?.id || b.room_category_id === room.id || b.room_name === room.name;
          if (!matchRoom) return false;
          const isNotCancelled = b.status !== 'CANCELLED' && b.status !== 'EXPIRED';
          return isNotCancelled && b.check_in_date <= dateStr && dateStr < b.check_out_date;
        });

        const bookedCount = matchingBookings.reduce((sum, b) => sum + (Number(b.rooms_count) || 1), 0);

        // 2. Check admin overrides
        const activeOverride = localOverrides.find((ov) => {
          const matchRoom = !ov.roomId || ov.roomId === room?.id || ov.roomId === room?.slug || ov.roomId === 'all';
          return matchRoom && ov.dateFrom <= dateStr && dateStr <= ov.dateTo;
        });

        let availableUnits = Math.max(0, totalCapacity - bookedCount);
        let isBlocked = false;
        let price = baseTariff;
        let notes = null;

        if (activeOverride) {
          if (activeOverride.isBlocked) {
            isBlocked = true;
            availableUnits = 0;
          } else if (activeOverride.availableUnits !== undefined && activeOverride.availableUnits !== null) {
            availableUnits = Math.max(0, Number(activeOverride.availableUnits) - bookedCount);
          }
          if (activeOverride.priceOverride) {
            price = Number(activeOverride.priceOverride);
          }
          if (activeOverride.notes) {
            notes = activeOverride.notes;
          }
        } else if (apiData && apiData.days && apiData.days[dayNum - 1]) {
          const apiDay = apiData.days[dayNum - 1];
          if (apiDay.is_blocked) isBlocked = true;
          if (apiDay.available_units !== undefined) {
            availableUnits = Math.min(availableUnits, apiDay.available_units);
          }
          if (apiDay.price) price = apiDay.price;
          if (apiDay.notes) notes = apiDay.notes;
        }

        // Determine status tag
        let status = 'AVAILABLE';
        if (isBlocked) {
          status = 'BLOCKED';
        } else if (availableUnits === 0) {
          status = 'SOLD_OUT';
        } else if (availableUnits <= 2) {
          status = 'LIMITED';
        }

        const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

        generatedDays.push({
          date: dateStr,
          day: dayNum,
          weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()],
          totalUnits: totalCapacity,
          bookedUnits: bookedCount,
          availableUnits,
          isBlocked,
          isPast,
          status,
          price,
          notes,
        });
      }

      if (isMounted) {
        setCalendarDays(generatedDays);
        setIsLoading(false);
      }
    };

    loadCalendarData();
    return () => {
      isMounted = false;
    };
  }, [room, currentYear, currentMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Click on date in calendar
  const handleDayClick = (dayObj) => {
    if (dayObj.isPast || dayObj.isBlocked || dayObj.availableUnits <= 0) return;

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dayObj.date);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (dayObj.date > rangeStart) {
        setRangeEnd(dayObj.date);
      } else {
        setRangeStart(dayObj.date);
        setRangeEnd(null);
      }
    }
  };

  const isDaySelected = (dateStr) => {
    if (rangeStart && rangeEnd) {
      return dateStr >= rangeStart && dateStr <= rangeEnd;
    }
    return dateStr === rangeStart;
  };

  // Compute selected stay info
  let selectedNights = 0;
  let estimatedTariff = 0;
  if (rangeStart && rangeEnd) {
    const d1 = new Date(rangeStart);
    const d2 = new Date(rangeEnd);
    selectedNights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const baseTariff = room?.basePrice || room?.base_price_per_night || 2899;
    estimatedTariff = baseTariff * selectedNights;
  }

  // Prepend blanks for alignment with Sunday start
  const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay();
  const blankDays = Array.from({ length: firstDayWeekday }, (_, i) => i);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 17, 40, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 105,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="anim-slide-up"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0a1128 0%, #1c2e4a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {room?.image && (
              <img
                src={room.image}
                alt={room.name}
                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f6c773', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Live Room Availability Calendar
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '2px 0 0' }}>
                {room?.name || 'Deluxe King AC Room'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Calendar Controls & Month Header */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrevMonth}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a1128', minWidth: '170px', textAlign: 'center' }}>
              {monthNames[currentMonth - 1]} {currentYear}
            </h3>

            <button
              onClick={handleNextMonth}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
              }}
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={handleJumpToToday}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              Today
            </button>
          </div>

          {/* Color legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span>Limited</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span>Sold Out</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }} />
              <span>Blocked</span>
            </div>
          </div>
        </div>

        {/* Calendar Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid of Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {blankDays.map((i) => (
              <div key={`blank-${i}`} style={{ minHeight: '80px', background: '#f8fafc', borderRadius: '10px', opacity: 0.4 }} />
            ))}

            {calendarDays.map((d) => {
              const isSelected = isDaySelected(d.date);
              const isSelectable = !d.isPast && !d.isBlocked && d.availableUnits > 0;

              let statusBg = '#dcfce7';
              let statusColor = '#15803d';
              let statusText = `${d.availableUnits} Available`;

              if (d.isBlocked) {
                statusBg = '#f1f5f9';
                statusColor = '#64748b';
                statusText = 'Blocked';
              } else if (d.availableUnits === 0) {
                statusBg = '#fee2e2';
                statusColor = '#b91c1c';
                statusText = 'Sold Out';
              } else if (d.availableUnits <= 2) {
                statusBg = '#fef3c7';
                statusColor = '#b45309';
                statusText = `${d.availableUnits} Left!`;
              }

              if (d.isPast) {
                statusBg = '#f1f5f9';
                statusColor = '#94a3b8';
                statusText = 'Past';
              }

              return (
                <div
                  key={d.date}
                  onClick={() => handleDayClick(d)}
                  style={{
                    minHeight: '85px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: isSelected
                      ? '2px solid #b5832e'
                      : '1px solid #e2e8f0',
                    background: isSelected
                      ? 'rgba(212, 163, 75, 0.12)'
                      : d.isPast
                      ? '#f8fafc'
                      : '#ffffff',
                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                    opacity: d.isPast ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(212, 163, 75, 0.25)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#b5832e' : '#0a1128' }}>
                      {d.day}
                    </span>
                    {!d.isPast && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                        ₹{Math.round(d.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: statusBg,
                        color: statusColor,
                        width: '100%',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusText}
                    </span>
                    {d.notes && (
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Range Footer Action */}
        <div
          style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            {rangeStart && rangeEnd ? (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a1128' }}>
                  Selected Stay: {rangeStart} &rarr; {rangeEnd} ({selectedNights} Night{selectedNights > 1 ? 's' : ''})
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Estimated Room Tariff: ₹{estimatedTariff.toLocaleString()} (Excl. taxes)
                </div>
              </div>
            ) : rangeStart ? (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0a1128' }}>
                  Check-in Date Selected: <strong>{rangeStart}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#b5832e', fontWeight: 600 }}>
                  Please click a second date to select Check-out.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Tip: Click on any available date to choose your stay and reserve immediately.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              Close
            </button>

            {rangeStart && rangeEnd && (
              <button
                onClick={() => {
                  onSelectDates({ checkIn: rangeStart, checkOut: rangeEnd });
                  onClose();
                }}
                className="btn-gold"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <span>Book This Stay Range</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

