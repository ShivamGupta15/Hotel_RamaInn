import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  DEFAULT_ADMIN_USER,
  DEFAULT_STAFF_USER,
  inMemoryUsers,
  AdminUserData,
} from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { extractActorInfo } from "@/lib/auth";

export async function GET() {
  let users: any[] = [];

  if (prisma) {
    try {
      users = await prisma.adminUser.findMany({
        orderBy: { created_at: "asc" },
      });

      // Auto-seed if empty
      if (users.length === 0) {
        await prisma.adminUser.createMany({
          data: [
            {
              id: DEFAULT_ADMIN_USER.id,
              username: DEFAULT_ADMIN_USER.username,
              email: DEFAULT_ADMIN_USER.email,
              full_name: DEFAULT_ADMIN_USER.full_name,
              password_hash: DEFAULT_ADMIN_USER.password_hash,
              role: DEFAULT_ADMIN_USER.role,
              is_active: true,
            },
            {
              id: DEFAULT_STAFF_USER.id,
              username: DEFAULT_STAFF_USER.username,
              email: DEFAULT_STAFF_USER.email,
              full_name: DEFAULT_STAFF_USER.full_name,
              password_hash: DEFAULT_STAFF_USER.password_hash,
              role: DEFAULT_STAFF_USER.role,
              is_active: true,
            },
          ],
        });
        users = await prisma.adminUser.findMany({ orderBy: { created_at: "asc" } });
      }
    } catch {
      users = [];
    }
  }

  if (!users || users.length === 0) {
    users = Array.from(inMemoryUsers.values());
  }

  const safeUsers = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login_at: u.last_login_at,
  }));

  return NextResponse.json(safeUsers);
}

export async function POST(req: NextRequest) {
  const actor = extractActorInfo(req);

  try {
    const body = await req.json();
    const { username, email, full_name, password, role = "STAFF" } = body;

    if (!username || !email || !full_name || !password) {
      return NextResponse.json(
        { detail: "username, email, full_name, and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    if (prisma) {
      try {
        const existing = await prisma.adminUser.findFirst({
          where: {
            OR: [{ username: cleanUsername }, { email: cleanEmail }],
          },
        });
        if (existing) {
          return NextResponse.json(
            { detail: "A user with this username or email already exists." },
            { status: 409 }
          );
        }
      } catch {
        // Fallback
      }
    }

    for (const u of inMemoryUsers.values()) {
      if (u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { detail: "A user with this username or email already exists." },
          { status: 409 }
        );
      }
    }

    const newUser: AdminUserData = {
      id: uuidv4(),
      username: cleanUsername,
      email: cleanEmail,
      full_name,
      password_hash: hashPassword(password),
      role: role.toUpperCase() as any,
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    if (prisma) {
      try {
        await prisma.adminUser.create({
          data: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            full_name: newUser.full_name,
            password_hash: newUser.password_hash,
            role: newUser.role,
            is_active: true,
          },
        });
      } catch (err) {
        console.warn("[Admin Users POST] DB error:", err);
      }
    }

    inMemoryUsers.set(newUser.id, newUser);

    await recordAuditLog({
      userName: actor.name,
      userRole: actor.role,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: newUser.id,
      details: `Created new staff/admin user: "${newUser.username}" (${newUser.role})`,
    });

    return NextResponse.json(
      {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Invalid payload" }, { status: 400 });
  }
}

