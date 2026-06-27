import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic key→jsonb settings store for simple config pages.
const ALLOWED_KEYS = new Set(["tax", "goals", "routing", "templates", "pdpa", "card_confirm", "card_reminder", "announcement"]);
const MAX_BYTES = 256_000;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { key } = await params;
  if (!ALLOWED_KEYS.has(key)) return NextResponse.json({ error: "unknown setting" }, { status: 400 });

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) return NextResponse.json({ error: "settings unavailable — run migration 016" }, { status: 503 });
  return NextResponse.json({ value: (data?.value as Record<string, unknown>) ?? {} });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { key } = await params;
  if (!ALLOWED_KEYS.has(key)) return NextResponse.json({ error: "unknown setting" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const value = isObj(body) ? (body as { value?: unknown }).value : undefined;
  if (!isObj(value)) return NextResponse.json({ error: "value must be an object" }, { status: 400 });
  if (JSON.stringify(value).length > MAX_BYTES) {
    return NextResponse.json({ error: "value too large" }, { status: 413 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  const { error } = await admin.from("app_settings").upsert({ key, value }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(auth.session.username, "settings.update", { key });
  return NextResponse.json({ ok: true });
}
