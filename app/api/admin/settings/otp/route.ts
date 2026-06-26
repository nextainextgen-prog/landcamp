import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = 1;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Clamp a number into [min, max], falling back to `dflt` for non-numbers. */
function clampInt(v: unknown, min: number, max: number, dflt: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Returns settings with secrets masked (never sends raw secrets to the client). */
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
    .from("otp_settings")
    .select(
      "provider, api_key, api_secret, api_base_url, sender_name, otp_length, otp_ttl_seconds, cooldown_seconds, max_attempts, enabled",
    )
    .eq("id", ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "settings unavailable — run migration 022" }, { status: 503 });
  }

  return NextResponse.json({
    provider: (data?.provider as string) ?? "",
    apiBaseUrl: (data?.api_base_url as string) ?? "",
    senderName: (data?.sender_name as string) ?? "",
    otpLength: typeof data?.otp_length === "number" ? data.otp_length : 6,
    otpTtlSeconds: typeof data?.otp_ttl_seconds === "number" ? data.otp_ttl_seconds : 300,
    cooldownSeconds: typeof data?.cooldown_seconds === "number" ? data.cooldown_seconds : 60,
    maxAttempts: typeof data?.max_attempts === "number" ? data.max_attempts : 5,
    enabled: data?.enabled === true,
    apiKeySet: Boolean(data?.api_key),
    apiSecretSet: Boolean(data?.api_secret),
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
  // Non-secret fields: always set (can be cleared).
  if (typeof body.provider === "string") update.provider = body.provider.trim();
  if (typeof body.apiBaseUrl === "string") update.api_base_url = body.apiBaseUrl.trim();
  if (typeof body.senderName === "string") update.sender_name = body.senderName.trim();
  if (body.otpLength !== undefined) update.otp_length = clampInt(body.otpLength, 4, 8, 6);
  if (body.otpTtlSeconds !== undefined) update.otp_ttl_seconds = clampInt(body.otpTtlSeconds, 30, 3600, 300);
  if (body.cooldownSeconds !== undefined) update.cooldown_seconds = clampInt(body.cooldownSeconds, 0, 3600, 60);
  if (body.maxAttempts !== undefined) update.max_attempts = clampInt(body.maxAttempts, 1, 10, 5);
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  // Secrets: only overwrite when a non-empty value is supplied.
  if (typeof body.apiKey === "string" && body.apiKey.trim()) update.api_key = body.apiKey.trim();
  if (typeof body.apiSecret === "string" && body.apiSecret.trim()) update.api_secret = body.apiSecret.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  const { error } = await admin.from("otp_settings").upsert({ id: ID, ...update }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
