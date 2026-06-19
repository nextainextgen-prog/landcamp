// Vercel project configuration in TypeScript.
//
// @vercel/config is not installed (would require a package.json change), so we
// declare a minimal local type covering only the fields we use. When/if
// @vercel/config is adopted, swap the local type for `import type { VercelConfig }
// from "@vercel/config/v1"`.

type VercelConfig = {
  crons?: Array<{ path: string; schedule: string }>;
};

const config: VercelConfig = {
  crons: [
    // Sweep pending_payment bookings whose 15-minute hold has elapsed.
    { path: "/api/cron/clear-expired-bookings", schedule: "*/5 * * * *" },
  ],
};

export default config;
