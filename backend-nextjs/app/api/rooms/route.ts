import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOMS, parseArrayField } from "@/lib/availability";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const activeOnly = searchParams.get("active_only") !== "false";

  let rooms: any[] = [];

  if (prisma) {
    try {
      const where = activeOnly ? { is_active: true } : {};
      rooms = await prisma.roomCategory.findMany({
        where,
        orderBy: { base_price_per_night: "asc" },
      });
    } catch {
      rooms = [];
    }
  }

  if (!rooms || rooms.length === 0) {
    rooms = activeOnly ? DEFAULT_ROOMS.filter((r) => r.is_active) : [...DEFAULT_ROOMS];
  }

  const summaries = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    base_price_per_night: Number(r.base_price_per_night),
    tax_percent: Number(r.tax_percent || 12.0),
    max_adults: r.max_adults,
    max_children: r.max_children,
    amenities: parseArrayField(r.amenities),
    images: parseArrayField(r.images),
    is_active: r.is_active,
  }));

  return NextResponse.json(summaries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const actor = extractActorInfo(req);

    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newRoom = {
      id: uuidv4(),
      name: body.name,
      slug,
      description: body.description || null,
      max_adults: Number(body.max_adults || 2),
      max_children: Number(body.max_children || 1),
      total_units: Number(body.total_units || 1),
      base_price_per_night: Number(body.base_price_per_night),
      tax_percent: Number(body.tax_percent || 12.0),
      amenities: JSON.stringify(body.amenities || []),
      images: JSON.stringify(body.images || []),
      is_active: body.is_active !== false,
    };

    let created: any = newRoom;
    if (prisma) {
      try {
        created = await prisma.roomCategory.create({
          data: {
            ...newRoom,
            base_price_per_night: newRoom.base_price_per_night,
            tax_percent: newRoom.tax_percent,
          },
        });
      } catch (err) {
        console.warn("[Rooms POST] Database insert warning:", err);
      }
    }

    // Add to DEFAULT_ROOMS for in-memory resilience
    DEFAULT_ROOMS.push({
      ...newRoom,
      amenities: body.amenities || [],
      images: body.images || [],
    });

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "ROOM_CREATED",
      entityType: "ROOM",
      entityId: newRoom.id,
      details: `Created new room category: "${newRoom.name}" (${newRoom.total_units} units @ ₹${newRoom.base_price_per_night}/night)`,
    });

    return NextResponse.json(
      {
        ...created,
        base_price_per_night: Number(created.base_price_per_night),
        tax_percent: Number(created.tax_percent),
        amenities: parseArrayField(created.amenities),
        images: parseArrayField(created.images),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}
