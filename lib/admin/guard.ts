/**
 * Admin access guard for /admin pages and /api/admin/* routes.
 *
 * Resolves the signed-in user from the request cookies and checks the
 * `admin_users` table (service-role lookup, bypassing RLS). Returns the
 * caller's role on success so routes can branch on it later.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "super_admin" | "reception" | "housekeeping";

export type RequireAdminOk = {
  ok: true;
  userId: string;
  role: AdminRole;
};

export type RequireAdminFail = {
  ok: false;
  status: 401 | 403 | 500;
  error: string;
};

export type RequireAdminResult = RequireAdminOk | RequireAdminFail;

export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, error: "authentication required" };
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return { ok: false, status: 500, error: "server not configured" };
  }

  const { data, error } = await admin
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }
  if (!data || data.is_active !== true) {
    return { ok: false, status: 403, error: "admin access required" };
  }

  return { ok: true, userId: user.id, role: data.role as AdminRole };
}
