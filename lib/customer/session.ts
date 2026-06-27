/**
 * Customer session — signed cookie auth for LINE-logged-in customers.
 *
 * Mirrors the admin session pattern (lib/admin/auth.ts): an HMAC-signed cookie
 * `lc_customer` holding the customer id + expiry. The customer row is loaded
 * live on each read so profile/permission changes take effect immediately.
 * This replaces Supabase Auth for customers.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const CUSTOMER_COOKIE = "lc_customer";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type AuthProvider = "line" | "google";

export type CustomerSession = {
  id: string;
  lineUserId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  provider: AuthProvider;
  phone: string | null;
  /** True once the customer has supplied name + phone (profile_completed_at set). */
  profileComplete: boolean;
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

function rowToSession(
  data: Record<string, unknown>,
  fallbackProvider: AuthProvider,
): CustomerSession {
  const stored = data.auth_provider;
  const provider: AuthProvider =
    stored === "line" || stored === "google" ? stored : fallbackProvider;
  return {
    id: data.id as string,
    lineUserId: (data.line_user_id as string) ?? null,
    displayName: (data.full_name as string) ?? null,
    pictureUrl: (data.avatar_url as string) ?? null,
    provider,
    phone: (data.phone as string) ?? null,
    profileComplete: data.profile_completed_at != null,
  };
}

/**
 * Resolves the current customer from EITHER auth method:
 *   1. the LINE `lc_customer` cookie, or
 *   2. the Supabase (Google) session.
 * Returns null if neither is present/valid.
 *
 * Wrapped in React `cache` so a page + its layout (and any API handler) resolve
 * the session once per request instead of re-hitting the DB / auth server each
 * call.
 */
export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return null;
  }

  // 1. LINE — our signed cookie.
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (token) {
    const customerId = verifyToken(token, Date.now());
    if (customerId) {
      const { data } = await admin
        .from("customers")
        .select("id, line_user_id, full_name, avatar_url, auth_provider, phone, profile_completed_at")
        .eq("id", customerId)
        .maybeSingle();
      if (data) return rowToSession(data, "line");
    }
  }

  // 2. Google — Supabase auth session.
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await admin
        .from("customers")
        .select("id, line_user_id, full_name, avatar_url, auth_provider, phone, profile_completed_at")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) return rowToSession(data, "google");
    }
  } catch {
    // ignore — treat as signed out
  }

  return null;
});
