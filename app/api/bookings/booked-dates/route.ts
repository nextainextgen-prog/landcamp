import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { holdExpiryCutoffIso } from "@/lib/booking/hold";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: the occupied nights for a room, so the customer calendar can show
 * booked-date dots and block already-taken nights. Mirrors the availability
 * rule — confirmed / pending_payment / payment_review count as taken, except
 * pending holds older than the 15-minute cutoff (treated as free).
 */

const pad = (n: number) => String(n).padStart(2, "0");
const utc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
function addDaysISO(s: string, n: number): string {
  const dt = new Date(utc(s) + n * 86_400_000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function bangkokToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const roomId = new URL(request.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const today = bangkokToday();
  const { data, error } = await admin
    .from("bookings")
    .select("check_in, check_out, status, created_at")
    .eq("room_id", roomId)
    .in("status", ["confirmed", "pending_payment", "payment_review"])
    .gte("check_out", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const holdCutoff = holdExpiryCutoffIso(Date.now());
  const dates = new Set<string>();
  for (const b of data ?? []) {
    if (b.status === "pending_payment" && (b.created_at as string) < holdCutoff) continue;
    const ci = b.check_in as string;
    const co = b.check_out as string;
    for (let cur = ci; cur < co; cur = addDaysISO(cur, 1)) {
      if (cur >= today) dates.add(cur);
    }
  }

  return NextResponse.json({ dates: Array.from(dates).sort() });
}
