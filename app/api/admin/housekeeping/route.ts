import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create a housekeeping task. */
export async function POST(req: NextRequest) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { room_id?: string; booking_id?: string; note?: string; assignee?: string; due_date?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin
    .from("housekeeping_tasks")
    .insert({
      room_id: body.room_id || null,
      booking_id: body.booking_id || null,
      note: body.note?.trim() || null,
      assignee: body.assignee?.trim() || null,
      due_date: body.due_date || null,
      status: "pending",
    })
    .select("id, room_id, booking_id, status, assignee, note, due_date, created_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, task: data });
}
