"use client";

import { useMemo, useState } from "react";

export interface CalendarPickerProps {
  mode: "single" | "range";
  value?: Date | null; // single mode
  rangeValue?: { start: Date | null; end: Date | null }; // range mode
  onChange?: (date: Date) => void;
  onRangeChange?: (range: { start: Date | null; end: Date | null }) => void;
  markedDates?: Date[]; // dot indicator (e.g. dates with bookings)
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  showQuickSelect?: boolean; // Today / Tomorrow / More bar (range only)
  locale?: "th" | "en";
  /** Range-mode footer actions — supplied when hosted in a popover. */
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
}

/* ── calendar-date helpers (local Y/M/D — no timezone drift) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const mk = (y: number, m: number, d: number) => new Date(y, m, d);
const addDays = (d: Date, n: number) => mk(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday-first weekday index: Mon=0 … Sun=6. */
const mondayIdx = (d: Date) => (d.getDay() + 6) % 7;
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  Boolean(a && b && key(a) === key(b));

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function Chevron({ dir }: { dir: "left" | "right" | "down" }) {
  const d =
    dir === "left" ? "M15 18l-6-6 6-6" : dir === "right" ? "M9 18l6-6-6-6" : "M6 9l6 6 6-6";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function CalendarPicker({
  mode,
  value,
  rangeValue,
  onChange,
  onRangeChange,
  markedDates,
  minDate,
  maxDate,
  disabledDates,
  showQuickSelect = false,
  locale = "th",
  onConfirm,
  onCancel,
  className = "",
}: CalendarPickerProps) {
  const loc = locale === "th" ? "th-TH" : "en-US";
  const today = useMemo(() => {
    const n = new Date();
    return mk(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const start = rangeValue?.start ?? null;
  const end = rangeValue?.end ?? null;

  // The month currently shown — seeded from the current selection or today.
  const seed = value ?? start ?? today;
  const [cursor, setCursor] = useState({ y: seed.getFullYear(), m: seed.getMonth() });
  const [view, setView] = useState<"days" | "months">("days");
  const [hover, setHover] = useState<Date | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const markedSet = useMemo(() => new Set((markedDates ?? []).map(key)), [markedDates]);
  const disabledSet = useMemo(() => new Set((disabledDates ?? []).map(key)), [disabledDates]);

  const beforeMin = (d: Date) => Boolean(minDate && key(d) < key(minDate));
  const afterMax = (d: Date) => Boolean(maxDate && key(d) > key(maxDate));
  const isDisabled = (d: Date) => beforeMin(d) || afterMax(d) || disabledSet.has(key(d));

  const shiftMonth = (n: number) =>
    setCursor((c) => {
      const t = c.m + n;
      return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });
  const shiftYear = (n: number) => setCursor((c) => ({ ...c, y: c.y + n }));

  /* ── day grid for the cursor month ── */
  const cells = useMemo(() => {
    const first = mk(cursor.y, cursor.m, 1);
    const lead = mondayIdx(first);
    const daysInMonth = mk(cursor.y, cursor.m + 1, 0).getDate();
    const rows = Math.ceil((lead + daysInMonth) / 7);
    const gridStart = addDays(first, -lead);
    return Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  /* ── range click: pick start, then end; restart if crossing a disabled night ── */
  function pickRange(d: Date) {
    if (!start || (start && end)) {
      onRangeChange?.({ start: d, end: null });
      return;
    }
    if (key(d) <= key(start)) {
      onRangeChange?.({ start: d, end: null });
      return;
    }
    // Reject an end that would span a disabled (booked) night — restart instead.
    for (let cur = addDays(start, 1); key(cur) < key(d); cur = addDays(cur, 1)) {
      if (disabledSet.has(key(cur))) {
        onRangeChange?.({ start: d, end: null });
        return;
      }
    }
    onRangeChange?.({ start, end: d });
  }

  function pick(d: Date) {
    if (isDisabled(d)) return;
    if (mode === "single") onChange?.(d);
    else pickRange(d);
  }

  /* ── quick-select presets (range mode) ── */
  const setRange = (s: Date, e: Date) => onRangeChange?.({ start: s, end: e });
  function thisWeekend() {
    // upcoming Friday → Sunday
    const fri = addDays(today, ((5 - today.getDay() + 7) % 7) || 7);
    setRange(fri, addDays(fri, 2));
  }

  const headerLabel =
    view === "days"
      ? mk(cursor.y, cursor.m, 1).toLocaleDateString(loc, { month: "long", year: "numeric" })
      : String(locale === "th" ? cursor.y + 543 : cursor.y);

  const showFooter = mode === "range" && (Boolean(onConfirm) || Boolean(onCancel));

  return (
    <div className={`w-full max-w-[360px] rounded-2xl bg-white p-4 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)] ${className}`}>
      {/* quick-select bar */}
      {mode === "range" && showQuickSelect && view === "days" && (
        <div className="relative mb-3 flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/8 pb-3 text-sm">
          <button type="button" onClick={() => setRange(today, addDays(today, 1))} className="flex-1 text-[color:var(--color-ink)]/70 transition-colors hover:text-[color:var(--color-warm-clay)]">
            วันนี้
          </button>
          <span className="h-4 w-px bg-[color:var(--color-forest-deep)]/12" />
          <button type="button" onClick={() => setRange(addDays(today, 1), addDays(today, 2))} className="flex-1 text-[color:var(--color-ink)]/70 transition-colors hover:text-[color:var(--color-warm-clay)]">
            พรุ่งนี้
          </button>
          <span className="h-4 w-px bg-[color:var(--color-forest-deep)]/12" />
          <div className="flex-1">
            <button type="button" onClick={() => setMoreOpen((v) => !v)} className="mx-auto flex items-center justify-center gap-1 text-[color:var(--color-ink)]/70 transition-colors hover:text-[color:var(--color-warm-clay)]">
              เพิ่มเติม <Chevron dir="down" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white py-1 shadow-lg">
                {[
                  { label: "สุดสัปดาห์นี้", run: thisWeekend },
                  { label: "3 คืน", run: () => setRange(today, addDays(today, 3)) },
                  { label: "7 คืน", run: () => setRange(today, addDays(today, 7)) },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { p.run(); setMoreOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-sm text-[color:var(--color-ink)]/75 transition-colors hover:bg-[color:var(--color-bone-soft)]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="ก่อนหน้า"
          onClick={() => (view === "days" ? shiftMonth(-1) : shiftYear(-1))}
          className="rounded-lg border border-[color:var(--color-forest-deep)]/15 p-1.5 text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          onClick={() => setView((v) => (v === "days" ? "months" : "days"))}
          className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-forest-deep)]"
        >
          {headerLabel} <Chevron dir="down" />
        </button>
        <button
          type="button"
          aria-label="ถัดไป"
          onClick={() => (view === "days" ? shiftMonth(1) : shiftYear(1))}
          className="rounded-lg border border-[color:var(--color-forest-deep)]/15 p-1.5 text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]"
        >
          <Chevron dir="right" />
        </button>
      </div>

      {view === "months" ? (
        /* ── month picker ── */
        <div className="grid grid-cols-3 gap-2 py-2">
          {Array.from({ length: 12 }, (_, i) => {
            const label = mk(2000, i, 1).toLocaleDateString(loc, { month: "short" });
            const isCursor = i === cursor.m;
            const isCurrent = i === today.getMonth() && cursor.y === today.getFullYear();
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setCursor((c) => ({ ...c, m: i })); setView("days"); }}
                className={`rounded-xl py-3 text-sm transition-colors ${
                  isCursor
                    ? "bg-[color:var(--color-warm-clay)] font-semibold text-white"
                    : isCurrent
                      ? "font-semibold text-[color:var(--color-warm-clay)] hover:bg-[color:var(--color-bone-soft)]"
                      : "text-[color:var(--color-ink)]/80 hover:bg-[color:var(--color-bone-soft)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* day headers */}
          <div className="grid grid-cols-7 text-center text-[11px] text-[color:var(--color-ink)]/40">
            {DAY_HEADERS.map((w) => (
              <span key={w} className="py-1">{w}</span>
            ))}
          </div>

          {/* date grid */}
          <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.m;
              const k = key(d);
              const disabled = isDisabled(d);
              const isToday = k === key(today);
              const marked = markedSet.has(k);

              const isStart = mode === "range" && sameDay(d, start);
              const isEnd = mode === "range" && sameDay(d, end);
              const selectedSingle = mode === "single" && sameDay(d, value);
              const between =
                mode === "range" && start && end && key(d) > key(start) && key(d) < key(end);
              const hoverBetween =
                mode === "range" && start && !end && hover && key(d) > key(start) && key(d) <= key(hover);
              const circle = selectedSingle || isStart || isEnd;

              if (!inMonth) {
                return (
                  <div key={i} className="flex h-10 items-center justify-center">
                    <span className="text-sm text-[color:var(--color-ink)]/20">{d.getDate()}</span>
                  </div>
                );
              }

              return (
                <div key={i} className="relative flex h-10 items-center justify-center">
                  {/* range fill layers (full width, no gaps) */}
                  {between && <span className="absolute inset-0 bg-[color:var(--color-warm-clay)]/15" />}
                  {hoverBetween && !between && !isEnd && (
                    <span className="absolute inset-0 bg-[color:var(--color-warm-clay)]/8" />
                  )}
                  {isStart && end && <span className="absolute inset-y-0 left-1/2 right-0 bg-[color:var(--color-warm-clay)]/15" />}
                  {isEnd && start && !sameDay(start, end) && (
                    <span className="absolute inset-y-0 left-0 right-1/2 bg-[color:var(--color-warm-clay)]/15" />
                  )}

                  <button
                    type="button"
                    disabled={disabled}
                    onMouseEnter={() => setHover(d)}
                    onClick={() => pick(d)}
                    title={disabled && marked ? "เต็มแล้ว" : undefined}
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      disabled
                        ? marked
                          ? "cursor-not-allowed text-[color:var(--color-warm-clay)]/80 line-through"
                          : "cursor-not-allowed text-[color:var(--color-ink)]/30 line-through"
                        : circle
                          ? "bg-[color:var(--color-warm-clay)] font-semibold text-white"
                          : isToday
                            ? "font-semibold text-[color:var(--color-warm-clay)] hover:bg-[color:var(--color-bone-soft)]"
                            : "text-[color:var(--color-ink)]/80 hover:bg-[color:var(--color-bone-soft)]"
                    }`}
                  >
                    {d.getDate()}
                    {marked && !circle && (
                      <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[color:var(--color-warm-clay)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* legend — only when there are booked (marked) dates */}
          {(markedDates?.length ?? 0) > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 px-1 text-[11px] text-[color:var(--color-ink)]/55">
              <span className="text-[color:var(--color-warm-clay)]/80 line-through">12</span>
              <span>= เต็มแล้ว เลือกไม่ได้</span>
            </div>
          )}
        </>
      )}

      {/* footer (range, popover host only) */}
      {showFooter && (
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-[color:var(--color-forest-deep)]/8 pt-3">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-[color:var(--color-ink)]/55 transition-colors hover:text-[color:var(--color-ink)]/80">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[color:var(--color-warm-clay)] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)]"
          >
            ตกลง
          </button>
        </div>
      )}
    </div>
  );
}
