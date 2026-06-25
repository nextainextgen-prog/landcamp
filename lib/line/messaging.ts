/**
 * LINE Messaging API (push) — server-only. Sends messages to a customer
 * (line_user_id) or the team group (group id). No-ops gracefully when the
 * OA access token isn't configured yet, so callers never break.
 */

import "server-only";

import { getLineConfig } from "./config";

const PUSH_URL = "https://api.line.me/v2/bot/message/push";

export async function pushLineMessages(to: string, messages: unknown[]): Promise<boolean> {
  if (!to || messages.length === 0) return false;
  const cfg = await getLineConfig();
  if (!cfg.messagingAccessToken) return false;
  try {
    const res = await fetch(PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.messagingAccessToken}`,
      },
      body: JSON.stringify({ to, messages }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushLineText(to: string, text: string): Promise<boolean> {
  return pushLineMessages(to, [{ type: "text", text }]);
}

/** Push to the configured team group (returns false if no group id set). */
export async function pushToTeamGroup(messages: unknown[]): Promise<boolean> {
  const cfg = await getLineConfig();
  if (!cfg.teamGroupId) return false;
  return pushLineMessages(cfg.teamGroupId, messages);
}
