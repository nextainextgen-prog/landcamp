import { cache } from "react";
import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SECTIONS,
  SECTION_KEYS,
  type AdminRole,
  type SectionKey,
} from "@/lib/admin/sections";

export { SECTIONS, SECTION_KEYS };
export type { SectionKey, AdminRole };

export type AdminSession = {
  id: string;
  username: string;
  role: AdminRole;
  permissions: SectionKey[];
};

export const ADMIN_COOKIE = "lc_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ── Password hashing (scrypt, salted) ──
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── Signed session token ──
function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "insecure-dev-secret"
  );
}

export function signSession(adminId: string, nowMs: number): string {
  const exp = nowMs + SESSION_TTL_MS;
  const body = `${adminId}.${exp}`;
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

function verifySessionToken(token: string, nowMs: number): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expStr, sig] = parts;
  const body = `${adminId}.${expStr}`;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expStr) < nowMs) return null;
  return adminId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

/**
 * Resolves the current admin from the signed session cookie, loading the live
 * account row (so deactivation / permission changes take effect immediately).
 *
 * Wrapped in React `cache` so the layout, `requireSection`, and the page can
 * each call it within one render without re-querying `admin_accounts` 2-3×.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const adminId = verifySessionToken(token, Date.now());
  if (!adminId) return null;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return null;
  }

  const { data } = await admin
    .from("admin_accounts")
    .select("id, username, role, permissions, is_active")
    .eq("id", adminId)
    .maybeSingle();

  if (!data || data.is_active !== true) return null;

  const permissions = Array.isArray(data.permissions)
    ? (data.permissions as string[]).filter((p): p is SectionKey =>
        SECTION_KEYS.includes(p as SectionKey),
      )
    : [];

  return {
    id: data.id as string,
    username: data.username as string,
    role: data.role as AdminRole,
    permissions,
  };
});

/** Whether a session may access a section (super_admin = all). */
export function canAccess(session: AdminSession, section: SectionKey): boolean {
  return session.role === "super_admin" || session.permissions.includes(section);
}

/** The first section a session can reach (for post-login redirect). */
export function firstAllowedSection(session: AdminSession): SectionKey | null {
  if (session.role === "super_admin") return "bookings";
  return SECTION_KEYS.find((s) => session.permissions.includes(s)) ?? null;
}
