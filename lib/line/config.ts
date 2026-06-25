/**
 * Resolved LINE configuration — DB settings (editable in /admin/settings) with
 * env-var fallback. Server-only (reads via the service-role client + secrets).
 *
 * The owner enters credentials in the backoffice; env vars stay as a fallback
 * for local/CI. Any DB read failure (table missing, no env) degrades to empty
 * values and the login route reports "unavailable" rather than crashing.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LineConfig = {
  loginChannelId: string;
  loginChannelSecret: string;
  messagingAccessToken: string;
  messagingChannelSecret: string;
  oaBasicId: string;
  teamGroupId: string;
  addFriend: boolean;
};

function envConfig(): LineConfig {
  return {
    loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
    loginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? "",
    messagingAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ?? "",
    messagingChannelSecret: process.env.LINE_MESSAGING_CHANNEL_SECRET ?? "",
    oaBasicId: process.env.LINE_OA_BASIC_ID ?? "",
    teamGroupId: process.env.LINE_TEAM_GROUP_ID ?? "",
    addFriend: true,
  };
}

export async function getLineConfig(): Promise<LineConfig> {
  const env = envConfig();
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("line_settings")
      .select(
        "login_channel_id, login_channel_secret, messaging_access_token, messaging_channel_secret, oa_basic_id, team_group_id, add_friend",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return env;
    return {
      loginChannelId: (data.login_channel_id as string) || env.loginChannelId,
      loginChannelSecret: (data.login_channel_secret as string) || env.loginChannelSecret,
      messagingAccessToken: (data.messaging_access_token as string) || env.messagingAccessToken,
      messagingChannelSecret: (data.messaging_channel_secret as string) || env.messagingChannelSecret,
      oaBasicId: (data.oa_basic_id as string) || env.oaBasicId,
      teamGroupId: (data.team_group_id as string) || env.teamGroupId,
      addFriend: typeof data.add_friend === "boolean" ? data.add_friend : true,
    };
  } catch {
    return env;
  }
}

/** Whether LINE Login can run (needs at least channel id + secret). */
export function lineLoginReady(cfg: LineConfig): boolean {
  return Boolean(cfg.loginChannelId && cfg.loginChannelSecret);
}
