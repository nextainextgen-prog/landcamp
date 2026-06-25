/**
 * How long a freshly created booking is held in `pending_payment` before the
 * clear-expired-bookings cron cancels it and frees the dates. The hold is
 * derived from `bookings.created_at` — there is no dedicated `expires_at`
 * column — so this value must stay in sync between the create route (response
 * countdown) and the cron (cancellation cutoff).
 */
export const BOOKING_HOLD_MINUTES = 15;

export const BOOKING_HOLD_MS = BOOKING_HOLD_MINUTES * 60 * 1000;

/** ISO timestamp marking the cutoff: holds created before this are expired. */
export function holdExpiryCutoffIso(nowMs: number): string {
  return new Date(nowMs - BOOKING_HOLD_MS).toISOString();
}

/** ISO timestamp when a hold created at `createdAtMs` expires. */
export function holdExpiresAtIso(createdAtMs: number): string {
  return new Date(createdAtMs + BOOKING_HOLD_MS).toISOString();
}
