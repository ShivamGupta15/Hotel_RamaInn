import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOMS, parseArrayField } from "@/lib/availability";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  let room: any = null;

  if (prisma) {
    try {
      room = await prisma.roomCategory.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
        },
      });
    } catch {
      room = null;
    }
  }

  if (!room) {
    room = DEFAULT_ROOMS.find((r) => r.slug === slug || r.id === slug);
  }

  if (!room) {
    return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...room,
    base_price_per_night: Number(room.base_price_per_night),
    tax_percent: Number(room.tax_percent || 12.0),
    amenities: parseArrayField(room.amenities),
    images: parseArrayField(room.images),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug: roomIdOrSlug } = params;
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.total_units !== undefined) updateData.total_units = Number(body.total_units);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.base_price_per_night !== undefined)
      updateData.base_price_per_night = Number(body.base_price_per_night);
    if (body.tax_percent !== undefined) updateData.tax_percent = Number(body.tax_percent);
    if (body.max_adults !== undefined) updateData.max_adults = Number(body.max_adults);
    if (body.max_children !== undefined) updateData.max_children = Number(body.max_children);
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.amenities !== undefined) updateData.amenities = JSON.stringify(body.amenities);

    let updatedRoom: any = null;

    if (prisma) {
      try {
        const existing = await prisma.roomCategory.findFirst({
          where: { OR: [{ id: roomIdOrSlug }, { slug: roomIdOrSlug }] },
        });

        if (existing) {
          updatedRoom = await prisma.roomCategory.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      } catch (err) {
        console.warn("[Rooms PATCH] Database error:", err);
      }
    }

    // In-memory update
    const memRoom = DEFAULT_ROOMS.find((r) => r.id === roomIdOrSlug || r.slug === roomIdOrSlug);
    if (memRoom) {
      if (body.name !== undefined) memRoom.name = body.name;
      if (body.total_units !== undefined) memRoom.total_units = Number(body.total_units);
      if (body.is_active !== undefined) memRoom.is_active = Boolean(body.is_active);
      if (body.base_price_per_night !== undefined)
        memRoom.base_price_per_night = Number(body.base_price_per_night);
      if (body.images !== undefined) memRoom.images = body.images;
      if (body.amenities !== undefined) memRoom.amenities = body.amenities;
      if (!updatedRoom) updatedRoom = memRoom;
    }

    if (!updatedRoom) {
      return NextResponse.json({ detail: "Room not found" }, { status: 404 });
    }

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "ROOM_UPDATED",
      entityType: "ROOM",
      entityId: updatedRoom.id,
      details: `Updated room "${updatedRoom.name}": ${JSON.stringify(body)}`,
    });

    return NextResponse.json({
      ...updatedRoom,
      base_price_per_night: Number(updatedRoom.base_price_per_night),
      tax_percent: Number(updatedRoom.tax_percent || 12.0),
      amenities: parseArrayField(updatedRoom.amenities),
      images: parseArrayField(updatedRoom.images),
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug: roomIdOrSlug } = params;
  const actor = extractActorInfo(req);

  let deleted = false;
  let roomName = roomIdOrSlug;

  if (prisma) {
    try {
      const existing = await prisma.roomCategory.findFirst({
        where: { OR: [{ id: roomIdOrSlug }, { slug: roomIdOrSlug }] },
      });
      if (existing) {
        roomName = existing.name;
        await prisma.roomCategory.delete({ where: { id: existing.id } });
        deleted = true;
      }
    } catch (err) {
      console.warn("[Rooms DELETE] Database error:", err);
    }
  }

  const idx = DEFAULT_ROOMS.findIndex((r) => r.id === roomIdOrSlug || r.slug === roomIdOrSlug);
  if (idx !== -1) {
    roomName = DEFAULT_ROOMS[idx].name;
    DEFAULT_ROOMS.splice(idx, 1);
    deleted = true;
  }

  if (!deleted) {
    return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  }

  await recordAuditLog({
    userName: actor.name,
    userRole: actor.role,
    action: "ROOM_DELETED",
    entityType: "ROOM",
    entityId: roomIdOrSlug,
    details: `Deleted room category "${roomName}" (${roomIdOrSlug})`,
  });

  return NextResponse.json({ status: "success", message: `Room category "${roomName}" deleted.` });
}

