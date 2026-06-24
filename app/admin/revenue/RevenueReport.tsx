"use client";

import { StatCard, Panel, DataTable, EmptyState } from "@/components/admin/ui";

export type RevenueBooking = {
  booking_code: string;
  status: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  created_at: string;
};

export type MonthRow = { month: string; revenue: number; count: number };

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
}

function downloadCsv(bookings: RevenueBooking[]) {
  const header = ["booking_code", "status", "check_in", "check_out", "total_amount", "created_at"];
  const lines = [
    header.join(","),
    ...bookings.map((b) =>
      [b.booking_code, b.status, b.check_in, b.check_out, b.total_amount, b.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `landcamp-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RevenueReport({
  total,
  count,
  months,
  bookings,
}: {
  total: number;
  count: number;
  months: MonthRow[];
  bookings: RevenueBooking[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard tone="clay" label="รายได้รวม" value={`฿${total.toLocaleString("en-US")}`} />
        <StatCard tone="forest" label="จำนวนการจอง" value={count} />
        <div className="col-span-2 flex items-center sm:col-span-1">
          <button
            type="button"
            onClick={() => downloadCsv(bookings)}
            disabled={bookings.length === 0}
            className="w-full rounded-xl bg-[color:var(--color-forest-deep)] px-4 py-3 text-sm font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)] disabled:opacity-40"
          >
            ดาวน์โหลด CSV
          </button>
        </div>
      </div>

      <Panel title="รายได้รายเดือน" bodyClassName="p-0">
        {months.length === 0 ? (
          <div className="p-5"><EmptyState>ยังไม่มีรายได้</EmptyState></div>
        ) : (
          <DataTable
            head={
              <tr>
                <th className="px-5 py-3 font-medium">เดือน</th>
                <th className="px-5 py-3 text-center font-medium">จำนวน</th>
                <th className="px-5 py-3 text-right font-medium">รายได้</th>
              </tr>
            }
          >
            {months.map((m) => (
              <tr key={m.month} className="hover:bg-[color:var(--color-bone-soft)]/30">
                <td className="px-5 py-3 text-[color:var(--color-ink)]/80">{monthLabel(m.month)}</td>
                <td className="px-5 py-3 text-center text-[color:var(--color-ink)]/70">{m.count}</td>
                <td className="px-5 py-3 text-right font-medium text-[color:var(--color-forest-deep)]">
                  ฿{m.revenue.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
