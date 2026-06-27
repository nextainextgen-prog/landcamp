"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPicker } from "@/components/ui/CalendarPicker";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fmtThai(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS_TH[m - 1]} ${y + 543}`;
}

type Preset = "week" | "month" | "quarter" | "custom";

const PRESETS: { key: Exclude<Preset, "custom">; label: string; href: string }[] = [
  { key: "week", label: "สัปดาห์นี้", href: "/admin/dashboard?preset=week" },
  { key: "month", label: "เดือนนี้", href: "/admin/dashboard" },
  { key: "quarter", label: "ไตรมาสนี้", href: "/admin/dashboard?preset=quarter" },
];

/**
 * Dashboard toolbar — choose the period the monthly KPIs cover via quick presets
 * (week / month / quarter) or a custom date range (CalendarPicker), and export
 * the view to PDF. The "today / next 14 days" operational cards stay live.
 */
export function DashboardToolbar({
  from,
  to,
  preset,
}: {
  from: string;
  to: string;
  preset: Preset;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  function openPicker() {
    setRange({ start: null, end: null }); // fresh pick each time
    setOpen((o) => !o);
  }

  function apply() {
    if (range.start && range.end) {
      const a = toISO(range.start);
      const b = toISO(range.end);
      const [f, t] = a <= b ? [a, b] : [b, a];
      router.push(`/admin/dashboard?from=${f}&to=${t}`);
      setOpen(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white px-4 py-3 shadow-[0_18px_44px_-34px_rgba(45,55,40,0.35)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/45">ช่วงข้อมูล</span>

        {/* quick presets */}
        <div className="flex items-center gap-1 rounded-xl bg-[color:var(--color-bone-soft)]/60 p-1">
          {PRESETS.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              scroll={false}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.key
                  ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]"
                  : "text-[color:var(--color-ink)]/60 hover:bg-white"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* custom range */}
        <div className="relative">
          <button
            type="button"
            onClick={openPicker}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === "custom"
                ? "border-[color:var(--color-warm-clay)]/40 bg-[color:var(--color-warm-clay)]/10 text-[color:var(--color-warm-clay)]"
                : "border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {fmtThai(from)} – {fmtThai(to)}
          </button>

          {open && (
            <>
              <button type="button" aria-label="ปิด" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-30 mt-2 w-[320px]">
                <CalendarPicker
                  mode="range"
                  rangeValue={range}
                  onRangeChange={setRange}
                  onConfirm={apply}
                  onCancel={() => setOpen(false)}
                  locale="th"
                  className="border border-[color:var(--color-forest-deep)]/10"
                />
              </div>
            </>
          )}
        </div>
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
