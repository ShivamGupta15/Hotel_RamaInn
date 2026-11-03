import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Hotel Rama Inn",
    runtime: "Next.js TypeScript App Router",
    timestamp: new Date().toISOString(),
  });
}

