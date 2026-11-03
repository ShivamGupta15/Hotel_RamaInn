import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseHoldKey } from "@/lib/booking-holds";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const { transaction_id, status, gateway_payment_id } = body;

    if (!transaction_id || !status) {
      return NextResponse.json(
        { detail: "transaction_id and status are required" },
        { status: 400 }
      );
    }

    if (prisma) {
      try {
        const txn = await prisma.paymentTransaction.findUnique({
          where: { id: transaction_id },
          include: { booking: true },
        });

        if (txn) {
          await prisma.paymentTransaction.update({
            where: { id: transaction_id },
            data: {
              status,
              gateway_payment_id: gateway_payment_id || txn.gateway_payment_id,
            },
          });

          if (status === "SUCCESS" && txn.booking) {
            await prisma.booking.update({
              where: { id: txn.booking.id },
              data: {
                status: "CONFIRMED",
                payment_status: "PAID",
                hold_expires_at: null,
              },
            });
            releaseHoldKey(txn.booking.id);
          }
        }
      } catch (err) {
        console.warn("[Payments Reconcile] DB warning:", err);
      }
    }

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "PAYMENT_RECONCILED",
      entityType: "TRANSACTION",
      entityId: transaction_id,
      details: `Reconciled transaction ${transaction_id} to status "${status}" (Gateway ID: ${gateway_payment_id || "none"})`,
    });

    return NextResponse.json({
      status: "success",
      message: `Transaction ${transaction_id} reconciled to ${status}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

