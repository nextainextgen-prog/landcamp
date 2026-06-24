"use client";

import { useMemo, useState } from "react";
import { DataTable, EmptyState } from "@/components/admin/ui";

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
        className="w-full max-w-sm rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30"
      />

      {rows.length === 0 ? (
        <EmptyState>ไม่พบลูกค้า</EmptyState>
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-5 py-3 font-medium">ชื่อ</th>
              <th className="px-5 py-3 font-medium">ติดต่อ</th>
              <th className="px-5 py-3 text-center font-medium">จอง</th>
              <th className="px-5 py-3 text-right font-medium">ยอดใช้จ่าย</th>
              <th className="px-5 py-3 font-medium">จองล่าสุด</th>
            </tr>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[color:var(--color-bone-soft)]/30">
              <td className="px-5 py-3 font-medium text-[color:var(--color-forest-deep)]">{r.name}</td>
              <td className="px-5 py-3 text-[color:var(--color-ink)]/70">
                <div>{r.email}</div>
                {r.phone && <div className="text-xs text-[color:var(--color-ink)]/45">{r.phone}</div>}
              </td>
              <td className="px-5 py-3 text-center text-[color:var(--color-ink)]/70">{r.bookings_count}</td>
              <td className="px-5 py-3 text-right font-medium text-[color:var(--color-forest-deep)]">
                ฿{r.total_spent.toLocaleString("en-US")}
              </td>
              <td className="px-5 py-3 text-[color:var(--color-ink)]/70">{thaiDate(r.last_booking)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
