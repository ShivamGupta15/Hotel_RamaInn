import React, { useState } from 'react';
import { Calendar, Users, BedDouble, ArrowRight, ShieldCheck, Star, Sparkles, Coffee, Wifi, MapPin } from 'lucide-react';
import { HOTEL_INFO, ROOM_CATEGORIES, HOTEL_AMENITIES } from '../data/hotelData';
import RoomCardImageSlider from '../components/RoomCardImageSlider';

export default function Home({ onSelectRoom, onNavigateToRooms, onNavigateToContact }) {
  const [checkIn, setCheckIn] = useState('2026-10-30');
  const [checkOut, setCheckOut] = useState('2026-11-01');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState(1);
  const [autoCalculateRooms, setAutoCalculateRooms] = useState(true);

  const handleGuestChange = (newGuests) => {
    setGuests(newGuests);
    if (autoCalculateRooms) {
      const count = parseInt(newGuests, 10) || 1;
      const recRooms = Math.max(1, Math.ceil(count / 2));
      setRooms(recRooms);
    }
  };

  const handleRoomChange = (newRooms) => {
    setRooms(Number(newRooms));
    setAutoCalculateRooms(false);
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    onNavigateToRooms({
      checkIn,
      checkOut,
      guests: Number(guests),
      adults: Number(guests),
      rooms: Number(rooms),
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(10, 17, 40, 0.72) 0%, rgba(10, 17, 40, 0.88) 100%), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          padding: '60px 24px 100px',
        }}
      >
        <div style={{ maxWidth: '1100px', width: '100%', textAlign: 'center', color: '#ffffff' }}>
          
          {/* Subtle Pill Tag */}
          <div
            className="anim-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(212, 163, 75, 0.18)',
              border: '1px solid rgba(212, 163, 75, 0.45)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#f6c773',
              marginBottom: '24px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={15} />
            <span>Official Booking Engine &bull; Best Price Guarantee</span>
          </div>

          {/* Hero Heading */}
          <h1
            className="anim-slide-up"
            style={{
              fontSize: 'clamp(38px, 6vw, 68px)',
              lineHeight: 1.15,
              fontWeight: 700,
              marginBottom: '20px',
              letterSpacing: '-0.5px',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            Experience Refined Elegance at <br />
            <span style={{ color: '#f6c773', fontStyle: 'italic' }}>Hotel Rama Inn</span>
          </h1>

          <p
            className="anim-slide-up anim-delay-1"
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#e2e8f0',
              maxWidth: '720px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
            }}
          >
            Where modern sophistication meets traditional warmth. Enjoy lavish suites, exquisite dining, and seamless 24/7 hospitality.
          </p>

          {/* Quick Availability Search Widget */}
          <div
            className="anim-slide-up anim-delay-2"
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(20px)',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              maxWidth: '960px',
              margin: '0 auto',
              color: '#0f172a',
              textAlign: 'left',
            }}
          >
            <form onSubmit={handleHeroSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <Calendar size={15} color="#d4a34b" />
                  <span>Check-In Date</span>
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <Calendar size={15} color="#d4a34b" />
                  <span>Check-Out Date</span>
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <Users size={15} color="#d4a34b" />
                  <span>Number of Guests</span>
                </label>
                <select
                  value={guests}
                  onChange={(e) => handleGuestChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests (Couple)</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="8">8 Guests (Large Group)</option>
                  <option value="10">10 Guests (Max Group)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BedDouble size={15} color="#d4a34b" />
                    <span>Rooms to Book</span>
                  </span>
                  {autoCalculateRooms && (
                    <span style={{ fontSize: '11px', color: '#b5832e', fontWeight: 600 }}>
                      Auto-matched
                    </span>
                  )}
                </label>
                <select
                  value={rooms}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Room' : 'Rooms'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Check Availability</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </div>

          {/* Trust Metrics */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '36px',
              marginTop: '44px',
              color: '#cbd5e1',
              fontSize: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', color: '#f6c773' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f6c773" />
                ))}
              </div>
              <strong style={{ color: '#fff' }}>4.9/5</strong> (340+ Verified Reviews)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#22c55e" />
              <span>Instant Confirmation & Free Cancellation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#f6c773" />
              <span>Prime Transit Location & Free Parking</span>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Suites Overview */}
      <section style={{ padding: '90px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ color: '#b5832e', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Handcrafted Spaces
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#0a1128', marginBottom: '16px' }}>
            Featured Rooms & Suites
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Tailored to provide restorative sleep, premium luxury amenities, and pristine comfort.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {ROOM_CATEGORIES.slice(0, 3).map((room) => (
            <div
              key={room.id}
              className="interactive-card"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <RoomCardImageSlider
                images={room.images || [room.image]}
                alt={room.name}
                badge={room.badge}
                price={room.basePrice}
              />

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128', marginBottom: '8px' }}>
                  {room.name}
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
                  {room.tagline}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', marginTop: 'auto' }}>
                  {room.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 500,
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => onSelectRoom(room)}
                    className="btn-gold"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    Reserve Now
                  </button>
                  <button
                    onClick={onNavigateToRooms}
                    className="btn-outline-gold"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0a1128',
                      borderColor: '#cbd5e1',
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            onClick={onNavigateToRooms}
            className="btn-primary"
            style={{
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Explore All Accommodations & Suites</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Premium Amenities Section */}
      <section style={{ background: '#0a1128', color: '#ffffff', padding: '90px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ color: '#f6c773', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Why Choose Us
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, marginTop: '8px', marginBottom: '16px' }}>
              Curated Amenities for Unrivaled Comfort
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '640px', margin: '0 auto' }}>
              From fast optical fiber Wi-Fi to round-the-clock room dining, every touchpoint is designed with guest delight in mind.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {HOTEL_AMENITIES.map((item, idx) => (
              <div
                key={idx}
                className="interactive-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '32px 24px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(212, 163, 75, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    color: '#f6c773',
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', color: '#ffffff' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Callout Banner */}
      <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #101f42 0%, #1b2e59 100%)',
            borderRadius: '24px',
            padding: '60px 40px',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            boxShadow: '0 20px 40px -15px rgba(10, 17, 40, 0.25)',
          }}
        >
          <div style={{ maxWidth: '620px' }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: '12px' }}>
              Planning a Business Trip or Family Getaway?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: 1.6 }}>
              Unlock special tariffs, complimentary breakfast, and flexible check-in when booking direct through our portal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigateToRooms()}
              className="btn-gold"
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '15px',
              }}
            >
              Reserve Room Direct
            </button>
            <button
              onClick={onNavigateToContact}
              className="btn-outline-gold"
              style={{
                padding: '16px 28px',
                borderRadius: '12px',
                fontSize: '15px',
              }}
            >
              Contact Reception
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

