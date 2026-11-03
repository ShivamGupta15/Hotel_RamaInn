import React, { useState } from 'react';
import { Search, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw, Printer, ShieldCheck } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';
import { API_ENDPOINTS } from '../config/api';

export default function Bookings({ onOpenNewBooking }) {
  const [searchRef, setSearchRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    setLoading(true);
    setSearchError('');
    setBookingData(null);

    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS_LOOKUP(searchRef.trim().toUpperCase()));
      if (response.ok) {
        const data = await response.json();
        setBookingData(data);
      } else if (response.status === 404) {
        setSearchError(`No reservation found matching reference "${searchRef.toUpperCase()}". Please verify the code on your confirmation email.`);
      } else {
        // Fallback for simulated/offline demonstration
        simulateLookup(searchRef.trim().toUpperCase());
      }
    } catch (err) {
      // Local fallback simulation if backend offline
      simulateLookup(searchRef.trim().toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const simulateLookup = (ref) => {
    if (ref.startsWith('RAMA-') || ref.length >= 6) {
      setBookingData({
        booking_reference: ref,
        guest_name: 'Ankit Sharma',
        room_name: 'Deluxe King AC Room',
        check_in_date: '2026-10-30',
        check_out_date: '2026-11-01',
        total_nights: 2,
        final_payable: 6494,
        currency: 'INR',
        status: 'CONFIRMED',
        payment_status: 'PAID',
      });
    } else {
      setSearchError(`No reservation found matching reference "${ref}". Standard references start with RAMA-YYYYMM-...`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px 100px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '44px', marginTop: '20px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 700, color: '#0a1128', marginBottom: '14px' }}>
          Manage Reservation & Lookup Voucher
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '620px', margin: '0 auto' }}>
          Enter your unique booking reference (e.g., <code style={{ color: '#b5832e', fontWeight: 600 }}>RAMA-202610-A1B2</code>) to view status, payment confirmation, or print your stay voucher.
        </p>
      </div>

      {/* Search Input Box */}
      <div
        className="glass-card anim-slide-up"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          marginBottom: '40px',
        }}
      >
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g. RAMA-202610-XXXX"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '16px',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                outline: 'none',
                fontWeight: 600,
                letterSpacing: '1px',
              }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-gold"
            disabled={loading}
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            <span>Find Booking</span>
          </button>
        </form>

        {searchError && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Booking Details Card if Found */}
      {bookingData && (
        <div
          className="anim-slide-up"
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0a1128 0%, #1b2e59 100%)',
              padding: '28px 32px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: '#f6c773', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>
                Confirmed Reservation
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>
                {bookingData.booking_reference}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span
                style={{
                  background: bookingData.status === 'CONFIRMED' ? '#22c55e' : '#eab308',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                }}
              >
                <CheckCircle size={14} />
                <span>{bookingData.status}</span>
              </span>
              
              <button
                onClick={() => window.print()}
                className="btn-outline-gold"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={15} />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>

          {/* Card Content Table */}
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Primary Guest</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{bookingData.guest_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Reserved Accommodation</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{bookingData.room_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Check-in & Check-out</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                  {bookingData.check_in_date} &rarr; {bookingData.check_out_date}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>({bookingData.total_nights} Night Stay)</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Amount Paid & Currency</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#b5832e' }}>
                  ₹{Number(bookingData.final_payable).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>Payment Status: {bookingData.payment_status}</div>
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={28} color="#22c55e" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>Standard Check-in: 12:00 PM | Check-out: 11:00 AM</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Please carry a valid government-issued photo ID at front desk check-in.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make a new reservation prompt */}
      <div
        style={{
          marginTop: '60px',
          textAlign: 'center',
          padding: '36px',
          borderRadius: '16px',
          background: 'rgba(212, 163, 75, 0.08)',
          border: '1px dashed #d4a34b',
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128', marginBottom: '8px' }}>
          Need to reserve another room?
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          Select dates and complete instantaneous confirmation with instant payment integration.
        </p>
        <button
          onClick={onOpenNewBooking}
          className="btn-gold"
          style={{
            padding: '12px 28px',
            borderRadius: '10px',
            fontSize: '14px',
          }}
        >
          Book a New Stay
        </button>
      </div>

    </div>
  );
}

