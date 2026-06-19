import { NextResponse, type NextRequest } from "next/server";

import { HOLD_DURATION_MS } from "@/lib/booking/hold";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SWEEP_NOTE = "[auto-expired] payment hold elapsed (15min cron sweep)";

type ExpiredRow = { id: string; notes: string | null };

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "supabase init failed",
      },
      { status: 500 },
    );
  }

  const cutoffIso = new Date(Date.now() - HOLD_DURATION_MS).toISOString();

  const { data: rows, error: selectError } = await supabase
    .from("bookings")
    .select("id, notes")
    .eq("status", "pending_payment")
    .lt("created_at", cutoffIso)
    .returns<ExpiredRow[]>();

  if (selectError) {
    return NextResponse.json(
      { error: selectError.message },
      { status: 500 },
    );
  }

  const expired: ExpiredRow[] = rows ?? [];
  if (expired.length === 0) {
    return NextResponse.json({ swept: 0, ids: [], cutoff: cutoffIso });
  }

  const sweptIds: string[] = [];
  for (const row of expired) {
    const nextNotes = row.notes ? `${row.notes}\n${SWEEP_NOTE}` : SWEEP_NOTE;
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled", notes: nextNotes })
      .eq("id", row.id)
      .eq("status", "pending_payment");

    if (updateError) {
      return NextResponse.json(
        {
          error: updateError.message,
          swept: sweptIds.length,
          ids: sweptIds,
          failedId: row.id,
        },
        { status: 500 },
      );
    }
    sweptIds.push(row.id);
  }

  return NextResponse.json({
    swept: sweptIds.length,
    ids: sweptIds,
    cutoff: cutoffIso,
  });
}
