import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  DEFAULT_ADMIN_USER,
  DEFAULT_STAFF_USER,
  inMemoryUsers,
} from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username_or_email, password } = body;

    if (!username_or_email || !password) {
      return NextResponse.json(
        { detail: "username_or_email and password are required" },
        { status: 400 }
      );
    }

    const query = username_or_email.trim().toLowerCase();
    let user: any = null;

    if (prisma) {
      try {
        user = await prisma.adminUser.findFirst({
          where: {
            OR: [{ username: query }, { email: query }],
          },
        });

        if (user && user.is_active && verifyPassword(password, user.password_hash)) {
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
          });
        } else {
          user = null;
        }
      } catch {
        user = null;
      }
    }

    // In-memory fallback
    if (!user) {
      for (const u of Array.from(inMemoryUsers.values())) {
        if (
          (u.username.toLowerCase() === query || u.email.toLowerCase() === query) &&
          u.is_active &&
          verifyPassword(password, u.password_hash)
        ) {
          user = u;
          break;
        }
      }
    }

    // Direct check against default credentials if passwords match
    if (!user) {
      if (
        (query === DEFAULT_ADMIN_USER.username || query === DEFAULT_ADMIN_USER.email) &&
        password === "adminpassword123"
      ) {
        user = DEFAULT_ADMIN_USER;
      } else if (
        (query === DEFAULT_STAFF_USER.username || query === DEFAULT_STAFF_USER.email) &&
        password === "staffpassword123"
      ) {
        user = DEFAULT_STAFF_USER;
      }
    }

    if (!user) {
      return NextResponse.json(
        { detail: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = uuidv4();

    await recordAuditLog({
      userName: user.full_name || user.username,
      userRole: user.role,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: user.id,
      userId: user.id,
      details: `User ${user.username} (${user.role}) logged in successfully.`,
    });

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Login failed" }, { status: 500 });
  }
}
