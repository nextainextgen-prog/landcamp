/**
 * Admin access guard for /api/admin/* routes.
 *
 * Currently a no-op stub that always returns ok. Wired so every admin
 * route already calls requireAdmin() — when the real auth lookup lands
 * it only needs to swap the body, not touch the routes.
 *
 * TODO: replace with admin_users lookup per impl-plan Sprint 1 §1.4
 */

export type RequireAdminOk = {
  ok: true;
  /** userId is populated once admin_users lookup is wired. */
  userId: string | null;
};

export type RequireAdminFail = {
  ok: false;
  status: 401;
  error: string;
};

export type RequireAdminResult = RequireAdminOk | RequireAdminFail;

export async function requireAdmin(): Promise<RequireAdminResult> {
  // TODO: replace with admin_users lookup per impl-plan Sprint 1 §1.4
  return { ok: true, userId: null };
}
