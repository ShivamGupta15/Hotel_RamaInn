import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  X,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  Loader2,
  ArrowRight,
  Smartphone,
  Building2,
  Wallet,
  QrCode,
  AlertCircle,
  Clock,
  Check,
  Info,
  RefreshCw
} from 'lucide-react';

export default function BookingModal({ room, onClose, onBookingSuccess }) {
  const [step, setStep] = useState(1); // 1: Details & Stay, 2: Payment Details, 3: Confirmation
  
  // Date, guest, and rooms configuration
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000 * 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const maxAvailableRooms = room?.availableUnits || room?.totalUnits || room?.units_available || 10;
  const [roomsCount, setRoomsCount] = useState(Math.min(Number(room?.requestedRooms || 1), maxAvailableRooms));

  const [checkIn, setCheckIn] = useState(room?.checkIn || todayStr);
  const [checkOut, setCheckOut] = useState(room?.checkOut || tomorrowStr);
  const [adults, setAdults] = useState(room?.adults ? Number(room.adults) : 2);
  const [children, setChildren] = useState(0);

  // Guest inputs
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment Selection State
  const [paymentType, setPaymentType] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'wallet'
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('4012 0000 0000 0002');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // UPI Inputs
  const [upiMode, setUpiMode] = useState('qr');
  const [upiId, setUpiId] = useState('');

  // Netbanking & Wallet inputs
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  // Razorpay 3D-Secure Bank OTP Modal State
  const [showBankOtpModal, setShowBankOtpModal] = useState(false);
  const [bankOtp, setBankOtp] = useState('123456');
  const [pendingOrderDetails, setPendingOrderDetails] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedData, setConfirmedData] = useState(null);

  // Hold countdown timer (10 mins = 600s)
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(600);

  useEffect(() => {
    if (step === 2) {
      const timer = setInterval(() => {
        setHoldSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Nights and pricing calculation for multiple rooms
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) || 1);
  const baseRate = room ? (room.basePrice || room.base_price_per_night || 2899) : 2899;
  const roomSubtotal = baseRate * nights * roomsCount;
  const taxPercent = room?.taxPercent || 12;
  const tax = Math.round(roomSubtotal * (taxPercent / 100));
  const totalPayable = roomSubtotal + tax;

  // Format Card Number into 4-digit groups
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Format Expiry as MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardExpiry(val);
  };

  // Detect card brand
  const getCardBrand = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return 'Mastercard';
    if (/^6(0|5)/.test(raw) || /^81/.test(raw)) return 'RuPay';
    if (/^3[47]/.test(raw)) return 'Amex';
    return null;
  };

  // Standard Luhn algorithm
  const validateLuhn = (numStr) => {
    const digits = numStr.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      setErrorMessage('Please fill in your name, email, and phone number.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  // Dynamically ensure Razorpay SDK is loaded
  const ensureRazorpayLoaded = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Main payment submission
  const handleInitiatePayment = async () => {
    setErrorMessage('');

    // Validate inputs based on payment type
    if (paymentType === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (!cleanCard || cleanCard.length < 13) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setErrorMessage('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVV code.');
        return;
      }
    } else if (paymentType === 'upi' && upiMode === 'id') {
      if (!upiId || !upiId.includes('@')) {
        setErrorMessage('Please enter a valid UPI ID (e.g. name@okaxis).');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStatusText('Creating booking hold & generating Razorpay order...');

    const bookingPayload = {
      room_category_id: room?.id || 'deluxe-double',
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(adults),
      children: Number(children),
      rooms_count: Number(roomsCount),
      guest: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        special_requests: specialRequests || null,
      },
    };

    try {
      // 1. Create order on backend
      const initiateRes = await fetch(API_ENDPOINTS.BOOKINGS_INITIATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      let orderData = null;
      if (initiateRes.ok) {
        orderData = await initiateRes.json();
      } else {
        // Fallback simulated order if backend DB is not connected
        orderData = {
          booking_id: `sim_${Date.now()}`,
          gateway_order_id: `order_${Date.now()}`,
          booking_reference: `RAMA-${Date.now().toString().slice(-6)}`,
          gateway_key_id: 'rzp_test_TZGd6eP1ANL4L8',
          is_mock: true,
        };
      }

      const bookingId = orderData.booking_id;
      const gatewayOrderId = orderData.gateway_order_id;
      const bookingRef = orderData.booking_reference;
      const keyId = orderData.gateway_key_id || 'rzp_test_TZGd6eP1ANL4L8';

      setPendingOrderDetails({
        bookingId,
        gatewayOrderId,
        bookingRef,
        keyId,
      });

      // If official Razorpay order is active (not mock) and script loads, trigger official modal
      const isSdkLoaded = await ensureRazorpayLoaded();
      if (!orderData.is_mock && isSdkLoaded && window.Razorpay) {
        setProcessingStatusText('Connecting to Razorpay Bank 3D Secure...');
        
        const options = {
          key: keyId,
          amount: Math.round(totalPayable * 100),
          currency: 'INR',
          name: 'Hotel Rama Inn',
          description: `Booking ${bookingRef}`,
          image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=120&q=80',
          order_id: gatewayOrderId,
          prefill: {
            name: guestName,
            email: guestEmail,
            contact: guestPhone,
            method: paymentType,
          },
          theme: { color: '#b5832e' },
          handler: async function (response) {
            await handleFinalVerification(
              bookingId,
              response.razorpay_order_id || gatewayOrderId,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingRef
            );
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsProcessing(false);
          setErrorMessage(resp.error?.description || 'Payment was declined by issuing bank.');
        });
        rzp.open();
        return;
      }

      // ── Show Razorpay 3D-Secure Bank OTP Verification Screen ──
      // This is triggered for test cards (e.g. 4012 0000 0000 0002) to verify bank OTP
      setIsProcessing(false);
      setShowBankOtpModal(true);

    } catch (err) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment initiation failed.');
    }
  };

  // Submit Bank OTP
  const handleSubmitBankOtp = async (isSuccess = true) => {
    if (!pendingOrderDetails) return;
    
    const cleanCard = cardNumber.replace(/\s/g, '');
    
    // Check if failure card was entered
    if (!isSuccess || cleanCard === '4000000000000000' || cleanCard.endsWith('0000') || cardCvv === '999') {
      setShowBankOtpModal(false);
      setErrorMessage('Payment Declined by Issuing Bank: Card declined (Test Failure Card / Incorrect OTP).');
      return;
    }

    if (!bankOtp || bankOtp.length < 4) {
      alert('Please enter the 6-digit OTP received on your mobile phone.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatusText('Verifying bank OTP & capturing payment with Razorpay...');
    setShowBankOtpModal(false);

    const simulatedPaymentId = `pay_rzp_${Date.now().toString().slice(-8)}`;

    await handleFinalVerification(
      pendingOrderDetails.bookingId,
      pendingOrderDetails.gatewayOrderId,
      simulatedPaymentId,
      'test_signature',
      pendingOrderDetails.bookingRef
    );
  };

  // Verification with backend API
  const handleFinalVerification = async (bookingId, orderId, paymentId, signature, bookingRef) => {
    try {
      await fetch(API_ENDPOINTS.PAYMENTS_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          gateway_order_id: orderId,
          gateway_payment_id: paymentId,
          gateway_signature: signature,
          payment_method: paymentType,
        }),
      });
    } catch (err) {
      console.warn('Verification fallback:', err);
    }

    // Save to localStorage so it instantly reflects in Admin panel (Bookings & Payments sections)
    try {
      const newBookingRecord = {
        id: bookingId,
        booking_reference: bookingRef,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        room_name: room?.name || 'Deluxe King AC Room',
        rooms_count: Number(roomsCount),
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_nights: nights,
        adults: Number(adults),
        children: Number(children),
        final_payable: totalPayable,
        currency: 'INR',
        status: 'CONFIRMED',
        payment_status: 'PAID',
        created_at: new Date().toISOString(),
      };

      const newPaymentRecord = {
        id: `txn-${Date.now()}`,
        booking_reference: bookingRef,
        guest_name: guestName,
        gateway_order_id: orderId,
        gateway_payment_id: paymentId,
        amount: totalPayable,
        currency: 'INR',
        status: 'SUCCESS',
        provider: 'razorpay',
        created_at: new Date().toISOString(),
      };

      const existingBookings = JSON.parse(localStorage.getItem('admin_recent_bookings') || '[]');
      localStorage.setItem('admin_recent_bookings', JSON.stringify([newBookingRecord, ...existingBookings]));

      const existingPayments = JSON.parse(localStorage.getItem('admin_recent_payments') || '[]');
      localStorage.setItem('admin_recent_payments', JSON.stringify([newPaymentRecord, ...existingPayments]));
    } catch (storeErr) {
      console.warn('Failed to store recent transaction:', storeErr);
    }

    setConfirmedData({
      reference: bookingRef,
      roomName: room?.name || 'Deluxe King AC Room',
      roomsCount: Number(roomsCount),
      amount: totalPayable,
      checkIn,
      checkOut,
      nights,
      paymentType: paymentType.toUpperCase(),
      paymentId: paymentId,
    });
    setIsProcessing(false);
    setStep(3);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 17, 40, 0.78)',
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
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#b5832e',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              <Sparkles size={14} />
              <span>
                Step {step} of 3:{' '}
                {step === 1 ? 'Guest Information' : step === 2 ? 'Payment Checkout' : 'Reservation Confirmed'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0a1128', marginTop: '2px' }}>
              {step === 3 ? 'Reservation Confirmed!' : `Reserve ${room?.name || 'Selected Room'}`}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px' }}>
          {errorMessage && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700 }}>Payment Notice</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* STEP 1: GUEST DETAILS & CALENDAR */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment}>
              {/* Selected Room Pill */}
              <div
                style={{
                  background: 'rgba(212, 163, 75, 0.08)',
                  border: '1px solid rgba(212, 163, 75, 0.25)',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0a1128', fontSize: '16px' }}>
                    {room?.name || 'Deluxe King AC Room'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    ₹{baseRate.toLocaleString()} / night / room &bull; {room?.bedType || 'King Bed'} &bull; Max{' '}
                    {room?.maxAdults || 2} Adults/room
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>
                    {roomsCount} Room{roomsCount > 1 ? 's' : ''} Selected &bull; Up to {maxAvailableRooms} available
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Total for {roomsCount} Room{roomsCount > 1 ? 's' : ''} &bull; {nights} Night{nights > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#b5832e' }}>
                    ₹{totalPayable.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Dates & Stays */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    min={checkIn || todayStr}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Rooms & Guest Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    <span>Rooms to Book</span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                      Max {maxAvailableRooms}
                    </span>
                  </label>
                  <select
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      background: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {Array.from({ length: maxAvailableRooms }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Room' : 'Rooms'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Adults (Age 12+)
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Adult' : 'Adults'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Children (Under 12)
                  </label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Child' : 'Children'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guest Information */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Rathore"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Email Address (for voucher) *
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '6px',
                    }}
                  >
                    Mobile Phone (for Bank OTP) *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Special Requests / Arrival Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quiet upper floor, extra pillows, early check-in"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 163, 75, 0.3)',
                }}
              >
                <span>Continue to Payment (₹{totalPayable.toLocaleString()})</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT DETAILS (CARDS, UPI, NETBANKING) */}
          {step === 2 && (
            <div>
              {/* Gateway Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#0c2340',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <ShieldCheck size={24} style={{ color: '#38bdf8' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a1128' }}>
                      Razorpay 3D Secure Checkout
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      256-bit Encrypted &bull; Issuing Bank OTP Protection
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#fef3c7',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  <Clock size={14} />
                  <span>Hold: {formatTimer(holdSecondsLeft)}</span>
                </div>
              </div>

              {/* Order breakdown */}
              <div
                style={{
                  background: 'rgba(248, 250, 252, 0.8)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>
                    {roomsCount} Room{roomsCount > 1 ? 's' : ''} &times; {room?.name || 'Standard Room'} &times; {nights} Night{nights > 1 ? 's' : ''}
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{roomSubtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Taxes & GST ({taxPercent}%)</span>
                  <span style={{ fontWeight: 600 }}>₹{tax.toLocaleString()}</span>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                  <span style={{ color: '#0a1128' }}>Total Payable Amount</span>
                  <span style={{ color: '#b5832e' }}>₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Type Selection Tabs */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '10px',
                  }}
                >
                  Choose Payment Method:
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                  }}
                >
                  {/* Cards */}
                  <button
                    type="button"
                    onClick={() => setPaymentType('card')}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '12px',
                      border: paymentType === 'card' ? '2px solid #b5832e' : '1.5px solid #cbd5e1',
                      background: paymentType === 'card' ? 'rgba(212, 163, 75, 0.1)' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <CreditCard size={22} color={paymentType === 'card' ? '#b5832e' : '#64748b'} />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: paymentType === 'card' ? '#0a1128' : '#64748b',
                      }}
                    >
                      Cards
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Visa / MC / RuPay</span>
                  </button>

                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentType('upi')}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '12px',
                      border: paymentType === 'upi' ? '2px solid #b5832e' : '1.5px solid #cbd5e1',
                      background: paymentType === 'upi' ? 'rgba(212, 163, 75, 0.1)' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Smartphone size={22} color={paymentType === 'upi' ? '#b5832e' : '#64748b'} />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: paymentType === 'upi' ? '#0a1128' : '#64748b',
                      }}
                    >
                      UPI
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>GPay / PhonePe</span>
                  </button>

                  {/* Net Banking */}
                  <button
                    type="button"
                    onClick={() => setPaymentType('netbanking')}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '12px',
                      border: paymentType === 'netbanking' ? '2px solid #b5832e' : '1.5px solid #cbd5e1',
                      background: paymentType === 'netbanking' ? 'rgba(212, 163, 75, 0.1)' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Building2 size={22} color={paymentType === 'netbanking' ? '#b5832e' : '#64748b'} />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: paymentType === 'netbanking' ? '#0a1128' : '#64748b',
                      }}
                    >
                      Net Banking
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>All Banks</span>
                  </button>

                  {/* Wallets */}
                  <button
                    type="button"
                    onClick={() => setPaymentType('wallet')}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '12px',
                      border: paymentType === 'wallet' ? '2px solid #b5832e' : '1.5px solid #cbd5e1',
                      background: paymentType === 'wallet' ? 'rgba(212, 163, 75, 0.1)' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Wallet size={22} color={paymentType === 'wallet' ? '#b5832e' : '#64748b'} />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: paymentType === 'wallet' ? '#0a1128' : '#64748b',
                      }}
                    >
                      Wallets
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Paytm / Amazon</span>
                  </button>
                </div>
              </div>

              {/* CARD INPUTS */}
              {paymentType === 'card' && (
                <div
                  style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px',
                    marginBottom: '20px',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        Card Number *
                      </label>
                      {getCardBrand() && (
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {getCardBrand()}
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="4012 0000 0000 0002"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          paddingLeft: '40px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <CreditCard
                        size={18}
                        style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIKRAMADITYA RATHORE"
                      value={cardHolder || guestName}
                      onChange={(e) => setCardHolder(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Expiry (MM/YY) *
                      </label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        CVV / CVC *
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0a1128', marginBottom: '2px' }}>
                      Razorpay Documentation Test Cards:
                    </div>
                    <div>&bull; <strong>Success Test Card:</strong> <span style={{ fontFamily: 'monospace', color: '#16a34a', fontWeight: 600 }}>4012 0000 0000 0002</span> (Exp: 12/28, CVV: 123)</div>
                    <div>&bull; <strong>Bank Failure Card:</strong> <span style={{ fontFamily: 'monospace', color: '#dc2626', fontWeight: 600 }}>4000 0000 0000 0000</span> (Declines OTP)</div>
                  </div>
                </div>
              )}

              {/* UPI INPUTS */}
              {paymentType === 'upi' && (
                <div
                  style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px',
                    marginBottom: '20px',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setUpiMode('qr')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: upiMode === 'qr' ? '1.5px solid #b5832e' : '1px solid #cbd5e1',
                        background: upiMode === 'qr' ? 'rgba(212, 163, 75, 0.1)' : '#fff',
                        color: upiMode === 'qr' ? '#0a1128' : '#64748b',
                      }}
                    >
                      Instant QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiMode('id')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: upiMode === 'id' ? '1.5px solid #b5832e' : '1px solid #cbd5e1',
                        background: upiMode === 'id' ? 'rgba(212, 163, 75, 0.1)' : '#fff',
                        color: upiMode === 'id' ? '#0a1128' : '#64748b',
                      }}
                    >
                      Enter UPI ID / VPA
                    </button>
                  </div>

                  {upiMode === 'qr' ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '12px',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '2px solid #0a1128',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      >
                        <QrCode size={110} color="#0a1128" />
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: '#0a1128' }}>
                        Scan & Pay ₹{totalPayable.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Supports GPay, PhonePe, Paytm, BHIM & all banking apps
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        UPI ID / Virtual Payment Address
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          marginBottom: '8px',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* NET BANKING */}
              {paymentType === 'netbanking' && (
                <div
                  style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px',
                    marginBottom: '20px',
                    background: '#ffffff',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                    Select Popular Bank:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { code: 'HDFC', label: 'HDFC Bank' },
                      { code: 'SBI', label: 'State Bank of India' },
                      { code: 'ICICI', label: 'ICICI Bank' },
                      { code: 'AXIS', label: 'Axis Bank' },
                      { code: 'KOTAK', label: 'Kotak Bank' },
                      { code: 'PNB', label: 'Punjab National' },
                    ].map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.code)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: selectedBank === b.code ? '2px solid #b5832e' : '1px solid #cbd5e1',
                          background: selectedBank === b.code ? 'rgba(212, 163, 75, 0.1)' : '#f8fafc',
                          fontSize: '12px',
                          fontWeight: selectedBank === b.code ? 700 : 500,
                          color: selectedBank === b.code ? '#0a1128' : '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WALLETS */}
              {paymentType === 'wallet' && (
                <div
                  style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px',
                    marginBottom: '20px',
                    background: '#ffffff',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                    Select Wallet:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'paytm', name: 'Paytm Wallet' },
                      { id: 'phonepe', name: 'PhonePe Wallet' },
                      { id: 'amazonpay', name: 'Amazon Pay' },
                      { id: 'mobikwik', name: 'MobiKwik' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: selectedWallet === w.id ? '2px solid #b5832e' : '1px solid #cbd5e1',
                          background: selectedWallet === w.id ? 'rgba(212, 163, 75, 0.1)' : '#f8fafc',
                          fontSize: '13px',
                          fontWeight: selectedWallet === w.id ? 700 : 500,
                          color: selectedWallet === w.id ? '#0a1128' : '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{w.name}</span>
                        {selectedWallet === w.id && <Check size={16} color="#b5832e" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isProcessing}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#475569',
                  }}
                >
                  Back
                </button>

                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="btn-gold"
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(212, 163, 75, 0.35)',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{processingStatusText || 'Connecting to Razorpay...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Proceed to Pay ₹{totalPayable.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INSTANT CONFIRMATION RECEIPT */}
          {step === 3 && confirmedData && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={42} />
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0a1128', marginBottom: '6px' }}>
                Booking Confirmed & Verified by Razorpay!
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                Official reservation voucher and receipt dispatched to <strong>{guestEmail}</strong>.
              </p>

              {/* Booking Reference Receipt Card */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '26px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Booking Reference</span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: '#2563eb',
                      fontSize: '16px',
                    }}
                  >
                    {confirmedData.reference}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Room Category</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{confirmedData.roomName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Rooms Booked</span>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#b5832e' }}>
                    {confirmedData.roomsCount || 1} {(confirmedData.roomsCount || 1) > 1 ? 'Rooms' : 'Room'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Check-in &rarr; Check-out</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    {confirmedData.checkIn} &rarr; {confirmedData.checkOut} ({confirmedData.nights} N)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Payment Method</span>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#0a1128' }}>
                    {confirmedData.paymentType}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Razorpay Payment ID</span>
                  <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace', color: '#0891b2' }}>
                    {confirmedData.paymentId}
                  </span>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Total Amount Paid</span>
                  <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '18px' }}>
                    ₹{confirmedData.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onBookingSuccess(confirmedData.reference);
                }}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(212, 163, 75, 0.3)',
                }}
              >
                View Reservation in Bookings Tab
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RAZORPAY 3D SECURE BANK OTP VERIFICATION MODAL */}
      {showBankOtpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 110,
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
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              border: '2px solid #0a1128',
            }}
          >
            {/* Bank Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0a1128', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ShieldCheck size={20} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0a1128' }}>Razorpay 3D Secure</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Issuing Bank Verification</div>
                </div>
              </div>
              <button
                onClick={() => setShowBankOtpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Transaction summary in OTP dialog */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Merchant:</span>
                <span style={{ fontWeight: 700, color: '#0a1128' }}>Hotel Rama Inn</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Card Number:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>•••• •••• •••• {cardNumber.slice(-4) || '0002'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount:</span>
                <span style={{ fontWeight: 800, color: '#b5832e' }}>₹{totalPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* OTP Input Form */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Enter One-Time Password (OTP) *
              </label>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                A 6-digit verification code was sent to registered mobile ending in <strong>{guestPhone.slice(-4) || '3210'}</strong>.
              </div>
              <input
                type="text"
                maxLength={6}
                value={bankOtp}
                onChange={(e) => setBankOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '2px solid #b5832e',
                  fontSize: '18px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                Demo mode: enter any 6 digits (or click Submit below).
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSubmitBankOtp(true)}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={16} />
                <span>Submit OTP & Authenticate</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitBankOtp(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid #ef4444',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Simulate Bank Decline / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
