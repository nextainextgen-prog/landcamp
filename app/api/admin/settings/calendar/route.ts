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
    .from("channel_sync")
    .select("airbnb_ical_url, booking_ical_url, agoda_ical_url, export_enabled")
    .eq("id", ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "settings unavailable — run migration 015" }, { status: 503 });
  }

  return NextResponse.json({
    airbnb: (data?.airbnb_ical_url as string) ?? "",
    booking: (data?.booking_ical_url as string) ?? "",
    agoda: (data?.agoda_ical_url as string) ?? "",
    exportEnabled: data?.export_enabled === true,
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
  if (typeof body.airbnb === "string") update.airbnb_ical_url = body.airbnb.trim();
  if (typeof body.booking === "string") update.booking_ical_url = body.booking.trim();
  if (typeof body.agoda === "string") update.agoda_ical_url = body.agoda.trim();
  if (typeof body.exportEnabled === "boolean") update.export_enabled = body.exportEnabled;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  const { error } = await admin.from("channel_sync").upsert({ id: ID, ...update }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
