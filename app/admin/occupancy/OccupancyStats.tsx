"use client";

import { useMemo } from "react";

import { Metric, MetricStrip } from "@/components/admin/ui";
import type { OccRoom, OccBooking } from "./OccupancyGrid";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

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
    <MetricStrip cols={4}>
      <Metric primary label="เข้าพักวันนี้" value={`${s.occToday}/${s.roomCount}`} foot={`ว่าง ${s.roomCount - s.occToday} ห้อง`} />
      <Metric label="เช็คอินวันนี้" value={s.arrivals} foot="ราย" accent="forest" />
      <Metric label="เช็คเอาท์วันนี้" value={s.departures} foot="ราย" accent="sage" />
      <Metric label="เข้าพักเฉลี่ยเดือนนี้" value={`${s.avgPct}%`} foot={s.monthLabel} accent="forest" />
    </MetricStrip>
  );
}
