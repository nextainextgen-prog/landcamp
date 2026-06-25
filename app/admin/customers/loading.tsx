const CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";
const SHIMMER = "animate-pulse rounded bg-slate-200/70";

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${CARD} flex items-center gap-4 p-4`}>
            <span className={`h-11 w-11 flex-shrink-0 rounded-xl ${SHIMMER}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-2.5 w-20 ${SHIMMER}`} />
              <div className={`h-5 w-16 ${SHIMMER}`} />
              <div className={`h-2 w-24 ${SHIMMER}`} />
            </div>
          </div>
        ))}
      </div>

      {/* List card */}
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className={`h-4 w-28 ${SHIMMER}`} />
          <div className="flex gap-2">
            <div className={`h-9 w-64 rounded-full ${SHIMMER}`} />
            <div className={`h-9 w-24 rounded-full ${SHIMMER}`} />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`h-9 w-9 flex-shrink-0 rounded-full ${SHIMMER}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 w-40 ${SHIMMER}`} />
                <div className={`h-2.5 w-56 ${SHIMMER}`} />
              </div>
              <div className={`h-3 w-16 ${SHIMMER}`} />
              <div className={`h-7 w-20 rounded-full ${SHIMMER}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
