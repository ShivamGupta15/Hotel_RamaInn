import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import ContactUs from './pages/ContactUs';
import Admin from './pages/Admin';
import BookingModal from './components/BookingModal';

export default function App() {
  const getInitialPage = () => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/admin/' || window.location.hash === '#/admin') {
      return 'admin';
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState(getInitialPage);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState(null);

  // Sync browser URL with routing history
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/' || window.location.hash === '#/admin') {
        setActivePage('admin');
      } else {
        setActivePage('home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (pageId) => {
    setActivePage(pageId);
    if (pageId === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBookingModal = (room = null) => {
    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
  };

  const handleSelectRoomFromCatalog = (room) => {
    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
  };

  const handleNavigateToRooms = (criteria = null) => {
    if (criteria) setSearchCriteria(criteria);
    navigateTo('bookings');
  };

  const handleBookingSuccess = (reference) => {
    navigateTo('bookings');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        onOpenBookingModal={() => handleOpenBookingModal(null)}
      />

      {/* Main Page Body with Transitions */}
      <main style={{ flex: 1 }}>
        {activePage === 'home' && (
          <Home
            onSelectRoom={handleSelectRoomFromCatalog}
            onNavigateToRooms={handleNavigateToRooms}
            onNavigateToContact={() => {
              navigateTo('contact');
            }}
          />
        )}

        {(activePage === 'bookings' || activePage === 'rooms') && (
          <Rooms
            onSelectRoom={handleSelectRoomFromCatalog}
            searchCriteria={searchCriteria}
          />
        )}

        {activePage === 'contact' && (
          <ContactUs />
        )}

        {activePage === 'admin' && (
          <Admin onExitAdmin={() => navigateTo('home')} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Global Booking & Checkout Modal */}
      {isBookingModalOpen && (
        <BookingModal
          room={selectedRoomForBooking}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

    </div>
  );
}

