/**
 * Public-site feature flags.
 *
 * Online booking is TEMPORARILY OFF — customers are routed to LINE to contact
 * the admin instead of the self-serve booking modal. It is OFF by default and
 * is re-enabled per-environment by setting the kill-switch env var to "true"
 * (NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED=true) once the new booking flow is ready.
 *
 * Customer sign-in (LINE) stays LIVE — ON by default, switched OFF with
 * NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED=false.
 *
 * NEXT_PUBLIC_* is readable on both the client and the server, so the same
 * constant gates UI and API routes.
 */
export const PUBLIC_BOOKING_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED === "true";
export const CUSTOMER_AUTH_ENABLED = process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED !== "false";
