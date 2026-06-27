import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendBookingConfirmation } from "@/lib/notify/booking";

/**
 * Mark a booking confirmed + its latest payment paid, write an audit row, and
 * push the LINE confirmation card. Mirrors the admin "confirm" action exactly,
 * so an auto-verified slip lands the booking in the same state as a manual
 * confirm. Audit + notification are best-effort and never throw.
 */
export async function confirmBookingPaid(
  admin: SupabaseClient,
  bookingId: string,
  opts: { actor: string; method?: string | null } = { actor: "auto-verify" },
): Promise<void> {
  await admin.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (payment) {
    await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        ...(opts.method ? { method: opts.method } : {}),
      })
      .eq("id", payment.id);
  }

  try {
    await admin.from("booking_audit").insert({
      booking_id: bookingId,
      actor: opts.actor,
      action: "auto_confirm",
      to_status: "confirmed",
    });
  } catch {
    /* booking_audit may not exist yet — non-fatal */
  }

  // LINE confirmation card to the customer (non-fatal inside).
  await sendBookingConfirmation(bookingId);
}
