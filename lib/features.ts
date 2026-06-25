/**
 * Public-site feature flags.
 *
 * The backoffice (/admin) is launched first; the customer-facing booking flow
 * and customer sign-in are kept OFF until they're finished. Both default to
 * disabled and are turned on per-environment by setting the env var to "true"
 * (e.g. on Vercel: NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED=true).
 *
 * NEXT_PUBLIC_* is readable on both the client and the server, so the same
 * constant gates UI and API routes.
 */
export const PUBLIC_BOOKING_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_ENABLED === "true";
export const CUSTOMER_AUTH_ENABLED = process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
