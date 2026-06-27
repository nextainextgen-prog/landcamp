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

/**
 * Status tint for a day given its occupancy ratio:
 *   ว่าง (none booked)  → เขียว
 *   มีบางห้องว่าง (partial) → เหลือง (เข้มขึ้นตามสัดส่วนที่จอง)
 *   เต็ม (ratio ≥ 1)     → แดง
 */
function tint(booked: number, roomCount: number): { box: string; text: string; full: boolean } {
  if (roomCount === 0 || booked === 0) {
    return { box: "bg-emerald-500/12", text: "text-emerald-700", full: false };
  }
  const ratio = booked / roomCount;
  if (ratio >= 1) {
    return { box: "bg-red-500", text: "text-white", full: true };
  }
  if (ratio >= 0.5) {
    return { box: "bg-amber-400/55", text: "text-amber-900", full: false };
  }
  return { box: "bg-amber-300/30", text: "text-amber-800", full: false };
}

export function MonthCalendar({ rooms, bookings }: { rooms: OccRoom[]; bookings: OccBooking[] }) {
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0); // months from current
  const [selected, setSelected] = useState<{ date: Date; key: string; booked: number } | null>(null);
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

  // Per-room status for the day the user clicked.
  const dayRooms = useMemo(() => {
    if (!selected) return [];
    return rooms.map((r) => {
      const b = active.find(
        (x) => x.room_id === r.id && x.check_in <= selected.key && selected.key < x.check_out,
      );
      return { room: r, occupied: Boolean(b), code: b?.booking_code ?? null };
    });
  }, [selected, rooms, active]);

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
            <span className="h-3 w-4 rounded bg-emerald-500/12 ring-1 ring-inset ring-emerald-500/25" />
            <span className="h-3 w-4 rounded bg-amber-300/30" />
            <span className="h-3 w-4 rounded bg-amber-400/55" />
            <span className="h-3 w-4 rounded bg-red-500" />
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
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c)}
                title={`${c.date.getDate()} ${view.label} · จอง ${c.booked}/${roomCount} ห้อง — คลิกดูรายห้อง`}
                className={`relative flex aspect-square flex-col rounded-lg p-1.5 text-left ring-1 ring-inset ring-[color:var(--color-forest-deep)]/8 transition-[transform,box-shadow] hover:z-10 hover:shadow-md sm:aspect-[4/3] sm:p-2 ${t.box} ${isPast ? "opacity-55" : ""} ${isToday ? "outline outline-2 outline-[color:var(--color-forest-deep)]" : ""}`}
              >
                <span className={`text-xs font-semibold leading-none ${t.text}`}>{c.date.getDate()}</span>
                <span className="mt-auto leading-tight">
                  {c.booked === 0 ? (
                    <span className="text-[10px] font-medium text-emerald-700">ว่าง</span>
                  ) : t.full ? (
                    <span className="text-[10px] font-semibold text-white">เต็ม</span>
                  ) : (
                    <span className={`text-[10px] font-medium ${t.text}`}>
                      จอง {c.booked}/{roomCount}
                      <span className="hidden opacity-70 sm:inline"> · ว่าง {free}</span>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail — which rooms are free / occupied */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/10 px-5 py-3.5">
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-forest-deep)]">
                  {selected.date.getDate()} {view.label}
                </div>
                <div className="text-[11px] text-[color:var(--color-ink)]/50">
                  จอง {selected.booked}/{roomCount} ห้อง · ว่าง {roomCount - selected.booked}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="ปิด" className="rounded-md p-1 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]/60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-[color:var(--color-forest-deep)]/8 overflow-y-auto">
              {dayRooms.map(({ room, occupied, code }) => (
                <li key={room.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${occupied ? "bg-red-500" : "bg-emerald-500"}`} />
                  <span className="flex-1 text-sm text-[color:var(--color-forest-deep)]">{room.name}</span>
                  {occupied ? (
                    <span className="flex items-center gap-2">
                      {code && <span className="font-mono text-[11px] text-[color:var(--color-ink)]/45">{code}</span>}
                      <span className="text-xs font-medium text-red-600">ไม่ว่าง</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">ว่าง</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
