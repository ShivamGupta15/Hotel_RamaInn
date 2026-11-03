import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryBookings } from "@/lib/availability";
import { releaseHoldKey } from "@/lib/booking-holds";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const { status, payment_status, admin_notes } = body;

    let booking: any = null;

    if (prisma) {
      try {
        booking = await prisma.booking.findFirst({
          where: {
            OR: [
              { id: bookingId },
              { booking_reference: bookingId.toUpperCase() },
            ],
          },
        });

        if (booking) {
          const updateData: any = {};
          if (status) updateData.status = status;
          if (payment_status) updateData.payment_status = payment_status;
          if (["CANCELLED", "EXPIRED"].includes(status)) {
            updateData.hold_expires_at = null;
          }

          booking = await prisma.booking.update({
            where: { id: booking.id },
            data: updateData,
            include: { room_category: true },
          });
        }
      } catch (dbErr) {
        console.warn("[Admin Booking Status] DB update warning:", dbErr);
      }
    }

    if (!booking) {
      booking = inMemoryBookings.find(
        (b) => b.id === bookingId || b.booking_reference === bookingId.toUpperCase()
      );
      if (booking) {
        if (status) booking.status = status;
        if (payment_status) booking.payment_status = payment_status;
      }
    }

    if (!booking) {
      return NextResponse.json({ detail: "Booking not found" }, { status: 404 });
    }

    if (["CANCELLED", "EXPIRED"].includes(status)) {
      releaseHoldKey(booking.id);
    }

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "BOOKING_STATUS_UPDATE",
      entityType: "BOOKING",
      entityId: booking.id,
      details: `Updated booking ${booking.booking_reference}: status=${status || "unchanged"}, payment=${payment_status || "unchanged"}${admin_notes ? ` | Notes: ${admin_notes}` : ""}`,
    });

    return NextResponse.json({
      status: "success",
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        status: booking.status,
        payment_status: booking.payment_status,
      },
      message: `Booking ${booking.booking_reference} status updated to ${status}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

