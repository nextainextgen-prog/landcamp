import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import {
  buildAuthorizeUrl,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/line/login";
import { getLineConfig, lineLoginReady } from "@/lib/line/config";
import { CUSTOMER_AUTH_ENABLED } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resolve the public origin from the real request host. `request.nextUrl.origin`
 * reports the server's bound host (e.g. localhost) rather than the Host the
 * client actually hit — which breaks LAN/phone testing and any reverse proxy.
 * Read x-forwarded-host / host instead so the LINE redirect_uri matches.
 */
function requestOrigin(request: NextRequest): string {
  const h = request.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? request.nextUrl.host;
  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.") || /^\d+\.\d+\.\d+\.\d+/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Starts LINE Login: sets a CSRF `state` cookie + remembers where to return,
 * then redirects to LINE's authorize page (with auto add-friend prompt).
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);

  // Server-side gate: while customer sign-in is soft-launched OFF, refuse to
  // start the OAuth flow even if someone hits this URL directly (the navbar
  // already hides the UI, but the route must reject too).
  if (!CUSTOMER_AUTH_ENABLED) {
    return NextResponse.redirect(new URL("/?login=disabled", origin));
  }

  const cfg = await getLineConfig();
  if (!lineLoginReady(cfg)) {
    return NextResponse.redirect(new URL("/?login=unavailable", origin));
  }

  const nextParam = request.nextUrl.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${origin}/auth/line/callback`;

  const res = NextResponse.redirect(buildAuthorizeUrl(cfg, redirectUri, state));
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  };
  res.cookies.set(OAUTH_STATE_COOKIE, state, opts);
  res.cookies.set(OAUTH_NEXT_COOKIE, next, opts);
  return res;
}
