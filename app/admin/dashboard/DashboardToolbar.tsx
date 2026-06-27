"use client";

import Link from "next/link";

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function shiftYM(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_TH[m - 1]} ${y + 543}`;
}

const navBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]";

/**
 * Dashboard toolbar — pick which month the monthly KPIs cover (URL ?ym=YYYY-MM)
 * and export the view to PDF via the browser print dialog. The "today / next 14
 * days" operational cards always show live data regardless of the month.
 */
export function DashboardToolbar({ selectedYM, currentYM }: { selectedYM: string; currentYM: string }) {
  const prev = shiftYM(selectedYM, -1);
  const next = shiftYM(selectedYM, 1);
  const isCurrent = selectedYM === currentYM;

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white px-4 py-3 shadow-[0_18px_44px_-34px_rgba(45,55,40,0.35)]">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/45">ข้อมูลเดือน</span>
        <Link href={`/admin/dashboard?ym=${prev}`} aria-label="เดือนก่อนหน้า" className={navBtn} scroll={false}>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="min-w-[140px] text-center text-sm font-semibold text-[color:var(--color-forest-deep)]">{labelYM(selectedYM)}</span>
        <Link href={`/admin/dashboard?ym=${next}`} aria-label="เดือนถัดไป" className={navBtn} scroll={false}>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        {!isCurrent && (
          <Link href="/admin/dashboard" className="ml-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-warm-clay)] transition-colors hover:bg-[color:var(--color-warm-clay)]/10" scroll={false}>
            เดือนนี้
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-xs font-medium text-[color:var(--color-bone)] transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M6 9V3h12v6" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="7" rx="1" />
        </svg>
        บันทึก PDF / พิมพ์
      </button>
    </div>
  );
}
