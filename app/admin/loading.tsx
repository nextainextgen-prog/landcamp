// Shared loading skeleton for ALL /admin sub-pages. Next.js shows this instantly
// (the sidebar/topbar in app/admin/layout.tsx stay interactive) while the
// server renders the dynamic page, so navigation never feels "stuck".
// A route can override this with its own loading.tsx (e.g. app/admin/customers).

const CARD =
  "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";
const SHIMMER = "animate-pulse rounded bg-[color:var(--color-forest-deep)]/10";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="กำลังโหลด">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className={`h-6 w-48 ${SHIMMER}`} />
        <div className={`h-3 w-72 ${SHIMMER}`} />
      </div>

      {/* Toolbar / filter card */}
      <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
        <div className={`h-8 w-24 rounded-full ${SHIMMER}`} />
        <div className={`h-8 w-24 rounded-full ${SHIMMER}`} />
        <div className={`h-8 w-24 rounded-full ${SHIMMER}`} />
        <div className={`ml-auto h-9 w-32 rounded-xl ${SHIMMER}`} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/12 bg-[color:var(--color-forest-deep)]/[0.09] sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 bg-white px-4 py-4">
            <div className={`h-2.5 w-20 ${SHIMMER}`} />
            <div className={`h-6 w-16 ${SHIMMER}`} />
            <div className={`h-2 w-24 ${SHIMMER}`} />
          </div>
        ))}
      </div>

      {/* Table / list card */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center gap-4 border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/40 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-3 ${SHIMMER}`} style={{ width: `${[12, 14, 16, 14, 14, 10][i]}%` }} />
          ))}
        </div>
        <div className="divide-y divide-[color:var(--color-forest-deep)]/8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className={`h-3.5 w-[12%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[14%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[16%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[14%] ${SHIMMER}`} />
              <div className={`h-3.5 w-[14%] ${SHIMMER}`} />
              <div className={`ml-auto h-7 w-20 rounded-full ${SHIMMER}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
