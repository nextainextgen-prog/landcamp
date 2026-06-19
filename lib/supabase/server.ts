import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for use in Server Components, Route Handlers and Server
 * Functions. Uses the anon key and the Next.js cookie store so the user's
 * session travels with the request.
 *
 * `cookies()` is async in Next 16; we await it once and bridge to the
 * `getAll`/`setAll` API expected by `@supabase/ssr`. `setAll` is wrapped in
 * a try/catch because Server Components cannot mutate cookies — middleware
 * is responsible for persisting refreshed tokens, and we don't want a render
 * to crash when the client tries to write.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Token refreshes are persisted by middleware instead.
        }
      },
    },
  });
}
