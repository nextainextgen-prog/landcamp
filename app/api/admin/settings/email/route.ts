import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = 1;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

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
    .from("email_settings")
    .select("resend_api_key, from_email, from_name, reply_to, enabled")
    .eq("id", ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "settings unavailable — run migration 015" }, { status: 503 });
  }

  return NextResponse.json({
    fromEmail: (data?.from_email as string) ?? "",
    fromName: (data?.from_name as string) ?? "",
    replyTo: (data?.reply_to as string) ?? "",
    enabled: data?.enabled === true,
    apiKeySet: Boolean(data?.resend_api_key),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!isObj(body)) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.fromEmail === "string") update.from_email = body.fromEmail.trim();
  if (typeof body.fromName === "string") update.from_name = body.fromName.trim();
  if (typeof body.replyTo === "string") update.reply_to = body.replyTo.trim();
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (typeof body.resendApiKey === "string" && body.resendApiKey.trim()) {
    update.resend_api_key = body.resendApiKey.trim();
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
  const { error } = await admin.from("email_settings").upsert({ id: ID, ...update }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
