import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import {
  buildAuthorizeUrl,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/line/login";
import { getLineConfig, lineLoginReady } from "@/lib/line/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts LINE Login: sets a CSRF `state` cookie + remembers where to return,
 * then redirects to LINE's authorize page (with auto add-friend prompt).
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

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
