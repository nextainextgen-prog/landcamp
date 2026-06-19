// 15 minutes — pending_payment bookings older than this are swept by the
// /api/cron/clear-expired-bookings sweeper.
export const HOLD_DURATION_MS = 900_000;

export function isHoldExpired(createdAt: string | Date | number): boolean {
  const createdMs =
    createdAt instanceof Date
      ? createdAt.getTime()
      : new Date(createdAt).getTime();
  return Date.now() - createdMs > HOLD_DURATION_MS;
}
