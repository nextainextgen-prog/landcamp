"use client";

import { useMemo, useState } from "react";

export type OccRoom = { id: string; name: string };
export type OccBooking = { room_id: string; check_in: string; check_out: string; status: string };

const DAYS = 14;
const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function OccupancyGrid({ rooms, bookings }: { rooms: OccRoom[]; bookings: OccBooking[] }) {
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0); // weeks

  const days = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset * DAYS);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date: d, key: ymd(d) };
    });
  }, [offset, today]);

  // room_id -> Set of occupied night keys
  const occupied = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const b of bookings) {
      if (b.status === "cancelled" || b.status === "no_show") continue;
      let set = map.get(b.room_id);
      if (!set) {
        set = new Set();
        map.set(b.room_id, set);
      }
      for (const d of days) {
        if (b.check_in <= d.key && d.key < b.check_out) set.add(d.key);
      }
    }
    return map;
  }, [bookings, days]);

  const todayKey = ymd(today);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[color:var(--color-ink)]/60">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[color:var(--color-warm-clay)]" /> ไม่ว่าง</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[color:var(--color-sage-mid)]/25" /> ว่าง</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">‹</button>
          <button onClick={() => setOffset(0)} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">วันนี้</button>
          <button onClick={() => setOffset((o) => o + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">›</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[color:var(--color-bone-soft)]/40">
              <th className="sticky left-0 z-10 bg-[color:var(--color-bone-soft)]/40 px-4 py-2.5 text-left text-xs font-medium text-[color:var(--color-forest-deep)]/65">ห้อง</th>
              {days.map((d) => (
                <th key={d.key} className={`px-1 py-2 text-center text-[11px] font-medium ${d.key === todayKey ? "text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-ink)]/55"}`}>
                  <div>{WEEKDAYS[d.date.getDay()]}</div>
                  <div className="text-sm">{d.date.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const set = occupied.get(room.id);
              return (
                <tr key={room.id} className="border-t border-[color:var(--color-forest-deep)]/8">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-forest-deep)]">
                    {room.name}
                  </td>
                  {days.map((d) => {
                    const busy = set?.has(d.key);
                    return (
                      <td key={d.key} className="px-1 py-1">
                        <div
                          title={busy ? "ไม่ว่าง" : "ว่าง"}
                          className={`mx-auto h-7 rounded ${busy ? "bg-[color:var(--color-warm-clay)]" : "bg-[color:var(--color-sage-mid)]/15"}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
