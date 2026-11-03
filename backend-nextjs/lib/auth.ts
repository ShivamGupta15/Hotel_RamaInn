import crypto from "crypto";

export interface AdminUserData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  is_active: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

/**
 * PBKDF2-HMAC-SHA256 password hashing matching Python backend exactly:
 * salt: 16-byte hex string
 * iterations: 100,000
 * output: 32 bytes (64 hex characters)
 * stored format: salt:key
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
  return `${salt}:${key}`;
}

export function verifyPassword(plainPassword: string, hashed: string): boolean {
  try {
    const [salt, key] = hashed.split(":");
    if (!salt || !key) return false;
    const newKey = crypto.pbkdf2Sync(plainPassword, salt, 100_000, 32, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(newKey, "hex"), Buffer.from(key, "hex"));
  } catch {
    return false;
  }
}

export const DEFAULT_ADMIN_USER: AdminUserData = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "admin",
  email: "admin@hotelramainn.com",
  full_name: "Principal Administrator",
  password_hash: hashPassword("adminpassword123"),
  role: "ADMIN",
  is_active: true,
  created_at: new Date().toISOString(),
  last_login_at: null,
};

export const DEFAULT_STAFF_USER: AdminUserData = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "staff",
  email: "reception@hotelramainn.com",
  full_name: "Front Desk Receptionist",
  password_hash: hashPassword("staffpassword123"),
  role: "STAFF",
  is_active: true,
  created_at: new Date().toISOString(),
  last_login_at: null,
};

// In-memory user store for dev/preview resilience when database is offline
export const inMemoryUsers: Map<string, AdminUserData> = new Map([
  [DEFAULT_ADMIN_USER.id, { ...DEFAULT_ADMIN_USER }],
  [DEFAULT_STAFF_USER.id, { ...DEFAULT_STAFF_USER }],
]);

export function extractActorInfo(req: Request): { name: string; role: string } {
  const name = req.headers.get("x-user-name") || "Administrator";
  const role = (req.headers.get("x-user-role") || "ADMIN").toUpperCase();
  return { name, role };
}

