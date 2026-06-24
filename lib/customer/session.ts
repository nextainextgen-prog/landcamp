/**
 * Customer session — signed cookie auth for LINE-logged-in customers.
 *
 * Mirrors the admin session pattern (lib/admin/auth.ts): an HMAC-signed cookie
 * `lc_customer` holding the customer id + expiry. The customer row is loaded
 * live on each read so profile/permission changes take effect immediately.
 * This replaces Supabase Auth for customers.
 */

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const CUSTOMER_COOKIE = "lc_customer";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type CustomerSession = {
  id: string;
  lineUserId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
};

function sessionSecret(): string {
  return (
    process.env.CUSTOMER_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "insecure-dev-secret"
  );
}

export function signCustomerSession(customerId: string, nowMs: number): string {
  const exp = nowMs + SESSION_TTL_MS;
  const body = `${customerId}.${exp}`;
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

function verifyToken(token: string, nowMs: number): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expStr, sig] = parts;
  const body = `${customerId}.${expStr}`;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expStr) < nowMs) return null;
  return customerId;
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

/** Resolves the current customer from the signed session cookie, or null. */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const customerId = verifyToken(token, Date.now());
  if (!customerId) return null;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return null;
  }

  const { data } = await admin
    .from("customers")
    .select("id, line_user_id, full_name, avatar_url")
    .eq("id", customerId)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id as string,
    lineUserId: (data.line_user_id as string) ?? null,
    displayName: (data.full_name as string) ?? null,
    pictureUrl: (data.avatar_url as string) ?? null,
  };
}
