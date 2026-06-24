"use client";

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
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">รายได้รวม</div>
          <div className="mt-1 text-2xl font-semibold">฿{total.toLocaleString("en-US")}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">จำนวนการจอง</div>
          <div className="mt-1 text-2xl font-semibold">{count}</div>
        </div>
        <div className="col-span-2 flex items-center sm:col-span-1">
          <button
            type="button"
            onClick={() => downloadCsv(bookings)}
            disabled={bookings.length === 0}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            ดาวน์โหลด CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">เดือน</th>
              <th className="px-4 py-3 font-medium text-center">จำนวน</th>
              <th className="px-4 py-3 font-medium text-right">รายได้</th>
            </tr>
          </thead>
          <tbody>
            {months.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                  ยังไม่มีรายได้
                </td>
              </tr>
            ) : (
              months.map((m) => (
                <tr key={m.month} className="border-t border-neutral-100">
                  <td className="px-4 py-3">{monthLabel(m.month)}</td>
                  <td className="px-4 py-3 text-center">{m.count}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ฿{m.revenue.toLocaleString("en-US")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
