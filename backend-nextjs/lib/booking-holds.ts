/**
 * Reservation Holds & Concurrency Mutex
 * Replaces external Redis on Hostinger shared hosting with an efficient
 * in-process mutex and TTL hold tracking, coupled with database hold_expires_at.
 */

import { prisma } from "./prisma";
import { config } from "./config";

// Active in-memory hold set (bookingId -> expiresAt timestamp)
const activeHolds = new Map<string, number>();

// In-process inventory locks (lockKey -> expiration timestamp)
const activeLocks = new Map<string, number>();

export async function acquireReservationLock(
  categoryId: string,
  checkIn: string,
  checkOut: string,
  timeoutSeconds: number = 15
): Promise<() => void> {
  const lockKey = `lock:inventory:${categoryId}:${checkIn}:${checkOut}`;
  const now = Date.now();

  // If locked and not expired, wait briefly
  const existingExp = activeLocks.get(lockKey);
  if (existingExp && existingExp > now) {
    // Wait up to 2 seconds
    const waitStart = Date.now();
    while (activeLocks.has(lockKey) && (activeLocks.get(lockKey) || 0) > Date.now()) {
      if (Date.now() - waitStart > 2000) {
        break;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // Set lock with expiration
  activeLocks.set(lockKey, Date.now() + timeoutSeconds * 1000);

  // Return release function
  return () => {
    activeLocks.delete(lockKey);
  };
}

export function recordHoldKey(bookingId: string, holdSeconds: number = 600): void {
  const expiresAt = Date.now() + holdSeconds * 1000;
  activeHolds.set(bookingId, expiresAt);
}

export function releaseHoldKey(bookingId: string): void {
  activeHolds.delete(bookingId);
}

export function isHoldActive(bookingId: string): boolean {
  const exp = activeHolds.get(bookingId);
  if (!exp) return false;
  if (exp < Date.now()) {
    activeHolds.delete(bookingId);
    return false;
  }
  return true;
}

/**
 * Cleanup expired bookings in the database and in-memory holds.
 * Can be called periodically or on each booking inquiry.
 */
export async function cleanupExpiredBookings(): Promise<number> {
  const now = new Date();

  // Clear expired in-memory holds
  for (const [id, exp] of Array.from(activeHolds.entries())) {
    if (exp <= Date.now()) {
      activeHolds.delete(id);
    }
  }

  if (!prisma) {
    return 0;
  }

  try {
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING_PAYMENT",
        OR: [
          { hold_expires_at: { lte: now } },
          { hold_expires_at: null },
        ],
      },
      select: { id: true },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    const bookingIds = expiredBookings.map((b: any) => b.id);

    // Update bookings to EXPIRED
    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: {
        status: "EXPIRED",
        payment_status: "FAILED",
      },
    });

    // Update pending transactions to FAILED
    await prisma.paymentTransaction.updateMany({
      where: {
        booking_id: { in: bookingIds },
        status: "PENDING",
      },
      data: { status: "FAILED" },
    });

    for (const id of bookingIds) {
      activeHolds.delete(id);
    }

    console.log(`[Cleanup] Expired ${bookingIds.length} stale booking(s):`, bookingIds);
    return bookingIds.length;
  } catch (err) {
    console.warn("[Cleanup] Warning during expired booking cleanup:", err);
    return 0;
  }
}

// Start in-process background cleanup loop every 60 seconds
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    cleanupExpiredBookings().catch(() => {});
  }, 60000);
  if (interval.unref) {
    interval.unref();
  }
}
