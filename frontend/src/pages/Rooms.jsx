import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, BedDouble, Maximize2, Shield, ArrowRight, Filter, Sparkles, Calendar, Layers, Check } from 'lucide-react';
import { ROOM_CATEGORIES } from '../data/hotelData';
import RoomCardImageSlider from '../components/RoomCardImageSlider';
import RoomAvailabilityModal from '../components/RoomAvailabilityModal';

export default function Rooms({ onSelectRoom, searchCriteria }) {
  const [filterType, setFilterType] = useState('all');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [selectedRoomForCalendar, setSelectedRoomForCalendar] = useState(null);

  const [checkIn, setCheckIn] = useState(searchCriteria?.checkIn || '2026-10-30');
  const [checkOut, setCheckOut] = useState(searchCriteria?.checkOut || '2026-11-01');
  const [guests, setGuests] = useState(Number(searchCriteria?.guests || searchCriteria?.adults || 2));
  const [defaultRooms, setDefaultRooms] = useState(Number(searchCriteria?.rooms || 1));

  // Per-room quantity state: { [roomId]: quantity }
  const [roomQuantities, setRoomQuantities] = useState({});

  // Sync if searchCriteria changes from parent
  useEffect(() => {
    if (searchCriteria) {
      if (searchCriteria.checkIn) setCheckIn(searchCriteria.checkIn);
      if (searchCriteria.checkOut) setCheckOut(searchCriteria.checkOut);
      if (searchCriteria.guests) setGuests(Number(searchCriteria.guests));
      if (searchCriteria.rooms) {
        const rCount = Number(searchCriteria.rooms);
        setDefaultRooms(rCount);
        const initMap = {};
        ROOM_CATEGORIES.forEach((r) => {
          const maxAvail = r.availableUnits || r.totalUnits || 8;
          initMap[r.id] = Math.min(Math.max(1, rCount), maxAvail);
        });
        setRoomQuantities(initMap);
      }
    }
  }, [searchCriteria]);

  // Compute stay nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) || 1);

  const handleGuestChange = (val) => {
    const num = Number(val);
    setGuests(num);
    // Auto-calculate suggested rooms (1 room per 2 adults)
    const suggested = Math.max(1, Math.ceil(num / 2));
    setDefaultRooms(suggested);
    const updated = {};
    ROOM_CATEGORIES.forEach((r) => {
      const maxAvail = r.availableUnits || r.totalUnits || 8;
      updated[r.id] = Math.min(suggested, maxAvail);
    });
    setRoomQuantities(updated);
  };

  const getQuantityForRoom = (room) => {
    if (roomQuantities[room.id] !== undefined) {
      return roomQuantities[room.id];
    }
    const maxAvail = room.availableUnits || room.totalUnits || 8;
    return Math.min(defaultRooms, maxAvail);
  };

  const handleSetRoomQuantity = (roomId, qty, maxAvail) => {
    const validQty = Math.min(Math.max(1, qty), maxAvail);
    setRoomQuantities((prev) => ({
      ...prev,
      [roomId]: validQty,
    }));
  };

  const filteredRooms = ROOM_CATEGORIES.filter((room) => {
    if (filterType === 'all') return true;
    if (filterType === 'couples') return room.maxAdults <= 2;
    if (filterType === 'family') return room.maxAdults >= 3;
    if (filterType === 'luxury') return room.basePrice > 5000;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px 100px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '10px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#b5832e',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}
        >
          <Sparkles size={15} />
          <span>Accommodations Catalog</span>
        </span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#0a1128', marginBottom: '16px' }}>
          Rooms, Suites & Tariffs
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '640px', margin: '0 auto' }}>
          Select up to the maximum rooms available in each category. Seamless multi-room checkout with unified Razorpay billing.
        </p>

        {/* Stay Dates & Rooms Customizer Bar */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            marginTop: '28px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            maxWidth: '920px',
            margin: '28px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end',
            textAlign: 'left',
          }}
        >
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              <Calendar size={14} color="#d4a34b" />
              <span>Check-In</span>
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              <Calendar size={14} color="#d4a34b" />
              <span>Check-Out</span>
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              <Users size={14} color="#d4a34b" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={(e) => handleGuestChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 500,
                background: '#fff',
                outline: 'none',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'} (Suggests {Math.max(1, Math.ceil(num / 2))} {Math.max(1, Math.ceil(num / 2)) === 1 ? 'Room' : 'Rooms'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              <BedDouble size={14} color="#d4a34b" />
              <span>Stay Duration</span>
            </label>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0a1128',
                textAlign: 'center',
              }}
            >
              {nights} Night{nights > 1 ? 's' : ''} Stay
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: '#ffffff',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginTop: '24px',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'couples', label: 'Couples / Solo (1-2 Guests)' },
            { id: 'family', label: 'Family & Groups (3-4 Guests)' },
            { id: 'luxury', label: 'VIP Suites' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: filterType === tab.id ? '#0a1128' : 'transparent',
                color: filterType === tab.id ? '#ffffff' : '#64748b',
                fontWeight: filterType === tab.id ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room Listing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
        {filteredRooms.map((room) => {
          const maxAvail = room.availableUnits || room.totalUnits || 8;
          const currentQty = getQuantityForRoom(room);
          const roomTotal = room.basePrice * currentQty * nights;

          return (
            <div
              key={room.id}
              className="interactive-card anim-slide-up"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
              }}
            >
              {/* Image & Multi-photo Slider */}
              <RoomCardImageSlider
                images={room.images || [room.image]}
                alt={room.name}
                badge={room.badge}
                price={room.basePrice}
                onEnlarge={(imgUrl) => setSelectedImageModal(imgUrl)}
              />

              {/* Room Body */}
              <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128', marginBottom: '6px' }}>
                      {room.name}
                    </h2>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                    {room.tagline}
                  </p>
                </div>

                {/* Specs Pills */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#475569',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} color="#d4a34b" />
                    <span>Max {room.maxAdults} / room</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BedDouble size={15} color="#d4a34b" />
                    <span>{room.bedType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Maximize2 size={15} color="#d4a34b" />
                    <span>{room.area}</span>
                  </div>
                </div>

                {/* Amenities Checklist */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Key Amenities Included:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {room.amenities.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                        <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Room Quantity Selector & Total Tariff Box */}
                <div
                  style={{
                    background: 'rgba(212, 163, 75, 0.07)',
                    border: '1.5px solid rgba(212, 163, 75, 0.25)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a1128' }}>
                        Select Number of Rooms:
                      </div>
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                        &bull; Up to {maxAvail} rooms available
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleSetRoomQuantity(room.id, currentQty - 1, maxAvail)}
                        disabled={currentQty <= 1}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: currentQty <= 1 ? '#f1f5f9' : '#ffffff',
                          cursor: currentQty <= 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0a1128',
                        }}
                      >
                        &minus;
                      </button>

                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0a1128', minWidth: '24px', textAlign: 'center' }}>
                        {currentQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSetRoomQuantity(room.id, currentQty + 1, maxAvail)}
                        disabled={currentQty >= maxAvail}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: currentQty >= maxAvail ? '#f1f5f9' : '#ffffff',
                          cursor: currentQty >= maxAvail ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0a1128',
                        }}
                      >
                        &#43;
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '8px', borderTop: '1px dashed rgba(212, 163, 75, 0.3)' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {currentQty} Room{currentQty > 1 ? 's' : ''} &times; {nights} Night{nights > 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '17px', fontWeight: 800, color: '#b5832e' }}>
                      ₹{roomTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomForCalendar(room)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0a1128',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Calendar size={15} color="#b5832e" />
                    <span>View Availability Calendar</span>
                  </button>

                  <button
                    onClick={() =>
                      onSelectRoom({
                        ...room,
                        requestedRooms: currentQty,
                        checkIn,
                        checkOut,
                        adults: guests,
                      })
                    }
                    className="btn-gold"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Book {currentQty} Room{currentQty > 1 ? 's' : ''} at Once</span>
                    <ArrowRight size={17} />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Room Availability Calendar Lightbox Modal */}
      {selectedRoomForCalendar && (
        <RoomAvailabilityModal
          room={selectedRoomForCalendar}
          onClose={() => setSelectedRoomForCalendar(null)}
          onSelectDates={({ checkIn: newCi, checkOut: newCo }) => {
            setCheckIn(newCi);
            setCheckOut(newCo);
            onSelectRoom({
              ...selectedRoomForCalendar,
              checkIn: newCi,
              checkOut: newCo,
              requestedRooms: getQuantityForRoom(selectedRoomForCalendar),
              adults: guests,
            });
          }}
        />
      )}

      {/* Image Modal Lightbox */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <img
            src={selectedImageModal}
            alt="Enlarged Room Preview"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              objectFit: 'contain',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}

    </div>
  );
}

