import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import {
  generateBookingReference,
  isRoomAvailable,
  inMemoryBookings,
} from "@/lib/availability";
import { acquireReservationLock, recordHoldKey } from "@/lib/booking-holds";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const {
      room_category_id,
      check_in,
      check_out,
      adults = 1,
      children = 0,
      rooms_count = 1,
      guest,
    } = payload;

    if (!room_category_id || !check_in || !check_out || !guest?.name || !guest?.email || !guest?.phone) {
      return NextResponse.json(
        { detail: "Missing required booking initiation fields" },
        { status: 422 }
      );
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return NextResponse.json(
        { detail: "check_out must be strictly after check_in" },
        { status: 422 }
      );
    }

    const roomsCountNum = Math.max(1, Number(rooms_count) || 1);

    // 1. Acquire mutex lock
    const releaseLock = await acquireReservationLock(
      String(room_category_id),
      check_in,
      check_out,
      15
    );

    try {
      // 2. Check room availability
      const { available, unitsLeft, category } = await isRoomAvailable({
        roomCategoryId: String(room_category_id),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        requestedRooms: roomsCountNum,
      });

      if (!available || unitsLeft < roomsCountNum) {
        return NextResponse.json(
          {
            detail: `Only ${unitsLeft} room unit(s) available for ${category?.name || "this room"} on the requested dates (requested ${roomsCountNum}).`,
          },
          { status: 409 }
        );
      }

      // 3. Pricing calculation
      const totalNights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
      const basePrice = Number(category.base_price_per_night);
      const taxPercent = Number(category.tax_percent || 12.0);
      const roomTotal = basePrice * totalNights * roomsCountNum;
      const taxAmount = Math.round((roomTotal * taxPercent) / 100 * 100) / 100;
      const finalPayable = roomTotal + taxAmount;

      // 4. Timestamps & Reference
      const ref = generateBookingReference(checkInDate);
      const now = new Date();
      const holdExpiresAt = new Date(now.getTime() + config.bookingHoldMinutes * 60 * 1000);
      const bookingId = uuidv4();

      // 5. Razorpay Order Generation
      const orderMeta = await createRazorpayOrder(finalPayable, ref, {
        booking_id: bookingId,
        guest_name: guest.name,
        room_name: category.name,
        rooms_count: roomsCountNum,
      });
      const gatewayOrderId = orderMeta.id;

      // 6. Persist Booking & PaymentTransaction
      const bookingData = {
        id: bookingId,
        booking_reference: ref,
        room_category_id: category.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_nights: totalNights,
        rooms_count: roomsCountNum,
        adults: Number(adults),
        children: Number(children),
        guest_name: guest.name,
        guest_email: guest.email,
        guest_phone: guest.phone,
        special_requests: guest.special_requests || null,
        expected_checkin_time: guest.expected_checkin_time || null,
        price_per_night: basePrice,
        room_total: roomTotal,
        tax_amount: taxAmount,
        final_payable: finalPayable,
        currency: "INR",
        status: "PENDING_PAYMENT",
        payment_status: "INITIATED",
        hold_expires_at: holdExpiresAt,
      };

      if (prisma) {
        try {
          await prisma.booking.create({
            data: {
              ...bookingData,
              price_per_night: bookingData.price_per_night,
              room_total: bookingData.room_total,
              tax_amount: bookingData.tax_amount,
              final_payable: bookingData.final_payable,
            },
          });

          await prisma.paymentTransaction.create({
            data: {
              id: uuidv4(),
              booking_id: bookingId,
              gateway_order_id: gatewayOrderId,
              amount: finalPayable,
              currency: "INR",
              status: "PENDING",
              provider: "razorpay",
              payload: JSON.stringify(orderMeta),
            },
          });
        } catch (dbErr) {
          console.warn("[Booking Initiate] Database insert warning:", dbErr);
        }
      }

      // Record in-memory for resilience
      inMemoryBookings.push({
        ...bookingData,
        room_name: category.name,
        gateway_order_id: gatewayOrderId,
      });

      // 7. Record 10-minute hold
      recordHoldKey(bookingId, config.bookingHoldMinutes * 60);

      // 8. Return response matching Python schema BookingInitiateResponse
      return NextResponse.json(
        {
          booking_id: bookingId,
          booking_reference: ref,
          room_name: category.name,
          check_in: check_in,
          check_out: check_out,
          total_nights: totalNights,
          rooms_count: roomsCountNum,
          final_payable: finalPayable,
          currency: "INR",
          gateway_order_id: gatewayOrderId,
          gateway_key_id: config.razorpayKeyId,
          hold_expires_at: holdExpiresAt.toISOString(),
          is_mock: Boolean(orderMeta.is_mock),
        },
        { status: 201 }
      );
    } finally {
      releaseLock();
    }
  } catch (err: any) {
    console.error("[Booking Initiate Error]:", err);
    return NextResponse.json({ detail: err?.message || "Internal server error" }, { status: 500 });
  }
}

