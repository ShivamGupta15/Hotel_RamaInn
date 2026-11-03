import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, inMemoryUsers } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const { is_active, password } = body;

    let user: any = null;

    if (prisma) {
      try {
        user = await prisma.adminUser.findFirst({
          where: {
            OR: [{ id: userId }, { username: userId.toLowerCase() }],
          },
        });

        if (user) {
          const updateData: any = {};
          if (is_active !== undefined) updateData.is_active = Boolean(is_active);
          if (password) updateData.password_hash = hashPassword(password);

          user = await prisma.adminUser.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      } catch (err) {
        console.warn("[Admin User Status] DB update warning:", err);
      }
    }

    if (!user) {
      user = inMemoryUsers.get(userId);
      if (!user) {
        for (const u of Array.from(inMemoryUsers.values())) {
          if (u.username.toLowerCase() === userId.toLowerCase()) {
            user = u;
            break;
          }
        }
      }
      if (user) {
        if (is_active !== undefined) user.is_active = Boolean(is_active);
        if (password) user.password_hash = hashPassword(password);
      }
    }

    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "USER_STATUS_UPDATE",
      entityType: "USER",
      entityId: user.id,
      details: `Updated user "${user.username}": active=${is_active !== undefined ? is_active : "unchanged"}, password_reset=${password ? "yes" : "no"}`,
    });

    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      },
      message: `User ${user.username} status updated.`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}
