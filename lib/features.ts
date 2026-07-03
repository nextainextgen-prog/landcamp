/**
 * Public-site feature flags.
 *
 * Online booking is TEMPORARILY OFF — customers are routed to LINE to contact
 * the admin instead of the self-serve booking modal. It is OFF by default and
 * is re-enabled per-environment by setting the kill-switch env var to "true"
 * (NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED=true) once the new booking flow is ready.
 *
 * Customer sign-in (LINE) is TEMPORARILY HIDDEN too — with booking paused a
 * customer account has no purpose, so the profile/sign-in avatar is hidden
 * site-wide. This is forced off in code (independent of any Vercel/local env
 * var) so it's guaranteed hidden everywhere. To restore, set AUTH_PAUSED below
 * to false — auth then follows the env kill-switch again (ON unless
 * NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED=false).
 *
 * NEXT_PUBLIC_* is readable on both the client and the server, so the same
 * constant gates UI and API routes.
 */
// Temporary: hide the customer profile/sign-in UI while booking is paused.
const AUTH_PAUSED: boolean = true;

export const PUBLIC_BOOKING_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED === "true";
export const CUSTOMER_AUTH_ENABLED =
  !AUTH_PAUSED && process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED !== "false";
