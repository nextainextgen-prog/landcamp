// Instant skeleton for the /booking/[code] receipt page while the server
// resolves the session + booking, so the LINE card link never opens to a blank
// screen.

const SHIMMER = "animate-pulse rounded bg-[color:var(--color-forest-deep)]/10";

export default function BookingReceiptLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-12" aria-busy="true" aria-label="กำลังโหลด">
      <div className="space-y-3">
        <div className={`h-4 w-28 ${SHIMMER}`} />
        <div className={`h-9 w-56 ${SHIMMER}`} />
      </div>

      <div className="rounded-[22px] border border-[color:var(--color-forest-deep)]/10 bg-white/70 p-6 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className={`h-3.5 w-28 ${SHIMMER}`} />
            <div className={`h-3.5 w-40 ${SHIMMER}`} />
          </div>
        ))}
        <div className="h-px bg-[color:var(--color-forest-deep)]/10" />
        <div className="flex items-center justify-between gap-4">
          <div className={`h-5 w-20 ${SHIMMER}`} />
          <div className={`h-6 w-28 ${SHIMMER}`} />
        </div>
      </div>
    </div>
  );
}
