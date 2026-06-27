// Instant skeleton for /account/bookings while the server resolves the
// customer session + booking history, so navigation never shows a blank screen.

const SHIMMER = "animate-pulse rounded bg-[color:var(--color-forest-deep)]/10";

export default function AccountBookingsLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="กำลังโหลด">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-6 ${SHIMMER}`} />
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/20" />
        <span className={`h-3 w-28 ${SHIMMER}`} />
      </div>

      <div className={`h-10 w-64 ${SHIMMER}`} />

      <div className="overflow-hidden rounded-[18px] border border-[color:var(--color-forest-deep)]/10 bg-white/70">
        <div className="flex items-center gap-4 bg-[color:var(--color-bone-soft)]/70 px-5 py-3">
          {[16, 14, 18, 12, 10].map((w, i) => (
            <div key={i} className={`h-3 ${SHIMMER}`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="divide-y divide-[color:var(--color-forest-deep)]/8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-5">
              <div className={`h-3.5 w-[16%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[14%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[18%] ${SHIMMER}`} />
              <div className={`h-6 w-[12%] rounded-full ${SHIMMER}`} />
              <div className={`ml-auto h-3.5 w-[10%] ${SHIMMER}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
