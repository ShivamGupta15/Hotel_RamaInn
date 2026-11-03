import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryBookings } from "@/lib/availability";

export async function GET(
  req: NextRequest,
  { params }: { params: { ref: string } }
) {
  const ref = params.ref.trim().toUpperCase();

  let booking: any = null;
  let roomName = "Standard Room";

  if (prisma) {
    try {
      booking = await prisma.booking.findUnique({
        where: { booking_reference: ref },
        include: { room_category: true },
      });
      if (booking) {
        roomName = booking.room_category?.name || "Standard Room";
      }
    } catch {
      booking = null;
    }
  }

  if (!booking) {
    booking = inMemoryBookings.find((b) => b.booking_reference === ref);
    if (booking) {
      roomName = booking.room_name || "Deluxe King AC Room";
    }
  }

  if (!booking) {
    return NextResponse.json({ detail: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking_reference: booking.booking_reference,
    guest_name: booking.guest_name,
    room_name: roomName,
    check_in_date: typeof booking.check_in_date === "string" ? booking.check_in_date.split("T")[0] : booking.check_in_date.toISOString().split("T")[0],
    check_out_date: typeof booking.check_out_date === "string" ? booking.check_out_date.split("T")[0] : booking.check_out_date.toISOString().split("T")[0],
    total_nights: booking.total_nights,
    final_payable: Number(booking.final_payable),
    currency: booking.currency || "INR",
    status: booking.status,
    payment_status: booking.payment_status,
  });
}

