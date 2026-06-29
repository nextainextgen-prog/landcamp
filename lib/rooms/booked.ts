/**
 * Per-room occupied nights, computed server-side so the booking calendar can
 * render blocked dates on the first paint — no client round-trips, no
 * "available → full" flicker while two chained fetches resolve.
 *
 * Mirrors /api/bookings/booked-dates exactly: confirmed / pending_payment /
 * payment_review count as taken, except pending holds older than the 15-minute
 * cutoff (treated as free). Keyed by room `slug` (what the landing page knows)
 * and carries the DB `roomId` (UUID) the booking APIs need, so the modal can
 * skip the slug → UUID lookup too.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { holdExpiryCutoffIso } from "@/lib/booking/hold";

export type RoomBooking = { roomId: string; bookedDates: string[] };

const pad = (n: number) => String(n).padStart(2, "0");
const utc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
function addDaysISO(s: string, n: number): string {
  const dt = new Date(utc(s) + n * 86_400_000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function bangkokToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Map of room slug → { roomId, bookedDates } for every room. */
export async function getRoomsBooking(): Promise<Record<string, RoomBooking>> {
  try {
    const admin = createSupabaseAdminClient();

    const { data: rooms } = await admin.from("rooms").select("id, slug");
    if (!rooms || rooms.length === 0) return {};
    const slugById = new Map<string, string>();
    for (const r of rooms) slugById.set(r.id as string, r.slug as string);

    const today = bangkokToday();
    const { data: bookings } = await admin
      .from("bookings")
      .select("room_id, check_in, check_out, status, created_at")
      .in("status", ["confirmed", "pending_payment", "payment_review"])
      .gte("check_out", today);

    const holdCutoff = holdExpiryCutoffIso(Date.now());
    const datesByRoom = new Map<string, Set<string>>();
    for (const b of bookings ?? []) {
      if (b.status === "pending_payment" && (b.created_at as string) < holdCutoff) continue;
      const rid = b.room_id as string;
      let set = datesByRoom.get(rid);
      if (!set) {
        set = new Set<string>();
        datesByRoom.set(rid, set);
      }
      const ci = b.check_in as string;
      const co = b.check_out as string;
      for (let cur = ci; cur < co; cur = addDaysISO(cur, 1)) {
        if (cur >= today) set.add(cur);
      }
    }

    const out: Record<string, RoomBooking> = {};
    for (const [id, slug] of slugById) {
      out[slug] = { roomId: id, bookedDates: Array.from(datesByRoom.get(id) ?? []).sort() };
    }
    return out;
  } catch {
    return {};
  }
}
