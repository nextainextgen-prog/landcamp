"use client";

import { useMemo, type ReactNode } from "react";
import type { OccRoom, OccBooking } from "./OccupancyGrid";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const CARD =
  "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

export function OccupancyStats({ rooms, bookings }: { rooms: OccRoom[]; bookings: OccBooking[] }) {
  const s = useMemo(() => {
    const today = new Date();
    const todayKey = ymd(today);
    const roomCount = rooms.length;
    const active = bookings.filter((b) => b.status !== "cancelled" && b.status !== "no_show");

    const occToday = new Set(
      active.filter((b) => b.check_in <= todayKey && todayKey < b.check_out).map((b) => b.room_id),
    ).size;
    const arrivals = active.filter((b) => b.check_in === todayKey).length;
    const departures = active.filter((b) => b.check_out === todayKey).length;

    const y = today.getFullYear();
    const m = today.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let bookedRoomNights = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = ymd(new Date(y, m, day));
      bookedRoomNights += new Set(
        active.filter((b) => b.check_in <= key && key < b.check_out).map((b) => b.room_id),
      ).size;
    }
    const avgPct =
      roomCount > 0 ? Math.round((bookedRoomNights / (roomCount * daysInMonth)) * 100) : 0;

    return { roomCount, occToday, arrivals, departures, avgPct, monthLabel: TH_MONTHS[m] };
  }, [rooms, bookings]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat
        label="เข้าพักวันนี้"
        value={`${s.occToday}/${s.roomCount}`}
        sub={`ว่าง ${s.roomCount - s.occToday} ห้อง`}
        tone="forest"
        icon={ICONS.bed}
      />
      <Stat label="เช็คอินวันนี้" value={s.arrivals} sub="ราย" tone="sage" icon={ICONS.arrowIn} />
      <Stat label="เช็คเอาท์วันนี้" value={s.departures} sub="ราย" tone="clay" icon={ICONS.arrowOut} />
      <Stat
        label="เข้าพักเฉลี่ยเดือนนี้"
        value={`${s.avgPct}%`}
        sub={s.monthLabel}
        tone="ink"
        icon={ICONS.chart}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone: "forest" | "sage" | "clay" | "ink";
  icon: ReactNode;
}) {
  const tints: Record<string, string> = {
    forest: "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]",
    sage: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)]",
    clay: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]",
    ink: "bg-[color:var(--color-bone-soft)]/70 text-[color:var(--color-ink)]/60",
  };
  return (
    <div className={`${CARD} flex items-center gap-4 p-4`}>
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tints[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/45">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold leading-tight text-[color:var(--color-forest-deep)]">
            {value}
          </span>
          {sub && <span className="text-xs text-[color:var(--color-ink)]/45">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  bed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 18V7m0 7h18m0 4v-6a2 2 0 0 0-2-2H7" /><circle cx="7" cy="10" r="1.4" />
    </svg>
  ),
  arrowIn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M11 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /><path d="M3 12h11m0 0-4-4m4 4-4 4" />
    </svg>
  ),
  arrowOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M13 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" /><path d="M21 12H10m11 0-4-4m4 4-4 4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
};
