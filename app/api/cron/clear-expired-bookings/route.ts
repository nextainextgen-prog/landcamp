import { NextResponse, type NextRequest } from "next/server";

import { holdExpiryCutoffIso } from "@/lib/booking/hold";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancels `pending_payment` bookings whose 15-minute hold (measured from
 * `created_at`) has elapsed, freeing their dates for other guests. Scheduled
 * via vercel.json `crons` once daily (`0 0 * * *`) — the Vercel Hobby plan
 * caps cron frequency, so expired holds may linger until the next daily run.
 *
 * Vercel cron requests carry `Authorization: Bearer ${CRON_SECRET}` when the
 * env var is set; we reject mismatches so the endpoint can't be triggered by
 * arbitrary callers. When CRON_SECRET is unset (e.g. local dev) it runs open.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const cutoff = holdExpiryCutoffIso(Date.now());

  const { data, error } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cancelled: data?.length ?? 0, cutoff });
}
