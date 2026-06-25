"use client";

import {
  Avatar,
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

// ─────────────────────────────────────────────
// DAY — check-ins / staying / check-outs for one day
// ─────────────────────────────────────────────
export function DayView({ bookings, anchor, today }: { bookings: CalBooking[]; anchor: Date; today: string }) {
  const key = ymd(anchor);
  const checkIns = bookings.filter((b) => b.check_in === key);
  const checkOuts = bookings.filter((b) => b.check_out === key);
  const staying = bookings.filter((b) => activeOn(b, key) && b.check_in !== key);

  const groups = [
    { title: "เช็คอินวันนี้", items: checkIns, accent: "#4d584b" },
    { title: "กำลังเข้าพัก", items: staying, accent: "#778475" },
    { title: "เช็คเอาท์วันนี้", items: checkOuts, accent: "#b5654d" },
  ];

  const empty = checkIns.length + checkOuts.length + staying.length === 0;

  return (
    <div className="flex flex-col gap-5 p-5">
      {empty && (
        <p className="py-10 text-center text-sm text-[color:var(--color-ink)]/40">
          ไม่มีรายการในวันนี้
        </p>
      )}
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink)]/55">
              <span className="h-2 w-2 rounded-full" style={{ background: g.accent }} />
              {g.title}
              <span className="text-[color:var(--color-ink)]/35">({g.items.length})</span>
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {g.items.map((b) => (
                <BookingRow key={`${g.title}-${b.id}`} b={b} />
              ))}
            </div>
          </section>
        ))}
      <span className="sr-only">{today}</span>
    </div>
  );
}

function BookingRow({ b }: { b: CalBooking }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white px-3 py-2.5">
      <Avatar name={b.customer} url={b.avatarUrl} vip={b.isVip} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{b.customer}</p>
        <p className="truncate text-xs text-[color:var(--color-ink)]/55">
          {b.room} · {b.guests} คน · {b.nights} คืน
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
        style={{ background: statusColor(b.status) }}
      >
        {statusLabel(b.status)}
      </span>
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
            className={`min-h-[260px] border-r border-[color:var(--color-forest-deep)]/8 last:border-r-0 ${
              isToday ? "bg-[color:var(--color-warm-clay)]/6" : ""
            } ${i % 2 === 1 ? "bg-[color:var(--color-bone-soft)]/15" : ""}`}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/8 px-2 py-2">
              <span className="text-[11px] font-medium uppercase text-[color:var(--color-ink)]/45">
                {WEEKDAYS_TH[d.getDay()]}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-[color:var(--color-warm-clay)] font-semibold text-white" : "text-[color:var(--color-ink)]/70"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-1.5">
              {dayBookings.length === 0 && <span className="px-1 text-[10px] text-[color:var(--color-ink)]/25">—</span>}
              {dayBookings.map((b) => {
                const isCheckIn = b.check_in === key;
                return (
                  <div
                    key={b.id}
                    title={`${b.code} · ${b.customer} · ${b.room}`}
                    className="rounded-md px-1.5 py-1 text-[10px] font-medium text-white"
                    style={{ background: statusColor(b.status) }}
                  >
                    <span className="opacity-80">{isCheckIn ? "▸ " : ""}</span>
                    <span className="truncate">{b.customer}</span>
                    <div className="truncate text-[9px] opacity-80">{b.room}</div>
                  </div>
                );
              })}
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

  const firstOfNext = new Date(year, month, total + 1); // exclusive month end
  const monthStart = new Date(year, month, 1);

  // Booking → {startCol, endColExclusive} clamped to the visible month.
  function span(b: CalBooking): { start: number; end: number } | null {
    const ci = parseYmd(b.check_in);
    const co = parseYmd(b.check_out); // exclusive
    const vis = ci < monthStart ? monthStart : ci;
    const visEnd = co > firstOfNext ? firstOfNext : co;
    if (vis >= visEnd) return null;
    const start = vis.getMonth() === month ? vis.getDate() : 1;
    const end = visEnd.getMonth() === month ? visEnd.getDate() : total + 1;
    return { start, end };
  }

  const DAY = "minmax(34px, 1fr)";
  const template = `repeat(${total}, ${DAY})`;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: total * 34 + 160 }}>
        {/* header: day numbers */}
        <div className="flex border-b border-[color:var(--color-forest-deep)]/8">
          <div className="sticky left-0 z-10 w-40 shrink-0 bg-[color:var(--color-bone-soft)]/50 px-3 py-2 text-[11px] font-semibold uppercase text-[color:var(--color-forest-deep)]/55">
            ห้องพัก
          </div>
          <div className="grid flex-1 bg-[color:var(--color-bone-soft)]/50" style={{ gridTemplateColumns: template }}>
            {days.map((d) => {
              const wd = new Date(year, month, d).getDay();
              const weekend = wd === 0 || wd === 6;
              return (
                <div
                  key={d}
                  className={`py-1.5 text-center text-[10px] ${
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

        {/* one row per room */}
        {rooms.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-[color:var(--color-ink)]/40">ยังไม่มีห้องพัก</p>
        )}
        {rooms.map((room) => {
          const roomBookings = bookings
            .map((b) => (b.roomId === room.id ? { b, s: span(b) } : null))
            .filter((x): x is { b: CalBooking; s: { start: number; end: number } } => Boolean(x && x.s));
          return (
            <div key={room.id} className="flex border-b border-[color:var(--color-forest-deep)]/6">
              <div className="sticky left-0 z-10 flex w-40 shrink-0 items-center bg-white px-3 py-2 text-xs font-medium text-[color:var(--color-forest-deep)]">
                <span className="truncate">{room.name}</span>
              </div>
              <div className="relative grid flex-1" style={{ gridTemplateColumns: template }}>
                {/* background grid cells */}
                {days.map((d) => (
                  <div
                    key={d}
                    className={`h-10 border-r border-[color:var(--color-forest-deep)]/5 ${
                      d === todayCol ? "bg-[color:var(--color-warm-clay)]/8" : ""
                    }`}
                    style={{ gridColumn: `${d} / span 1`, gridRow: 1 }}
                  />
                ))}
                {/* booking bars */}
                {roomBookings.map(({ b, s }) => (
                  <div
                    key={b.id}
                    title={`${b.code} · ${b.customer} · ${thaiShortDate(b.check_in)}–${thaiShortDate(b.check_out)}`}
                    className="z-[1] m-1 flex items-center overflow-hidden rounded-md px-1.5 text-[10px] font-medium text-white"
                    style={{
                      gridColumn: `${s.start} / ${s.end}`,
                      gridRow: 1,
                      background: statusColor(b.status),
                    }}
                  >
                    <span className="truncate">{b.customer}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* legend */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-3">
          {Object.values(STATUS).map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-[color:var(--color-ink)]/55">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
