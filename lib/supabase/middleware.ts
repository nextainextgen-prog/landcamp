import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on every matched request and writes any
 * rotated tokens back onto the response cookies.
 *
 * Server Components cannot mutate cookies, so the server client in
 * `lib/supabase/server.ts` relies on this running in `proxy.ts` (Next 16's
 * renamed Middleware) to persist refreshed sessions. Without it, an expired
 * access token is never refreshed for server-side reads.
 *
 * Calling `getUser()` is what triggers the refresh — do not remove it.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Missing env: don't crash the whole site, just pass the request through.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touches the session and refreshes the token if needed.
  await supabase.auth.getUser();

  return response;
}
