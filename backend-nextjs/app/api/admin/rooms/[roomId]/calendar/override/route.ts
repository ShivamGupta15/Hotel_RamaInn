import { NextRequest, NextResponse } from "next/server";
import { upsertCalendarOverride, deleteCalendarOverride } from "@/lib/calendar";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const {
      date_from,
      date_to,
      available_units,
      is_blocked = false,
      price_override,
      notes,
    } = body;

    if (!date_from || !date_to) {
      return NextResponse.json(
        { detail: "date_from and date_to are required" },
        { status: 400 }
      );
    }

    const affected = await upsertCalendarOverride({
      categoryIdOrSlug: roomId,
      dateFrom: date_from,
      dateTo: date_to,
      availableUnits: available_units !== undefined ? Number(available_units) : null,
      isBlocked: Boolean(is_blocked),
      priceOverride: price_override !== undefined ? Number(price_override) : null,
      notes: notes || null,
    });

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "CALENDAR_OVERRIDE_UPSERT",
      entityType: "CALENDAR",
      entityId: roomId,
      details: `Updated overrides for ${roomId} (${date_from} to ${date_to}): blocked=${is_blocked}, units=${available_units}, price=₹${price_override || "default"}`,
    });

    return NextResponse.json({
      status: "success",
      affected_days: affected,
      message: `Successfully updated availability/price override for ${affected} day(s).`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const actor = extractActorInfo(req);

  try {
    let dateFrom = "";
    let dateTo = "";

    try {
      const body = await req.json();
      dateFrom = body.date_from;
      dateTo = body.date_to;
    } catch {
      const searchParams = req.nextUrl.searchParams;
      dateFrom = searchParams.get("date_from") || "";
      dateTo = searchParams.get("date_to") || "";
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { detail: "date_from and date_to are required" },
        { status: 400 }
      );
    }

    const deleted = await deleteCalendarOverride(roomId, dateFrom, dateTo);

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "CALENDAR_OVERRIDE_DELETE",
      entityType: "CALENDAR",
      entityId: roomId,
      details: `Removed calendar overrides for ${roomId} from ${dateFrom} to ${dateTo}`,
    });

    return NextResponse.json({
      status: "success",
      deleted_days: deleted,
      message: `Reset overrides for ${deleted} day(s) back to standard inventory.`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid request" }, { status: 400 });
  }
}

