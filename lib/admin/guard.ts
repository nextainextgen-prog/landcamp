/**
 * Admin access guard for /api/admin/* routes.
 *
 * Backed by the username/password admin session (lib/admin/auth.ts), not the
 * Supabase customer session. requireAdmin() = any active admin; requireSection
 * additionally checks the section permission (super_admin passes everything).
 */

import { canAccess, getAdminSession, type AdminSession, type SectionKey } from "@/lib/admin/auth";

export type RequireAdminOk = {
  ok: true;
  session: AdminSession;
  userId: string;
  role: AdminSession["role"];
};

export type RequireAdminFail = {
  ok: false;
  status: 401 | 403;
  error: string;
};

export type RequireAdminResult = RequireAdminOk | RequireAdminFail;

export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, status: 401, error: "authentication required" };
  }
  return { ok: true, session, userId: session.id, role: session.role };
}

export async function requireSection(section: SectionKey): Promise<RequireAdminResult> {
  const result = await requireAdmin();
  if (!result.ok) return result;
  if (!canAccess(result.session, section)) {
    return { ok: false, status: 403, error: "no access to this section" };
  }
  return result;
}
