import type { SupabaseClient } from "@supabase/supabase-js";

import { holdExpiryCutoffIso } from "@/lib/booking/hold";

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

/**
 * Returns { available: false, reason: 'overlap' } when any confirmed or
 * pending_payment booking for the same room overlaps [checkIn, checkOut).
 *
 * Overlap rule (half-open ranges): existing.check_in < new.check_out AND
 * existing.check_out > new.check_in.
 *
 * Expired 15-minute holds (`pending_payment` rows older than the hold cutoff)
 * are treated as free even if the once-daily cleanup cron hasn't swept them yet,
 * so an abandoned hold no longer blocks the dates for up to a day.
 */
export async function checkAvailability(
  supabaseAdmin: SupabaseClient,
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityResult> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, status, created_at")
    .eq("room_id", roomId)
    .in("status", ["confirmed", "pending_payment", "payment_review"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(20);

  if (error) {
    return { available: false, reason: error.message };
  }

  const holdCutoff = holdExpiryCutoffIso(Date.now());
  const blocking = (data ?? []).filter(
    (b) =>
      !(b.status === "pending_payment" && (b.created_at as string) < holdCutoff),
  );

  if (blocking.length > 0) {
    return { available: false, reason: "overlap" };
  }

  return { available: true };
}
