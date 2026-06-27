"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPicker } from "./CalendarPicker";

/* ── ISO <-> Date adapters (the whole codebase stores "YYYY-MM-DD" strings) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromISO(s?: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

interface CalendarFieldProps {
  mode: "single" | "range";
  /** single mode */
  value?: string;
  onChange?: (iso: string) => void;
  /** range mode */
  start?: string;
  end?: string;
  onRangeChange?: (r: { start: string; end: string }) => void;
  markedDates?: string[];
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
  showQuickSelect?: boolean;
  locale?: "th" | "en";
  placeholder?: string;
  /** applied to the trigger button so it matches surrounding inputs */
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[color:var(--color-ink)]/45" aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

export function CalendarField({
  mode,
  value,
  onChange,
  start,
  end,
  onRangeChange,
  markedDates,
  disabledDates,
  minDate,
  maxDate,
  showQuickSelect = false,
  locale = "th",
  placeholder = "เลือกวันที่",
  className = "",
  align = "left",
  disabled = false,
}: CalendarFieldProps) {
  const loc = locale === "th" ? "th-TH" : "en-US";
  const [open, setOpen] = useState(false);
  // Range edits are staged until "ตกลง" so "ยกเลิก" can discard them.
  const [draft, setDraft] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const rootRef = useRef<HTMLDivElement>(null);

  // Seed the staged range from props when opening (event-driven, not in an effect).
  const toggle = () => {
    if (!open) setDraft({ start: fromISO(start), end: fromISO(end) });
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fmt = (iso?: string) => {
    const d = fromISO(iso);
    return d ? d.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" }) : "";
  };

  const label =
    mode === "single"
      ? fmt(value) || placeholder
      : start && end
        ? `${fmt(start)} – ${fmt(end)}`
        : start
          ? `${fmt(start)} – …`
          : placeholder;

  const hasValue = mode === "single" ? Boolean(value) : Boolean(start);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`flex w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <CalIcon />
        <span className={`flex-1 truncate ${hasValue ? "" : "opacity-50"}`}>{label}</span>
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 w-[336px] max-w-[calc(100vw-2rem)] ${align === "right" ? "right-0" : "left-0"} motion-safe:animate-[fadeIn_.12s_ease-out]`}>
          <CalendarPicker
            mode={mode}
            locale={locale}
            value={fromISO(value)}
            rangeValue={draft}
            markedDates={markedDates?.map((s) => fromISO(s)).filter((d): d is Date => Boolean(d))}
            disabledDates={disabledDates?.map((s) => fromISO(s)).filter((d): d is Date => Boolean(d))}
            minDate={fromISO(minDate) ?? undefined}
            maxDate={fromISO(maxDate) ?? undefined}
            showQuickSelect={showQuickSelect}
            onChange={(d) => {
              onChange?.(toISO(d));
              setOpen(false);
            }}
            onRangeChange={(r) => setDraft(r)}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              if (draft.start && draft.end) {
                onRangeChange?.({ start: toISO(draft.start), end: toISO(draft.end) });
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
