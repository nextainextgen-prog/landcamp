/**
 * LINE Login (OAuth 2.1) helpers — server-only (uses the channel secret).
 *
 * Flow: redirect to buildAuthorizeUrl() → LINE redirects back to our callback
 * with ?code → exchangeCode() → fetchProfile() gives the userId we store as
 * customers.line_user_id (the key for pushing Flex messages later).
 *
 * `bot_prompt=aggressive` shows the "add friend" step for the Official Account
 * linked to this Login channel, so customers add the OA while signing in. The
 * token response then carries `friendship_status_changed: true`.
 *
 * Requires env: LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET. The Login and
 * Messaging channels MUST be under the same LINE provider for the userId to be
 * usable by the Messaging API.
 */

import "server-only";

import type { LineConfig } from "./config";

const AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const PROFILE_URL = "https://api.line.me/v2/profile";

/** Short-lived cookies carrying CSRF state + post-login redirect target. */
export const OAUTH_STATE_COOKIE = "lc_oauth_state";
export const OAUTH_NEXT_COOKIE = "lc_oauth_next";

export function buildAuthorizeUrl(cfg: LineConfig, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.loginChannelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
  });
  // Prompt the user to add the linked Official Account as a friend.
  if (cfg.addFriend) params.set("bot_prompt", "aggressive");
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export type LineToken = {
  accessToken: string;
  idToken: string | null;
  /** true when the user added the OA as a friend during this login. */
  friendAdded: boolean;
};

export async function exchangeCode(
  cfg: LineConfig,
  code: string,
  redirectUri: string,
): Promise<LineToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.loginChannelId,
    client_secret: cfg.loginChannelSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LINE token exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    id_token?: string;
    friendship_status_changed?: boolean;
  };
  return {
    accessToken: data.access_token,
    idToken: data.id_token ?? null,
    friendAdded: data.friendship_status_changed === true,
  };
}

export type LineProfile = {
  userId: string;
  displayName: string | null;
  pictureUrl: string | null;
};

export async function fetchProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LINE profile fetch failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    userId: string;
    displayName?: string;
    pictureUrl?: string;
  };
  return {
    userId: data.userId,
    displayName: data.displayName ?? null,
    pictureUrl: data.pictureUrl ?? null,
  };
}
