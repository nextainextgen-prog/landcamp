"use client";

import { useLinkStatus } from "next/link";

/**
 * Inline pending indicator for a sidebar <Link>. Must be rendered as a
 * descendant of a next/link <Link>. While that link's navigation is in flight
 * (useLinkStatus.pending), a small spinner appears — confirming the click so
 * users don't think the menu is stuck and tap again.
 *
 * The slot is fixed-size and always rendered (only opacity toggles) so it never
 * causes layout shift, per the Next.js useLinkStatus guidance.
 */
export function NavSpinner() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center transition-opacity duration-150 ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
