import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px 100px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '56px', marginTop: '20px' }}>
        <span style={{ color: '#b5832e', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
          Connect With Our Concierge
        </span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#0a1128', marginBottom: '16px' }}>
          Contact Hotel Rama Inn
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '640px', margin: '0 auto' }}>
          Whether you require airport transfer arrangements, corporate event booking, or personalized requests, our front desk is here 24 hours a day.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px' }}>
        
        {/* Left Info Column */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div
              className="interactive-card"
              style={{
                background: '#ffffff',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
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
                  color: '#b5832e',
                  flexShrink: 0,
                }}
              >
                <MapPin size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a1128', marginBottom: '6px' }}>
                  Property Location
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                  {HOTEL_INFO.address}
                </p>
                <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>
                  Landmark: 5 minutes from Central Railway Station
                </p>
              </div>
            </div>

            <div
              className="interactive-card"
              style={{
                background: '#ffffff',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
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
                  color: '#b5832e',
                  flexShrink: 0,
                }}
              >
                <Phone size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a1128', marginBottom: '6px' }}>
                  Direct Phone Lines
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                  Front Desk: <strong>{HOTEL_INFO.phone}</strong>
                </p>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                  Reservations: +91 98765 43211
                </p>
              </div>
            </div>

            <div
              className="interactive-card"
              style={{
                background: '#ffffff',
                padding: '28px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
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
                  color: '#b5832e',
                  flexShrink: 0,
                }}
              >
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a1128', marginBottom: '6px' }}>
                  Check-in / Check-out Timings
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Standard Check-in: <strong>{HOTEL_INFO.checkIn}</strong>
                </p>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Standard Check-out: <strong>{HOTEL_INFO.checkOut}</strong>
                </p>
                <p style={{ fontSize: '12px', color: '#b5832e', marginTop: '6px', fontWeight: 600 }}>
                  Early check-in & late check-out available upon request
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Contact Form */}
        <div
          className="anim-slide-up"
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0a1128', marginBottom: '6px' }}>
              Send an Instant Message
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Our guest relations manager typically responds in under 15 minutes.
            </p>
          </div>

          {submitted ? (
            <div
              style={{
                padding: '36px',
                textAlign: 'center',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                color: '#166534',
              }}
            >
              <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Message Received!</h3>
              <p style={{ fontSize: '14px', color: '#15803d' }}>
                Thank you for contacting Hotel Rama Inn. Our concierge has been alerted and will reach back out via phone or email promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="General Inquiry">General Room Inquiry</option>
                  <option value="Airport Transfer">Airport / Train Station Chauffeur</option>
                  <option value="Corporate Booking">Corporate / Group Bookings</option>
                  <option value="Event Banquet">Banquets & Event Hall</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Your Message or Special Request *
                </label>
                <textarea
                  rows={4}
                  placeholder="How may our hospitality team assist you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-gold"
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send size={16} />
                <span>Transmit Message to Reception</span>
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}

