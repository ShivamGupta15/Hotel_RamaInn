import { NextRequest, NextResponse } from "next/server";
import { checkAvailability } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const checkInStr = searchParams.get("check_in");
  const checkOutStr = searchParams.get("check_out");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const roomsCount = parseInt(searchParams.get("rooms") || "1", 10);

  if (!checkInStr || !checkOutStr) {
    return NextResponse.json(
      { detail: "check_in and check_out query parameters are required" },
      { status: 422 }
    );
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json(
      { detail: "Dates must be valid YYYY-MM-DD format" },
      { status: 422 }
    );
  }

  if (checkOut <= checkIn) {
    return NextResponse.json(
      { detail: "check_out must be strictly after check_in" },
      { status: 422 }
    );
  }

  const results = await checkAvailability({
    checkIn,
    checkOut,
    adults,
    children,
    roomsCount,
  });

  const totalNights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  return NextResponse.json({
    check_in: checkInStr,
    check_out: checkOutStr,
    total_nights: totalNights,
    adults,
    children,
    rooms_count: roomsCount,
    results,
  });
}

