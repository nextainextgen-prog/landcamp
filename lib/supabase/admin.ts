/**
 * STUB — codex-3 placeholder.
 * TODO: remove once codex-1 lands the canonical lib/supabase/admin.ts.
 *
 * Service-role Supabase client for /api/admin/* routes. Bypasses RLS, so
 * NEVER import this from client code or non-admin server code.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
