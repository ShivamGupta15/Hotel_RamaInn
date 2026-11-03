import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryBookings } from "@/lib/availability";
import { releaseHoldKey } from "@/lib/booking-holds";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { sendBookingVoucherEmail } from "@/lib/email";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const razorpaySig = req.headers.get("x-razorpay-signature");

    if (razorpaySig) {
      const valid = verifyRazorpayWebhookSignature(rawBody, razorpaySig);
      if (!valid) {
        return NextResponse.json({ detail: "Invalid signature" }, { status: 400 });
      }

      let eventData: any;
      try {
        eventData = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ detail: "Malformed JSON" }, { status: 400 });
      }

      const eventName = eventData.event;
      if (eventName === "payment.captured") {
        const paymentEntity = eventData.payload?.payment?.entity || {};
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        if (!orderId) {
          return NextResponse.json({ status: "ignored", reason: "No order_id in payload" });
        }

        // Find booking
        let booking: any = null;
        let roomName = "Standard Room";

        if (prisma) {
          try {
            const txn = await prisma.paymentTransaction.findFirst({
              where: { gateway_order_id: orderId },
            });
            if (txn) {
              booking = await prisma.booking.findUnique({
                where: { id: txn.booking_id },
                include: { room_category: true },
              });
              if (booking) {
                roomName = booking.room_category?.name || "Standard Room";
              }
            }
          } catch {
            booking = null;
          }
        }

        if (!booking) {
          booking = inMemoryBookings.find((b) => b.gateway_order_id === orderId);
          if (booking) {
            roomName = booking.room_name || "Deluxe King AC Room";
          }
        }

        if (!booking) {
          return NextResponse.json({ status: "not_found" });
        }

        if (booking.status === "CONFIRMED") {
          return NextResponse.json({ status: "already_confirmed" });
        }

        // Update booking and transaction
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

            await prisma.paymentTransaction.updateMany({
              where: { gateway_order_id: orderId },
              data: {
                gateway_payment_id: paymentId,
                status: "SUCCESS",
                payload: JSON.stringify(eventData),
              },
            });
          } catch (dbErr) {
            console.warn("[Webhook] DB update warning:", dbErr);
          }
        }

        booking.status = "CONFIRMED";
        booking.payment_status = "PAID";
        releaseHoldKey(booking.id);

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
          userName: "Razorpay Webhook",
          userRole: "SYSTEM",
          action: "PAYMENT_CAPTURED_WEBHOOK",
          entityType: "BOOKING",
          entityId: booking.id,
          details: `Webhook payment.captured confirmed reservation ${booking.booking_reference}`,
        });

        return NextResponse.json({ status: "success", booking_reference: booking.booking_reference });
      }

      return NextResponse.json({ status: "ignored", event: eventName });
    }

    // Dev / Test simulation without signature header
    try {
      const eventData = JSON.parse(rawBody);
      const orderId =
        eventData.order_id ||
        eventData.payload?.payment?.entity?.order_id;
      const paymentId = eventData.payment_id || "mock_payment_id";

      if (orderId) {
        let booking = inMemoryBookings.find((b) => b.gateway_order_id === orderId);
        if (booking) {
          booking.status = "CONFIRMED";
          booking.payment_status = "PAID";
          releaseHoldKey(booking.id);
          return NextResponse.json({ status: "success", booking_reference: booking.booking_reference });
        }
      }
    } catch {
      // Fall through
    }

    return NextResponse.json(
      { detail: "Missing signature header (X-Razorpay-Signature)" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Webhook Error]:", err);
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 });
  }
}

