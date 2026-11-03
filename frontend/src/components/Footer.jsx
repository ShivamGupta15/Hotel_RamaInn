import React from 'react';
import { Hotel, Phone, Mail, MapPin, Sparkles, Heart } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{ background: '#0a1128', color: '#cbd5e1', paddingTop: '70px', paddingBottom: '30px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '48px', marginBottom: '56px' }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f6c773 0%, #b5832e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Hotel size={22} color="#0a1128" />
              </div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-serif)' }}>
                Hotel Rama Inn
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              Experience refined modern luxury, superior culinary delights, and pristine hospitality in the heart of the city.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f6c773', fontWeight: 600 }}>
              <Sparkles size={14} />
              <span>Government Approved & Certified 4-Star Stay</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Quick Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Home Page', id: 'home' },
                { label: 'Bookings & Suites', id: 'bookings' },
                { label: 'Contact Reception', id: 'contact' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#f6c773')}
                  onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Direct Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <MapPin size={18} color="#f6c773" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{HOTEL_INFO.address}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Phone size={18} color="#f6c773" style={{ flexShrink: 0 }} />
                <span>{HOTEL_INFO.phone}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Mail size={18} color="#f6c773" style={{ flexShrink: 0 }} />
                <span>{HOTEL_INFO.email}</span>
              </div>
            </div>
          </div>

          {/* Policies & Assurance */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Guest Assurance
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>
              &bull; 100% Secure Checkout via Razorpay & Stripe
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>
              &bull; Free cancellation up to 24 hours prior to check-in
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
              &bull; Instant booking voucher dispatch to your email
            </p>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div
          style={{
            paddingTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#64748b',
            gap: '12px',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} Hotel Rama Inn. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#ef4444" fill="#ef4444" />
            <span>for unparalleled hospitality experiences</span>
            <span style={{ margin: '0 8px', color: '#475569' }}>&bull;</span>
            <button
              onClick={() => onNavigate('admin')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#f6c773')}
              onMouseLeave={(e) => (e.target.style.color = '#64748b')}
            >
              Staff Portal (/admin)
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}

