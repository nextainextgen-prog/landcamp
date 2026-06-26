/**
 * Animated success checkmark — a green circle with a check that pops in and
 * draws itself. Used by ActionButton and ConfirmDialog when an action succeeds.
 * Server-safe (no hooks); animation is pure CSS (see globals.css .lc-check-*).
 */
export function SuccessCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className={`lc-check-pop inline-flex ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
        <circle cx="12" cy="12" r="11" fill="currentColor" className="opacity-15" />
        <path
          d="M7 12.5l3.2 3.2L17 9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lc-check-draw"
        />
      </svg>
    </span>
  );
}

/** Small inline spinner matching the admin theme. */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
