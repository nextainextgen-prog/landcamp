import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { RevenueReport, type RevenueBooking, type MonthRow } from "./RevenueReport";

export const dynamic = "force-dynamic";

const EARNING_STATUSES = ["confirmed", "completed"];

export default async function AdminRevenuePage() {
  if (!(await requireSection("revenue")).ok) redirect("/admin");

  let bookings: RevenueBooking[] = [];
  let months: MonthRow[] = [];
  let total = 0;
  let errorMsg: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("bookings")
      .select("booking_code, status, check_in, check_out, total_amount, created_at")
      .in("status", EARNING_STATUSES)
      .order("created_at", { ascending: false });
    if (error) throw error;

    bookings = (data ?? []).map((b) => ({
      booking_code: b.booking_code as string,
      status: b.status as string,
      check_in: b.check_in as string,
      check_out: b.check_out as string,
      total_amount: (b.total_amount as number) ?? 0,
      created_at: b.created_at as string,
    }));

    const byMonth = new Map<string, { revenue: number; count: number }>();
    for (const b of bookings) {
      const key = b.created_at.slice(0, 7); // YYYY-MM
      const cur = byMonth.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += b.total_amount;
      cur.count += 1;
      byMonth.set(key, cur);
      total += b.total_amount;
    }
    months = [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, v]) => ({ month, revenue: v.revenue, count: v.count }));
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load revenue";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">รายงานรายได้</h1>
        <p className="text-sm text-neutral-500">
          รายได้จากการจองที่ยืนยันแล้ว (confirmed / completed)
        </p>
      </header>
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <RevenueReport total={total} count={bookings.length} months={months} bookings={bookings} />
      )}
    </div>
  );
}
