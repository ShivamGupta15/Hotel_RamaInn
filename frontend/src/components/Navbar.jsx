import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, CalendarCheck, Hotel, Sparkles } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';

export default function Navbar({ activePage, setActivePage, onOpenBookingModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        background: scrolled ? 'rgba(10, 17, 40, 0.94)' : 'rgba(10, 17, 40, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: scrolled ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
          
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f6c773 0%, #b5832e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(212, 163, 75, 0.3)',
              }}
            >
              <Hotel size={24} color="#0a1128" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Hotel Rama Inn
                <Sparkles size={14} color="#f6c773" />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Luxury & Hospitality
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-nav">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#f6c773' : '#cbd5e1',
                    position: 'relative',
                    padding: '8px 0',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        width: '100%',
                        height: '2px',
                        background: 'linear-gradient(90deg, #f6c773, #d4a34b)',
                        borderRadius: '2px',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'none', alignItems: 'center', gap: '16px' }} className="desktop-actions">
            <a
              href={`tel:${HOTEL_INFO.phone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#e2e8f0',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              <Phone size={15} color="#f6c773" />
              <span>{HOTEL_INFO.phone}</span>
            </a>

            <button
              onClick={onOpenBookingModal}
              className="btn-gold"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontSize: '14px',
              }}
            >
              <CalendarCheck size={16} />
              <span>Book Stay</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-toggle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: '#0a1128',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px 24px 30px',
            animation: 'fadeInSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  background: activePage === item.id ? 'rgba(212, 163, 75, 0.12)' : 'none',
                  border: 'none',
                  color: activePage === item.id ? '#f6c773' : '#e2e8f0',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: activePage === item.id ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{item.label}</span>
                {activePage === item.id && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f6c773' }} />}
              </button>
            ))}

            <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBookingModal();
                }}
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
                <CalendarCheck size={18} />
                <span>Reserve a Room Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}

