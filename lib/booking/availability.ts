import type { SupabaseClient } from "@supabase/supabase-js";

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

/**
 * Returns { available: false, reason: 'overlap' } when any confirmed or
 * pending_payment booking for the same room overlaps [checkIn, checkOut).
 *
 * Overlap rule (half-open ranges): existing.check_in < new.check_out AND
 * existing.check_out > new.check_in.
 */
export async function checkAvailability(
  supabaseAdmin: SupabaseClient,
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityResult> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .in("status", ["confirmed", "pending_payment", "payment_review"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);

  if (error) {
    return { available: false, reason: error.message };
  }

  if (data && data.length > 0) {
    return { available: false, reason: "overlap" };
  }

  return { available: true };
}
