import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "not_configured";
  let dbError: string | null = null;
  let roomCount = 0;
  let bookingCount = 0;
  let userCount = 0;

  const rawUrl = process.env.DATABASE_URL || "";
  let maskedUrl = "none";
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      maskedUrl = `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
    } catch {
      maskedUrl = "invalid_format";
    }
  }

  if (prisma) {
    try {
      // 1. Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";

      // 2. Check if tables exist
      try {
        roomCount = await prisma.roomCategory.count();
        bookingCount = await prisma.booking.count();
        userCount = await prisma.adminUser.count();
      } catch (tableErr: any) {
        dbStatus = "connected_tables_missing";
        dbError = `Database connected, but tables are missing. Run 'npx prisma db push'. Details: ${tableErr?.message || tableErr}`;
      }
    } catch (err: any) {
      dbStatus = "connection_failed";
      dbError = err?.message || String(err);
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "Hotel Rama Inn",
    runtime: "Next.js TypeScript App Router",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      configured_url: maskedUrl,
      error: dbError,
      stats: dbStatus === "connected" ? {
        rooms: roomCount,
        bookings: bookingCount,
        users: userCount,
      } : null,
    },
  });
}
