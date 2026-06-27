// Instant skeleton for /account while the server resolves the customer session
// + profile, so navigating to "บัญชีของฉัน" never shows a blank screen.

const SHIMMER = "animate-pulse rounded bg-[color:var(--color-forest-deep)]/10";

export default function AccountLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="กำลังโหลด">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-6 ${SHIMMER}`} />
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/20" />
        <span className={`h-3 w-28 ${SHIMMER}`} />
      </div>

      <div className="flex items-center gap-5">
        <div className={`h-20 w-20 rounded-full ${SHIMMER}`} />
        <div className="space-y-3">
          <div className={`h-7 w-48 ${SHIMMER}`} />
          <div className={`h-4 w-36 ${SHIMMER}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[22px] border border-[color:var(--color-forest-deep)]/10 bg-white/70 p-6 space-y-3"
          >
            <div className={`h-4 w-24 ${SHIMMER}`} />
            <div className={`h-8 w-16 ${SHIMMER}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
