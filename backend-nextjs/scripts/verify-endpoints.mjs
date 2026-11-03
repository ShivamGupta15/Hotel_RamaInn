/**
 * Automated Verification Script for Hotel Rama Inn Next.js Backend
 * Tests all migrated API endpoints, authentication, booking initiation, payment verification, and admin workflows.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`Testing: ${name}... `);
    await fn();
    console.log("✅ PASS");
    testsPassed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

async function runTests() {
  console.log(`\n🚀 Starting Next.js Backend Endpoint Verification against: ${BASE_URL}\n`);

  // 1. Health checks
  await test("GET /health (Root Health Check)", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.status === "ok", "Expected status ok");
  });

  await test("GET /api/health", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.status === "ok", "Expected status ok");
  });

  // 2. Rooms API
  await test("GET /api/v1/rooms (Public Rooms List)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/rooms`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data) && data.length > 0, "Expected non-empty array of rooms");
    assert(data[0].base_price_per_night > 0, "Expected positive price");
  });

  await test("GET /api/v1/rooms/deluxe-king-ac (Room Detail)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/rooms/deluxe-king-ac`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.slug === "deluxe-king-ac", `Expected slug deluxe-king-ac, got ${data.slug}`);
    assert(data.name.includes("Deluxe"), "Expected room name");
  });

  await test("GET /api/v1/rooms/deluxe-king-ac/calendar", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/rooms/deluxe-king-ac/calendar?year=2026&month=11`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.days) && data.days.length === 30, `Expected 30 days, got ${data.days?.length}`);
    assert(data.days[0].status, "Expected status on calendar days");
  });

  // 3. Availability Check
  await test("GET /api/v1/availability", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/availability?check_in=2026-11-15&check_out=2026-11-17&adults=2&children=0&rooms=1`
    );
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.total_nights === 2, `Expected 2 nights, got ${data.total_nights}`);
    assert(Array.isArray(data.results) && data.results.length > 0, "Expected available rooms");
  });

  // 4. Booking Initiation Flow
  let bookingId = "";
  let bookingRef = "";
  let orderId = "";

  await test("POST /api/v1/bookings/initiate (Multi-room Booking Flow)", async () => {
    const payload = {
      room_category_id: "deluxe-king-ac",
      check_in: "2026-11-15",
      check_out: "2026-11-17",
      adults: 2,
      children: 0,
      rooms_count: 1,
      guest: {
        name: "Test Verification Guest",
        email: "test.verification@example.com",
        phone: "+91 98765 00000",
        special_requests: "Early checkin requested",
      },
    };

    const res = await fetch(`${BASE_URL}/api/v1/bookings/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert(res.status === 201, `Status ${res.status}`);
    const data = await res.json();
    assert(data.booking_id, "Expected booking_id");
    assert(data.booking_reference, "Expected booking_reference");
    assert(data.gateway_order_id, "Expected gateway_order_id");
    assert(data.final_payable > 0, "Expected positive payable amount");

    bookingId = data.booking_id;
    bookingRef = data.booking_reference;
    orderId = data.gateway_order_id;
  });

  // 5. Booking Lookup
  await test("GET /api/v1/bookings/lookup/[ref] (Guest Lookup)", async () => {
    assert(bookingRef, "No booking reference from initiate step");
    const res = await fetch(`${BASE_URL}/api/v1/bookings/lookup/${bookingRef}`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.booking_reference === bookingRef, "Booking ref mismatch");
    assert(data.status === "PENDING_PAYMENT", `Expected PENDING_PAYMENT, got ${data.status}`);
  });

  // 6. Payment Verification
  await test("POST /api/v1/payments/verify (Client Signature & State Verification)", async () => {
    assert(bookingId && orderId, "Missing booking/order id");
    const payload = {
      booking_id: bookingId,
      gateway_order_id: orderId,
      gateway_payment_id: "pay_test_verified_12345",
      gateway_signature: "mock_signature",
      payment_method: "upi",
    };

    const res = await fetch(`${BASE_URL}/api/v1/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected verification success");
    assert(data.booking_reference === bookingRef, "Ref mismatch");
  });

  // 7. Booking Status check post-payment
  await test("Verify Booking Status Confirmed Post-Payment", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/bookings/lookup/${bookingRef}`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.status === "CONFIRMED", `Expected CONFIRMED, got ${data.status}`);
    assert(data.payment_status === "PAID", `Expected PAID, got ${data.payment_status}`);
  });

  // 8. Admin Authentication
  let adminToken = "";
  await test("POST /api/v1/admin/auth/login (Admin Credentials)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username_or_email: "admin",
        password: "adminpassword123",
      }),
    });

    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.access_token, "Expected access_token");
    assert(data.user?.role === "ADMIN", "Expected ADMIN role");
    adminToken = data.access_token;
  });

  // 9. Admin Dashboard Metrics
  await test("GET /api/v1/admin/metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(typeof data.total_bookings === "number", "Expected total_bookings number");
    assert(typeof data.total_revenue === "number", "Expected total_revenue number");
  });

  // 10. Admin Bookings & Status Workflow
  await test("GET /api/v1/admin/bookings", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/bookings`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data), "Expected array of bookings");
  });

  await test("PATCH /api/admin/bookings/[id]/status (Check-In Workflow)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Name": "Admin Tester",
        "X-User-Role": "ADMIN",
      },
      body: JSON.stringify({ status: "CHECKED_IN" }),
    });
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.booking.status === "CHECKED_IN", `Expected CHECKED_IN, got ${data.booking.status}`);
  });

  // 11. Admin User Management
  await test("GET /api/v1/admin/users", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data) && data.length >= 2, "Expected at least 2 users");
  });

  const testUsername = `staff_${Date.now()}`;
  await test("POST /api/v1/admin/users (Create New Staff User)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Name": "Admin Tester",
        "X-User-Role": "ADMIN",
      },
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@hotelramainn.com`,
        full_name: "Staff Verification Account",
        password: "StaffSecurePass2026",
        role: "STAFF",
      }),
    });
    assert(res.status === 201, `Status ${res.status}`);
    const data = await res.json();
    assert(data.username === testUsername, "Username mismatch");
    assert(!data.password_hash, "password_hash must NOT be exposed in response");
  });

  // 12. Admin Calendar Overrides
  await test("POST /api/v1/admin/rooms/deluxe-king-ac/calendar/override", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/admin/rooms/deluxe-king-ac/calendar/override`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Name": "Admin Tester",
          "X-User-Role": "ADMIN",
        },
        body: JSON.stringify({
          date_from: "2026-11-20",
          date_to: "2026-11-22",
          available_units: 3,
          is_blocked: false,
          price_override: 3499.0,
          notes: "Weekend Tariff",
        }),
      }
    );
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.status === "success", "Expected success");
    assert(data.affected_days === 3, `Expected 3 affected days, got ${data.affected_days}`);
  });

  await test("DELETE /api/v1/admin/rooms/deluxe-king-ac/calendar/override", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/admin/rooms/deluxe-king-ac/calendar/override`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-Name": "Admin Tester",
          "X-User-Role": "ADMIN",
        },
        body: JSON.stringify({
          date_from: "2026-11-20",
          date_to: "2026-11-22",
        }),
      }
    );
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.status === "success", "Expected success");
  });

  // 13. Audit Logging
  await test("GET /api/v1/admin/audit-logs", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/audit-logs?limit=10`);
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data) && data.length > 0, "Expected audit logs");
    assert(data[0].action, "Expected action in log item");
    assert(data[0].timestamp, "Expected timestamp in log item");
  });

  console.log(`\n========================================`);
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log(`========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test suite error:", e);
  process.exit(1);
});

