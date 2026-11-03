import { NextRequest, NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const { action, details, entity_type, entity_id, user_name, user_role } = body;

    if (!action || !details) {
      return NextResponse.json(
        { detail: "action and details are required" },
        { status: 400 }
      );
    }

    const item = await recordAuditLog({
      userName: user_name || actor.name,
      userRole: user_role || actor.role,
      action,
      details,
      entityType: entity_type,
      entityId: entity_id,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

