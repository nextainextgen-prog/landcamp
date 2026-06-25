import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = 1;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Returns settings with secrets masked (never sends the raw secret to the client). */
export async function GET() {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin
    .from("line_settings")
    .select(
      "login_channel_id, login_channel_secret, messaging_access_token, messaging_channel_secret, oa_basic_id, team_group_id, add_friend",
    )
    .eq("id", ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "settings unavailable — run migration 013 / 017" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    loginChannelId: (data?.login_channel_id as string) ?? "",
    oaBasicId: (data?.oa_basic_id as string) ?? "",
    teamGroupId: (data?.team_group_id as string) ?? "",
    addFriend: typeof data?.add_friend === "boolean" ? data.add_friend : true,
    loginChannelSecretSet: Boolean(data?.login_channel_secret),
    messagingAccessTokenSet: Boolean(data?.messaging_access_token),
    messagingChannelSecretSet: Boolean(data?.messaging_channel_secret),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  // Non-secret fields: always set (can be cleared).
  if (typeof body.loginChannelId === "string") update.login_channel_id = body.loginChannelId.trim();
  if (typeof body.oaBasicId === "string") update.oa_basic_id = body.oaBasicId.trim();
  if (typeof body.teamGroupId === "string") update.team_group_id = body.teamGroupId.trim();
  if (typeof body.addFriend === "boolean") update.add_friend = body.addFriend;
  // Secrets: only overwrite when a non-empty value is supplied.
  if (typeof body.loginChannelSecret === "string" && body.loginChannelSecret.trim()) {
    update.login_channel_secret = body.loginChannelSecret.trim();
  }
  if (typeof body.messagingAccessToken === "string" && body.messagingAccessToken.trim()) {
    update.messaging_access_token = body.messagingAccessToken.trim();
  }
  if (typeof body.messagingChannelSecret === "string" && body.messagingChannelSecret.trim()) {
    update.messaging_channel_secret = body.messagingChannelSecret.trim();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { error } = await admin
    .from("line_settings")
    .upsert({ id: ID, ...update }, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
