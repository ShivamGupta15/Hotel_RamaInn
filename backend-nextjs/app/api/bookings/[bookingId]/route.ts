import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryBookings } from "@/lib/availability";

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  let booking: any = null;

  if (prisma) {
    try {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room_category: true, transactions: true },
      });
    } catch {
      booking = null;
    }
  }

  if (!booking) {
    booking = inMemoryBookings.find((b) => b.id === bookingId);
  }

  if (!booking) {
    return NextResponse.json({ detail: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    booking_reference: booking.booking_reference,
    room_category_id: booking.room_category_id,
    check_in_date: typeof booking.check_in_date === "string" ? booking.check_in_date.split("T")[0] : booking.check_in_date.toISOString().split("T")[0],
    check_out_date: typeof booking.check_out_date === "string" ? booking.check_out_date.split("T")[0] : booking.check_out_date.toISOString().split("T")[0],
    total_nights: booking.total_nights,
    rooms_count: booking.rooms_count || 1,
    adults: booking.adults,
    children: booking.children,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    special_requests: booking.special_requests,
    expected_checkin_time: booking.expected_checkin_time,
    price_per_night: Number(booking.price_per_night),
    room_total: Number(booking.room_total),
    tax_amount: Number(booking.tax_amount),
    final_payable: Number(booking.final_payable),
    currency: booking.currency || "INR",
    status: booking.status,
    payment_status: booking.payment_status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    hold_expires_at: booking.hold_expires_at,
  });
}

