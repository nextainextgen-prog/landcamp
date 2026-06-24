"use client";

import { useMemo, useState } from "react";

export type CalBooking = {
  id: string;
  code: string;
  customer: string;
  room: string;
  check_in: string; // YYYY-MM-DD
  check_out: string;
  status: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#d4a24c",
  payment_review: "#5b7fa6",
  confirmed: "#4d584b",
  completed: "#778475",
  cancelled: "#b8b2a6",
  no_show: "#b5654d",
};

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingCalendar({ bookings }: { bookings: CalBooking[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayStr = ymd(now);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = ymd(d);
      const dayBookings = bookings.filter(
        (b) => b.status !== "cancelled" && b.check_in <= key && key < b.check_out,
      );
      return { date: d, key, inMonth: d.getMonth() === month, bookings: dayBookings };
    });
  }, [year, month, bookings]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/8 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">
          {MONTHS[month]} {year + 543}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
            วันนี้
          </button>
          <button onClick={() => shift(-1)} aria-label="prev" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">‹</button>
          <button onClick={() => shift(1)} aria-label="next" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-forest-deep)]/60">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((c) => {
          const isToday = c.key === todayStr;
          return (
            <div
              key={c.key}
              className={`min-h-[104px] border-b border-r border-[color:var(--color-forest-deep)]/6 p-1.5 ${
                c.inMonth ? "bg-white" : "bg-[color:var(--color-bone-soft)]/25"
              }`}
            >
              <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? "bg-[color:var(--color-warm-clay)] font-semibold text-white" : c.inMonth ? "text-[color:var(--color-ink)]/70" : "text-[color:var(--color-ink)]/30"
              }`}>
                {c.date.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {c.bookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    title={`${b.code} · ${b.customer} · ${b.room}`}
                    className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: STATUS_COLOR[b.status] ?? "#888" }}
                  >
                    {b.customer} · {b.room}
                  </div>
                ))}
                {c.bookings.length > 3 && (
                  <div className="px-1 text-[10px] text-[color:var(--color-ink)]/45">+{c.bookings.length - 3} อื่นๆ</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
