"use client";

import { useMemo, useState } from "react";
import type { OccRoom, OccBooking } from "./OccupancyGrid";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Cell = { date: Date; key: string; booked: number } | null;

const CARD =
  "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

/** Heatmap tint for a day given its occupancy ratio. */
function tint(booked: number, roomCount: number): { box: string; text: string; full: boolean } {
  if (roomCount === 0 || booked === 0) {
    return { box: "bg-[color:var(--color-sage-mid)]/8", text: "text-[color:var(--color-ink)]/40", full: false };
  }
  const ratio = booked / roomCount;
  if (ratio >= 1) {
    return { box: "bg-[color:var(--color-warm-clay)]", text: "text-white", full: true };
  }
  if (ratio >= 0.5) {
    return { box: "bg-[color:var(--color-warm-clay)]/35", text: "text-[color:var(--color-forest-deep)]", full: false };
  }
  return { box: "bg-[color:var(--color-warm-clay)]/15", text: "text-[color:var(--color-forest-deep)]", full: false };
}

export function MonthCalendar({ rooms, bookings }: { rooms: OccRoom[]; bookings: OccBooking[] }) {
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0); // months from current
  const roomCount = rooms.length;
  const todayKey = ymd(today);

  const active = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled" && b.status !== "no_show"),
    [bookings],
  );

  const view = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const y = base.getFullYear();
    const m = base.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const leading = new Date(y, m, 1).getDay(); // 0 = Sunday

    const cells: Cell[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m, day);
      const key = ymd(date);
      const booked = new Set(
        active.filter((b) => b.check_in <= key && key < b.check_out).map((b) => b.room_id),
      ).size;
      cells.push({ date, key, booked });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    return { cells, label: `${TH_MONTHS[m]} ${y + 543}` };
  }, [offset, today, active]);

  return (
    <section className={CARD}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/8 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">ปฏิทินรายเดือน</h2>
          <span className="text-xs text-[color:var(--color-ink)]/45">{view.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* legend */}
          <div className="hidden items-center gap-2 text-[11px] text-[color:var(--color-ink)]/55 sm:flex">
            <span>ว่าง</span>
            <span className="h-3 w-4 rounded bg-[color:var(--color-sage-mid)]/8 ring-1 ring-inset ring-[color:var(--color-forest-deep)]/10" />
            <span className="h-3 w-4 rounded bg-[color:var(--color-warm-clay)]/15" />
            <span className="h-3 w-4 rounded bg-[color:var(--color-warm-clay)]/35" />
            <span className="h-3 w-4 rounded bg-[color:var(--color-warm-clay)]" />
            <span>เต็ม</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset((o) => o - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">‹</button>
            <button onClick={() => setOffset(0)} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">เดือนนี้</button>
            <button onClick={() => setOffset((o) => o + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">›</button>
          </div>
        </div>
      </header>

      <div className="p-3 sm:p-4">
        {/* weekday header */}
        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[11px] font-medium text-[color:var(--color-ink)]/45">
              {w}
            </div>
          ))}
        </div>
        {/* day cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {view.cells.map((c, i) => {
            if (!c) return <div key={`b-${i}`} className="aspect-square sm:aspect-[4/3]" />;
            const isToday = c.key === todayKey;
            const isPast = c.key < todayKey;
            const t = tint(c.booked, roomCount);
            const free = roomCount - c.booked;
            return (
              <div
                key={c.key}
                title={`${c.date.getDate()} ${view.label} · จอง ${c.booked}/${roomCount} ห้อง`}
                className={`relative flex aspect-square flex-col rounded-lg p-1.5 ring-1 ring-inset ring-[color:var(--color-forest-deep)]/8 transition-colors sm:aspect-[4/3] sm:p-2 ${t.box} ${isPast ? "opacity-55" : ""} ${isToday ? "outline outline-2 outline-[color:var(--color-forest-deep)]" : ""}`}
              >
                <span className={`text-xs font-semibold leading-none ${t.text}`}>{c.date.getDate()}</span>
                <span className="mt-auto leading-tight">
                  {c.booked === 0 ? (
                    <span className="text-[10px] text-[color:var(--color-ink)]/35">ว่าง</span>
                  ) : t.full ? (
                    <span className="text-[10px] font-semibold text-white">เต็ม</span>
                  ) : (
                    <span className={`text-[10px] font-medium ${t.text}`}>
                      จอง {c.booked}/{roomCount}
                      <span className="hidden text-[color:var(--color-ink)]/40 sm:inline"> · ว่าง {free}</span>
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
