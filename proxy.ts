import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 renamed Middleware to Proxy (same functionality). This keeps the
 * Supabase auth session fresh on each request by delegating to `updateSession`.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run where a Supabase (Google) auth session actually needs refreshing:
  // the customer account/profile/receipt pages and the OAuth callback. Customers
  // are LINE-first (the `lc_customer` cookie needs no Supabase refresh) and the
  // admin area uses its own `lc_admin` cookie — so running the Supabase
  // `getUser()` round-trip on `/admin`, the public marketing pages, or the API
  // was pure latency on every request. Scoping it here removes that tax.
  matcher: [
    "/account/:path*",
    "/profile/:path*",
    "/booking/:path*",
    "/auth/:path*",
  ],
};
