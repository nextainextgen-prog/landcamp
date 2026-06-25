import { NextResponse } from "next/server";

import { holdExpiryCutoffIso } from "@/lib/booking/hold";
import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-triggered run of the "cancel expired holds" job. */
export async function POST() {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const cutoff = holdExpiryCutoffIso(Date.now());
  const { data, error } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cancelled = data?.length ?? 0;
  await logAdminAction(auth.session.username, "cron.clear_expired", { cancelled });
  return NextResponse.json({ cancelled });
}
