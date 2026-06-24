import { NextResponse, type NextRequest } from "next/server";

import {
  exchangeCode,
  fetchProfile,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/line/login";
import { getLineConfig } from "@/lib/line/config";
import {
  CUSTOMER_COOKIE,
  sessionCookieOptions,
  signCustomerSession,
} from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LINE Login callback. Verifies the CSRF state, exchanges the code for a
 * profile, upserts the customer (keyed by line_user_id), sets our session
 * cookie, and returns the customer to where they started. Any failure quietly
 * sends them home with ?login=error — never a scary error page.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");

  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const nextTarget = request.cookies.get(OAUTH_NEXT_COOKIE)?.value ?? "/";
  const safeNext = nextTarget.startsWith("/") ? nextTarget : "/";

  const fail = () => NextResponse.redirect(new URL("/?login=error", origin));

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail();
  }

  try {
    const cfg = await getLineConfig();
    const redirectUri = `${origin}/auth/line/callback`;
    const token = await exchangeCode(cfg, code, redirectUri);
    const profile = await fetchProfile(token.accessToken);

    const admin = createSupabaseAdminClient();

    const { data: existing } = await admin
      .from("customers")
      .select("id")
      .eq("line_user_id", profile.userId)
      .maybeSingle();

    const patch: Record<string, unknown> = {
      full_name: profile.displayName,
      avatar_url: profile.pictureUrl,
      auth_provider: "line",
    };
    // Only flip line_friend on when they actually added the OA this login.
    if (token.friendAdded) patch.line_friend = true;

    let customerId: string;
    if (existing) {
      customerId = existing.id as string;
      await admin.from("customers").update(patch).eq("id", customerId);
    } else {
      const { data: created, error } = await admin
        .from("customers")
        .insert({ line_user_id: profile.userId, ...patch })
        .select("id")
        .single();
      if (error || !created) return fail();
      customerId = created.id as string;
    }

    const res = NextResponse.redirect(new URL(safeNext, origin));
    res.cookies.set(CUSTOMER_COOKIE, signCustomerSession(customerId, Date.now()), sessionCookieOptions());
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.delete(OAUTH_NEXT_COOKIE);
    return res;
  } catch {
    return fail();
  }
}
