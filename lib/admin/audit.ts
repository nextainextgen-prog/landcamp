import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Records an admin action in admin_audit_log. Non-fatal on any error. */
export async function logAdminAction(
  actor: string | null,
  action: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("admin_audit_log").insert({ actor, action, detail });
  } catch {
    // auditing must never break the action it records
  }
}
