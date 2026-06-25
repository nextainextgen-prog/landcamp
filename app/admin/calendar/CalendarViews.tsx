"use client";

import { useEffect, useRef, useState } from "react";
import {
  STATUS,
  WEEKDAYS_TH,
  addDays,
  daysInMonth,
  parseYmd,
  statusColor,
  statusLabel,
  thaiShortDate,
  weekStart,
  ymd,
  type CalBooking,
  type CalRoom,
} from "./calendar-shared";

function activeOn(b: CalBooking, key: string): boolean {
  return b.check_in <= key && key < b.check_out;
}

function softOf(status: string): string {
  const s = STATUS[status as keyof typeof STATUS];
  return s ? s.soft : "rgba(154,143,125,0.12)";
}

// ─────────────────────────────────────────────
// DAY — rooms as columns, hourly time grid, stays as blocks.
// The grid height is fixed to the viewport (no vertical scroll); only the
// room columns scroll horizontally. The time gutter sticks to the left and
// the room header sticks to the top so staff never lose their bearings.
// (overnight stays use default 14:00 check-in / 12:00 check-out times)
// ─────────────────────────────────────────────
const DAY_START = 8;
const DAY_END = 22;
const MIN_HOUR_PX = 30;
const CHECK_IN_H = 14;
const CHECK_OUT_H = 12;
const PAD = 12; // top/bottom breathing room so the first/last label isn't clipped

export function DayView({
  bookings,
  rooms,
  anchor,
  today,
}: {
  bookings: CalBooking[];
  rooms: CalRoom[];
  anchor: Date;
  today: string;
}) {
  const key = ymd(anchor);
  const isToday = key === today;
  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);

  // Fit 08:00–22:00 into the available viewport height — fixed, no inner
  // vertical scroll; clamp to a minimum row height on very short screens.
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [hourPx, setHourPx] = useState(48);
  const [availH, setAvailH] = useState<number | null>(null);
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const compute = () => {
      const top = wrap.getBoundingClientRect().top;
      const avail = Math.max(380, window.innerHeight - top - 16);
      const headerH = headRef.current?.offsetHeight ?? 56;
      const px = Math.max(MIN_HOUR_PX, (avail - headerH - PAD * 2) / (DAY_END - DAY_START));
      setHourPx(px);
      setAvailH(avail);
    };
    const raf = requestAnimationFrame(compute);
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  // Live "now" indicator (Bangkok time), refreshed each minute.
  useEffect(() => {
    const tick = () => {
      const d = new Date(Date.now() + 7 * 3600 * 1000);
      setNowMin(d.getUTCHours() * 60 + d.getUTCMinutes());
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const bodyH = (DAY_END - DAY_START) * hourPx + PAD * 2;
  const yOf = (hour: number) => PAD + (hour - DAY_START) * hourPx;

  function block(b: CalBooking): { top: number; height: number; from: number; to: number } | null {
    if (b.check_in > key || b.check_out < key) return null;
    if (key === b.check_out && key === b.check_in) return null;
    const from = b.check_in === key ? CHECK_IN_H : DAY_START;
    const to = b.check_out === key ? CHECK_OUT_H : DAY_END;
    if (to <= from) return null;
    return { top: yOf(from), height: (to - from) * hourPx, from, to };
  }

  const colMin = 210;
  const nowTop =
    isToday && nowMin !== null && nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60
      ? yOf(nowMin / 60)
      : null;

  return (
    <div
      ref={wrapRef}
      className="overflow-x-auto overflow-y-hidden"
      style={availH ? { height: availH } : undefined}
    >
      <div className="relative" style={{ minWidth: 64 + rooms.length * colMin }}>
        {/* ── header (sticky top) ── */}
        <div ref={headRef} className="sticky top-0 z-20 flex border-b border-[color:var(--color-forest-deep)]/10 bg-white">
          <div className="sticky left-0 z-30 flex w-16 shrink-0 items-center border-r border-[color:var(--color-forest-deep)]/8 bg-white px-2 py-3 text-[11px] font-medium uppercase text-[color:var(--color-ink)]/45">
            เวลา
          </div>
          {rooms.map((r) => {
            const [primary, ...rest] = r.name.split(" · ");
            const secondary = rest.join(" · ");
            const count = bookings.filter((b) => b.roomId === r.id && block(b)).length;
            return (
              <div
                key={r.id}
                className="flex-1 border-r border-[color:var(--color-forest-deep)]/8 px-3 py-2.5 last:border-r-0"
                style={{ minWidth: colMin }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor("confirmed") }} />
                    <span className="truncate text-sm font-semibold text-[color:var(--color-forest-deep)]" title={r.name}>
                      {primary}
                    </span>
                  </span>
                  {count > 0 && (
                    <span className="shrink-0 rounded-full bg-[color:var(--color-forest-deep)]/8 px-1.5 text-[10px] font-semibold tabular-nums text-[color:var(--color-forest-deep)]/70">
                      {count}
                    </span>
                  )}
                </div>
                {secondary && <p className="truncate pl-3.5 text-[11px] text-[color:var(--color-ink)]/45">{secondary}</p>}
              </div>
            );
          })}
        </div>

        {/* ── body ── */}
        <div className="relative flex" style={{ height: bodyH }}>
          {/* time gutter (sticky left) */}
          <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-[color:var(--color-forest-deep)]/8 bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-[color:var(--color-ink)]/40"
                style={{ top: yOf(h) }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* room columns */}
          {rooms.map((r) => {
            const blocks = bookings
              .filter((b) => b.roomId === r.id)
              .map((b) => ({ b, geo: block(b) }))
              .filter((x): x is { b: CalBooking; geo: NonNullable<ReturnType<typeof block>> } =>
                Boolean(x.geo),
              );
            return (
              <div
                key={r.id}
                className="relative flex-1 border-r border-[color:var(--color-forest-deep)]/8 last:border-r-0"
                style={{ minWidth: colMin }}
              >
                {/* hour bands (zebra) + gridlines */}
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-b border-[color:var(--color-forest-deep)]/6"
                    style={{
                      top: yOf(h),
                      height: hourPx,
                      background: h % 2 === 0 ? "rgba(45,55,40,0.015)" : undefined,
                    }}
                  />
                ))}
                {/* booking blocks */}
                {blocks.map(({ b, geo }) => {
                  const color = statusColor(b.status);
                  return (
                    <div
                      key={b.id}
                      title={`${b.code} · ${b.customer} · ${b.room} · ${statusLabel(b.status)}`}
                      className="absolute left-1 right-1 cursor-default overflow-hidden rounded-lg px-2.5 py-1.5 ring-1 ring-inset ring-black/[0.04] transition-shadow hover:shadow-md"
                      style={{
                        top: geo.top + 2,
                        height: geo.height - 4,
                        background: softOf(b.status),
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <p className="flex items-center gap-1 truncate text-[12px] font-semibold text-[color:var(--color-forest-deep)]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="truncate">{b.customer}</span>
                      </p>
                      {geo.height > 34 && (
                        <p className="truncate text-[11px] text-[color:var(--color-ink)]/55">
                          {String(geo.from).padStart(2, "0")}:00 – {String(geo.to).padStart(2, "0")}:00
                        </p>
                      )}
                      {geo.height > 52 && (
                        <p className="truncate font-mono text-[10px] text-[color:var(--color-ink)]/40">{b.code}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* current-time line */}
          {nowTop !== null && (
            <div className="pointer-events-none absolute left-16 right-0 z-30" style={{ top: nowTop }}>
              <div className="relative h-px bg-[color:var(--color-warm-clay)]">
                <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[color:var(--color-warm-clay)]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WEEK — 7 day columns, each lists that day's stays
// ─────────────────────────────────────────────
export function WeekView({ bookings, anchor, today }: { bookings: CalBooking[]; anchor: Date; today: string }) {
  const start = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-7">
      {days.map((d, i) => {
        const key = ymd(d);
        const isToday = key === today;
        const dayBookings = bookings.filter((b) => activeOn(b, key));
        return (
          <div
            key={key}
            className={`min-h-[320px] border-r border-[color:var(--color-forest-deep)]/8 last:border-r-0 ${
              isToday ? "bg-[color:var(--color-warm-clay)]/6" : i % 2 === 1 ? "bg-[color:var(--color-bone-soft)]/15" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/8 px-2.5 py-2">
              <span className="text-[11px] font-medium uppercase text-[color:var(--color-ink)]/45">
                {WEEKDAYS_TH[d.getDay()]}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-[color:var(--color-forest-deep)] font-semibold text-[color:var(--color-bone)]" : "text-[color:var(--color-ink)]/70"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-2">
              {dayBookings.length === 0 && <span className="px-1 text-[10px] text-[color:var(--color-ink)]/25">—</span>}
              {dayBookings.map((b) => (
                <div
                  key={b.id}
                  title={`${b.code} · ${b.customer} · ${b.room}`}
                  className="overflow-hidden rounded-md px-2 py-1.5"
                  style={{ background: softOf(b.status), borderLeft: `3px solid ${statusColor(b.status)}` }}
                >
                  <p className="truncate text-[11px] font-semibold text-[color:var(--color-forest-deep)]">{b.customer}</p>
                  <p className="truncate text-[10px] text-[color:var(--color-ink)]/55">{b.room}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MONTH — per-room tape chart for the whole month
// ─────────────────────────────────────────────
export function MonthView({
  bookings,
  rooms,
  anchor,
  today,
}: {
  bookings: CalBooking[];
  rooms: CalRoom[];
  anchor: Date;
  today: string;
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const total = daysInMonth(year, month);
  const days = Array.from({ length: total }, (_, i) => i + 1);
  const todayDate = parseYmd(today);
  const todayCol =
    todayDate.getFullYear() === year && todayDate.getMonth() === month ? todayDate.getDate() : -1;

  const firstOfNext = new Date(year, month, total + 1);
  const monthStart = new Date(year, month, 1);

  function span(b: CalBooking): { start: number; end: number } | null {
    const ci = parseYmd(b.check_in);
    const co = parseYmd(b.check_out);
    const vis = ci < monthStart ? monthStart : ci;
    const visEnd = co > firstOfNext ? firstOfNext : co;
    if (vis >= visEnd) return null;
    const start = vis.getMonth() === month ? vis.getDate() : 1;
    const end = visEnd.getMonth() === month ? visEnd.getDate() : total + 1;
    return { start, end };
  }

  const template = `repeat(${total}, minmax(34px, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: total * 34 + 176 }}>
        <div className="flex border-b border-[color:var(--color-forest-deep)]/10">
          <div className="sticky left-0 z-10 w-44 shrink-0 bg-[color:var(--color-bone-soft)]/50 px-4 py-2 text-[11px] font-semibold uppercase text-[color:var(--color-forest-deep)]/55">
            ห้องพัก
          </div>
          <div className="grid flex-1 bg-[color:var(--color-bone-soft)]/50" style={{ gridTemplateColumns: template }}>
            {days.map((d) => {
              const wd = new Date(year, month, d).getDay();
              const weekend = wd === 0 || wd === 6;
              return (
                <div
                  key={d}
                  className={`py-1.5 text-center text-[10px] tabular-nums ${
                    d === todayCol
                      ? "font-bold text-[color:var(--color-warm-clay)]"
                      : weekend
                        ? "text-[color:var(--color-ink)]/35"
                        : "text-[color:var(--color-ink)]/55"
                  }`}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {rooms.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[color:var(--color-ink)]/40">ยังไม่มีห้องพัก</p>
        )}
        {rooms.map((room) => {
          const roomBookings = bookings
            .map((b) => (b.roomId === room.id ? { b, s: span(b) } : null))
            .filter((x): x is { b: CalBooking; s: { start: number; end: number } } => Boolean(x && x.s));
          return (
            <div key={room.id} className="flex border-b border-[color:var(--color-forest-deep)]/6">
              <div className="sticky left-0 z-10 flex w-44 shrink-0 items-center bg-white px-4 py-2 text-xs font-medium text-[color:var(--color-forest-deep)]">
                <span className="truncate">{room.name}</span>
              </div>
              <div className="relative grid flex-1" style={{ gridTemplateColumns: template }}>
                {days.map((d) => (
                  <div
                    key={d}
                    className={`h-11 border-r border-[color:var(--color-forest-deep)]/5 ${
                      d === todayCol ? "bg-[color:var(--color-warm-clay)]/8" : ""
                    }`}
                    style={{ gridColumn: `${d} / span 1`, gridRow: 1 }}
                  />
                ))}
                {roomBookings.map(({ b, s }) => (
                  <div
                    key={b.id}
                    title={`${b.code} · ${b.customer} · ${thaiShortDate(b.check_in)}–${thaiShortDate(b.check_out)}`}
                    className="z-[1] m-1 flex items-center overflow-hidden rounded-md px-2 text-[10px] font-medium text-white"
                    style={{ gridColumn: `${s.start} / ${s.end}`, gridRow: 1, background: statusColor(b.status) }}
                  >
                    <span className="truncate">{b.customer}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LIST — flat table of bookings (filtered) sorted by check-in
// ─────────────────────────────────────────────
export function ListView({ bookings }: { bookings: CalBooking[] }) {
  const rows = [...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in));
  if (rows.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-[color:var(--color-ink)]/40">ไม่มีรายการจองตามตัวกรอง</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-forest-deep)]/8 text-left text-[11px] uppercase text-[color:var(--color-ink)]/45">
            <th className="px-4 py-2.5 font-medium">รหัส</th>
            <th className="px-4 py-2.5 font-medium">ลูกค้า</th>
            <th className="px-4 py-2.5 font-medium">ห้อง</th>
            <th className="px-4 py-2.5 font-medium">เข้า–ออก</th>
            <th className="px-4 py-2.5 text-center font-medium">คืน</th>
            <th className="px-4 py-2.5 text-right font-medium">ยอด</th>
            <th className="px-4 py-2.5 font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-[color:var(--color-forest-deep)]/6 hover:bg-[color:var(--color-bone-soft)]/30">
              <td className="px-4 py-2.5 font-mono text-[12px] text-[color:var(--color-forest-deep)]">{b.code}</td>
              <td className="px-4 py-2.5 text-[color:var(--color-ink)]/80">{b.customer}</td>
              <td className="px-4 py-2.5 text-[color:var(--color-ink)]/70">{b.room}</td>
              <td className="px-4 py-2.5 text-[color:var(--color-ink)]/70">
                {thaiShortDate(b.check_in)} – {thaiShortDate(b.check_out)}
              </td>
              <td className="px-4 py-2.5 text-center text-[color:var(--color-ink)]/70">{b.nights}</td>
              <td className="px-4 py-2.5 text-right font-medium text-[color:var(--color-forest-deep)]">
                ฿{b.total.toLocaleString("en-US")}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: statusColor(b.status) }}
                >
                  {statusLabel(b.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
