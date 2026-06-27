/**
 * Public-site feature flags.
 *
 * Online booking and customer sign-in are LIVE. They are ON by default and can
 * be switched OFF per-environment with a kill-switch env var set to "false"
 * (e.g. NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED=false).
 *
 * NEXT_PUBLIC_* is readable on both the client and the server, so the same
 * constant gates UI and API routes.
 */
export const PUBLIC_BOOKING_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED !== "false";
export const CUSTOMER_AUTH_ENABLED = process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED !== "false";
