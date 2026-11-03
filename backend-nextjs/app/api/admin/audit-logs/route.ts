import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "150", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const action = searchParams.get("action");
  const search = searchParams.get("search");

  const logs = await getAuditLogs({ limit, offset, action, search });
  return NextResponse.json(logs);
}

