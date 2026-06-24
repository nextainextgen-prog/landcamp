import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, Panel, StatCard, Badge, DataTable, EmptyState } from "@/components/admin/ui";
import { RevenueAreaChart, StatusDonut } from "./DashboardCharts";
import type { BookingStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_TH: Record<BookingStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};
const STATUS_TONE: Record<BookingStatus, "amber" | "blue" | "forest" | "sage" | "neutral" | "red"> = {
  pending_payment: "amber",
  payment_review: "blue",
  confirmed: "forest",
  completed: "sage",
  cancelled: "neutral",
  no_show: "red",
};
const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#d4a24c",
  payment_review: "#5b7fa6",
  confirmed: "#4d584b",
  completed: "#778475",
  cancelled: "#b8b2a6",
  no_show: "#b5654d",
};
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EARNING = new Set(["confirmed", "completed"]);

function bangkokToday(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function thaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export default async function AdminDashboardPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const today = bangkokToday();
  const currentYM = today.slice(0, 7);

  const [{ data: bookingsData }, { data: roomsData }, { data: customersData }] = await Promise.all([
    admin
      .from("bookings")
      .select("id, booking_code, room_id, customer_id, check_in, status, total_amount, created_at")
      .order("created_at", { ascending: false }),
    admin.from("rooms").select("id, name_th, is_available"),
    admin.from("customers").select("id, full_name"),
  ]);

  const bookings = bookingsData ?? [];
  const rooms = roomsData ?? [];
  const roomName = new Map(rooms.map((r) => [r.id as string, r.name_th as string]));
  const customerName = new Map((customersData ?? []).map((c) => [c.id as string, (c.full_name as string) ?? "—"]));

  // KPIs
  let revenueTotal = 0;
  let bookingsThisMonth = 0;
  let pendingReview = 0;
  const statusCounts: Record<string, number> = {};
  const revByMonth = new Map<string, number>();

  for (const b of bookings) {
    const status = b.status as string;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    const created = b.created_at as string;
    if (EARNING.has(status)) {
      revenueTotal += (b.total_amount as number) ?? 0;
      const ym = created.slice(0, 7);
      revByMonth.set(ym, (revByMonth.get(ym) ?? 0) + ((b.total_amount as number) ?? 0));
    }
    if (created.slice(0, 7) === currentYM) bookingsThisMonth += 1;
    if (status === "payment_review") pendingReview += 1;
  }

  // Last 6 months revenue series
  const revenueSeries: { month: string; revenue: number }[] = [];
  const base = new Date(`${currentYM}-01T00:00:00Z`);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const ym = d.toISOString().slice(0, 7);
    revenueSeries.push({ month: MONTHS_TH[d.getUTCMonth()], revenue: revByMonth.get(ym) ?? 0 });
  }

  const donut = (Object.keys(STATUS_COLOR) as BookingStatus[])
    .filter((s) => statusCounts[s])
    .map((s) => ({ name: STATUS_TH[s], value: statusCounts[s], color: STATUS_COLOR[s] }));

  const roomsAvailable = rooms.filter((r) => r.is_available).length;
  const recent = bookings.slice(0, 8);
  const todayCheckins = bookings.filter(
    (b) => b.check_in === today && b.status !== "cancelled",
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ภาพรวม" description="สรุปการจองและรายได้ของ LandCamp" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="clay" label="รายได้รวม" value={`฿${revenueTotal.toLocaleString("en-US")}`} sub="จองที่ยืนยันแล้ว" />
        <StatCard tone="forest" label="จองเดือนนี้" value={bookingsThisMonth} />
        <StatCard tone="ink" label="รอตรวจสลิป" value={pendingReview} sub="ต้องดำเนินการ" />
        <StatCard tone="sage" label="ห้องเปิดจอง" value={`${roomsAvailable}/${rooms.length}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="รายได้ย้อนหลัง 6 เดือน" className="lg:col-span-2">
          <RevenueAreaChart data={revenueSeries} />
        </Panel>
        <Panel title="สัดส่วนสถานะการจอง">
          <StatusDonut data={donut} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="การจองล่าสุด" className="lg:col-span-2" bodyClassName="p-0">
          {recent.length === 0 ? (
            <div className="p-5"><EmptyState>ยังไม่มีการจอง</EmptyState></div>
          ) : (
            <DataTable
              head={
                <tr>
                  <th className="px-5 py-3 font-medium">รหัส</th>
                  <th className="px-5 py-3 font-medium">ลูกค้า</th>
                  <th className="px-5 py-3 font-medium">ห้อง</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 text-right font-medium">ยอด</th>
                </tr>
              }
            >
              {recent.map((b) => (
                <tr key={b.id as string} className="hover:bg-[color:var(--color-bone-soft)]/30">
                  <td className="px-5 py-3">
                    <Link href={`/admin/bookings`} className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">
                      {b.booking_code as string}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{customerName.get(b.customer_id as string) ?? "—"}</td>
                  <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{roomName.get(b.room_id as string) ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[b.status as BookingStatus]}>{STATUS_TH[b.status as BookingStatus]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[color:var(--color-forest-deep)]">
                    ฿{((b.total_amount as number) ?? 0).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <Panel title="เช็คอินวันนี้">
          {todayCheckins.length === 0 ? (
            <EmptyState>วันนี้ไม่มีเช็คอิน</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {todayCheckins.map((b) => (
                <li key={b.id as string} className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--color-bone-soft)]/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[color:var(--color-forest-deep)]">
                      {customerName.get(b.customer_id as string) ?? "—"}
                    </div>
                    <div className="text-xs text-[color:var(--color-ink)]/55">
                      {roomName.get(b.room_id as string) ?? "—"} · {thaiDate(b.check_in as string)}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[b.status as BookingStatus]}>{STATUS_TH[b.status as BookingStatus]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
