import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryBookings } from "@/lib/availability";
import { releaseHoldKey } from "@/lib/booking-holds";
import {
  verifyRazorpaySignature,
  fetchAndValidatePayment,
} from "@/lib/razorpay";
import { sendBookingVoucherEmail } from "@/lib/email";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      booking_id,
      gateway_order_id,
      gateway_payment_id,
      gateway_signature,
      payment_method,
    } = payload;

    if (!booking_id || !gateway_order_id || !gateway_payment_id || !gateway_signature) {
      return NextResponse.json(
        { detail: "Missing required verification fields" },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic signature
    const valid = verifyRazorpaySignature(
      gateway_order_id,
      gateway_payment_id,
      gateway_signature
    );

    if (!valid) {
      return NextResponse.json(
        { detail: "Razorpay payment signature verification failed" },
        { status: 400 }
      );
    }

    // Find booking
    let booking: any = null;
    let roomName = "Standard Room";

    if (prisma) {
      try {
        booking = await prisma.booking.findUnique({
          where: { id: booking_id },
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
      booking = inMemoryBookings.find((b) => b.id === booking_id);
      if (booking) {
        roomName = booking.room_name || "Deluxe King AC Room";
      }
    }

    if (!booking) {
      return NextResponse.json({ detail: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        booking_reference: booking.booking_reference,
        message: "Booking already confirmed",
      });
    }

    // 2. Server-side validation directly with Razorpay API
    const { isValid, payment, error } = await fetchAndValidatePayment(
      gateway_payment_id,
      gateway_order_id,
      Number(booking.final_payable)
    );

    if (!isValid) {
      return NextResponse.json(
        { detail: `Razorpay server validation failed: ${error}` },
        { status: 400 }
      );
    }

    const verifiedMethod = payment?.method || payment_method || "razorpay";

    // 3. Mark booking CONFIRMED & PAID
    if (prisma) {
      try {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            payment_status: "PAID",
            hold_expires_at: null,
          },
        });

        // Update payment transaction
        await prisma.paymentTransaction.updateMany({
          where: {
            booking_id: booking.id,
            gateway_order_id: gateway_order_id,
          },
          data: {
            gateway_payment_id: gateway_payment_id,
            gateway_signature: gateway_signature,
            status: "SUCCESS",
            payload: JSON.stringify(payment || { method: verifiedMethod }),
          },
        });
      } catch (dbErr) {
        console.warn("[Payments Verify] Database update warning:", dbErr);
      }
    }

    booking.status = "CONFIRMED";
    booking.payment_status = "PAID";
    booking.hold_expires_at = null;

    // 4. Release hold key
    releaseHoldKey(booking.id);

    // 5. Send confirmation voucher email (asynchronous)
    sendBookingVoucherEmail({
      booking_reference: booking.booking_reference,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      room_name: roomName,
      check_in_date: typeof booking.check_in_date === "string" ? booking.check_in_date.split("T")[0] : booking.check_in_date.toISOString().split("T")[0],
      check_out_date: typeof booking.check_out_date === "string" ? booking.check_out_date.split("T")[0] : booking.check_out_date.toISOString().split("T")[0],
      total_nights: booking.total_nights,
      adults: booking.adults,
      children: booking.children,
      final_payable: Number(booking.final_payable),
      currency: booking.currency || "INR",
    }).catch((e) => console.error("[Voucher Email Error]:", e));

    await recordAuditLog({
      userName: "Razorpay Gateway",
      userRole: "SYSTEM",
      action: "PAYMENT_CONFIRMED",
      entityType: "BOOKING",
      entityId: booking.id,
      details: `Payment confirmed for ${booking.booking_reference} (₹${booking.final_payable}) via ${verifiedMethod.toUpperCase()}`,
    });

    return NextResponse.json({
      success: true,
      booking_reference: booking.booking_reference,
      message: `Payment verified via Razorpay (${verifiedMethod.toUpperCase()}) and booking confirmed`,
    });
  } catch (err: any) {
    console.error("[Payment Verification Error]:", err);
    return NextResponse.json({ detail: err?.message || "Verification failed" }, { status: 500 });
  }
}

