import { NextResponse, type NextRequest } from "next/server";

import { holdExpiryCutoffIso } from "@/lib/booking/hold";
import { notifyTeamDailyDigest, sendBookingReminder } from "@/lib/notify/booking";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Send a LINE reminder card this many days before check-in. Adjust here if the
// hotel wants reminders earlier/later.
const REMINDER_DAYS_BEFORE = 1;

/** A date (YYYY-MM-DD) `days` ahead of now, in Asia/Bangkok. */
function bangkokDatePlusDays(nowMs: number, days: number): string {
  const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(nowMs + BKK_OFFSET_MS + days * 86_400_000).toISOString().slice(0, 10);
}

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

  // ── Check-in reminders: send the LINE reminder card to confirmed bookings
  // whose check-in is REMINDER_DAYS_BEFORE away, skipping any already sent. ──
  let reminded = 0;
  try {
    const reminderDate = bangkokDatePlusDays(Date.now(), REMINDER_DAYS_BEFORE);
    const { data: upcoming } = await admin
      .from("bookings")
      .select("id")
      .eq("status", "confirmed")
      .eq("check_in", reminderDate)
      .limit(100);
    const upcomingIds = (upcoming ?? []).map((b) => b.id as string);

    if (upcomingIds.length > 0) {
      // De-dupe against already-sent reminders (notifications log).
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: sentLogs } = await admin
        .from("notifications")
        .select("payload")
        .eq("kind", "card_reminder")
        .eq("status", "sent")
        .gte("created_at", since);
      const alreadySent = new Set(
        (sentLogs ?? [])
          .map((r) => (r.payload as Record<string, unknown> | null)?.booking_id)
          .filter((v): v is string => typeof v === "string"),
      );

      for (const id of upcomingIds) {
        if (alreadySent.has(id)) continue;
        if (await sendBookingReminder(id)) reminded += 1;
      }
    }
  } catch {
    // reminders are best-effort — never fail the cron over them
  }

  // ── Team morning digest: today's arrivals + departures ──
  const digest = await notifyTeamDailyDigest(bangkokDatePlusDays(Date.now(), 0));

  return NextResponse.json({ cancelled: data?.length ?? 0, reminded, digest, cutoff });
}
