import { NextRequest, NextResponse } from "next/server";
import { getRoomMonthCalendar } from "@/lib/calendar";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = req.nextUrl.searchParams;

  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getUTCFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(now.getUTCMonth() + 1), 10);

  if (month < 1 || month > 12) {
    return NextResponse.json({ detail: "Month must be between 1 and 12" }, { status: 400 });
  }

  const calendarData = await getRoomMonthCalendar(slug, year, month);
  return NextResponse.json(calendarData);
}

