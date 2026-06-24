"use client";

import { useMemo, useState } from "react";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  bookings_count: number;
  total_spent: number;
  last_booking: string | null;
};

function thaiDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function CustomersList({ initialRows }: { initialRows: CustomerRow[] }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return initialRows;
    return initialRows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.includes(term),
    );
  }, [q, initialRows]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาชื่อ / อีเมล / เบอร์โทร"
        className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          ไม่พบลูกค้า
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">ติดต่อ</th>
                <th className="px-4 py-3 font-medium text-center">จอง</th>
                <th className="px-4 py-3 font-medium text-right">ยอดใช้จ่าย</th>
                <th className="px-4 py-3 font-medium">จองล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-800">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{r.email}</div>
                    {r.phone && <div className="text-xs text-neutral-400">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">{r.bookings_count}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ฿{r.total_spent.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{thaiDate(r.last_booking)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
