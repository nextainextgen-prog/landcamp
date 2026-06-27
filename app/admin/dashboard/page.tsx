import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, Panel, Metric, MetricStrip, Badge, DataTable, EmptyState } from "@/components/admin/ui";
import { RevenueAreaChart, StatusDonut, BookingTrendChart } from "./DashboardCharts";
import { DashboardToolbar } from "./DashboardToolbar";
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
const OCCUPYING = new Set(["confirmed", "completed"]);
const METHOD_TH: Record<string, string> = { transfer: "โอน", cash: "เงินสด", card: "บัตร", promptpay: "พร้อมเพย์" };

function bangkokToday(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
function baht(n: number): string {
  return `฿${Math.round(n).toLocaleString("en-US")}`;
}
function heatStyle(ratio: number): { background: string; color: string } {
  const a = (0.06 + ratio * 0.82).toFixed(2);
  return { background: `rgba(77,88,75,${a})`, color: ratio > 0.55 ? "rgba(245,241,234,0.95)" : "rgba(26,24,20,0.55)" };
}

type Preset = "week" | "month" | "quarter" | "custom";
const PERIOD_LABEL: Record<Preset, string> = { week: "สัปดาห์นี้", month: "เดือนนี้", quarter: "ไตรมาสนี้", custom: "ช่วงที่เลือก" };
const ymdUTC = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/** Resolve the dashboard view period from search params: custom from/to or a preset. */
function resolvePeriod(sp: { from?: string; to?: string; preset?: string }, today: string): { from: string; to: string; preset: Preset } {
  const isDate = (s?: string) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isDate(sp.from) && isDate(sp.to)) {
    const [f, t] = sp.from! <= sp.to! ? [sp.from!, sp.to!] : [sp.to!, sp.from!];
    return { from: f, to: t, preset: "custom" };
  }
  const d = new Date(`${today}T00:00:00Z`);
  if (sp.preset === "week") {
    const dow = (d.getUTCDay() + 6) % 7; // Mon=0
    const f = new Date(d.getTime() - dow * 86_400_000);
    const t = new Date(f.getTime() + 6 * 86_400_000);
    return { from: ymdUTC(f), to: ymdUTC(t), preset: "week" };
  }
  if (sp.preset === "quarter") {
    const q = Math.floor(d.getUTCMonth() / 3);
    return { from: ymdUTC(new Date(Date.UTC(d.getUTCFullYear(), q * 3, 1))), to: ymdUTC(new Date(Date.UTC(d.getUTCFullYear(), q * 3 + 3, 0))), preset: "quarter" };
  }
  return { from: ymdUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))), to: ymdUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))), preset: "month" };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const today = bangkokToday();
  const sp = await searchParams;
  // The period KPIs cover the selected range (custom ?from&to, or a preset
  // week/month/quarter). Operational cards (today / next 14 days) use real `today`.
  const { from: periodFrom, to: periodTo, preset } = resolvePeriod(sp, today);
  const rangeDays =
    Math.round((Date.parse(`${periodTo}T00:00:00Z`) - Date.parse(`${periodFrom}T00:00:00Z`)) / 86_400_000) + 1;
  const periodLabel = PERIOD_LABEL[preset];
  const sevenDaysAgo = isoDaysAgo(7);

  const [
    { data: bookingsData },
    { data: roomsData },
    { data: customersData },
    { data: paymentsData },
    { count: leadCount },
    { data: leadsRecent },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select("id, booking_code, room_id, customer_id, check_in, check_out, nights, status, total_amount, created_at, source")
      .order("created_at", { ascending: false }),
    admin.from("rooms").select("id, name_th, is_available"),
    admin.from("customers").select("id, full_name, created_at"),
    admin.from("payments").select("booking_id, amount, kind, method, status, paid_at, created_at"),
    admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin.from("leads").select("id, name, phone, checkin_date, created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const bookings = bookingsData ?? [];
  const rooms = roomsData ?? [];
  const payments = paymentsData ?? [];
  const roomCount = rooms.length || 1;
  const roomName = new Map(rooms.map((r) => [r.id as string, r.name_th as string]));
  const customerName = new Map((customersData ?? []).map((c) => [c.id as string, (c.full_name as string) ?? "—"]));

  // ── Aggregates ──
  let revenueTotal = 0;
  let pendingReview = 0;
  let pendingPaymentCount = 0;
  let outstanding = 0;
  let cancelledValueMonth = 0;
  const statusCounts: Record<string, number> = {};
  const revByMonth = new Map<string, number>();

  // hotel metrics (basis: stays whose check-in falls in the current month)
  let revenueMonth = 0;
  let roomNightsMonth = 0;
  let staysMonth = 0;

  for (const b of bookings) {
    const status = b.status as string;
    const total = (b.total_amount as number) ?? 0;
    const created = b.created_at as string;
    const checkIn = b.check_in as string;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    if (EARNING.has(status)) {
      revenueTotal += total;
      revByMonth.set(created.slice(0, 7), (revByMonth.get(created.slice(0, 7)) ?? 0) + total);
      if (checkIn >= periodFrom && checkIn <= periodTo) {
        revenueMonth += total;
        roomNightsMonth += (b.nights as number) ?? 0;
        staysMonth += 1;
      }
    }
    if (status === "payment_review") pendingReview += 1;
    if (status === "pending_payment") {
      pendingPaymentCount += 1;
      outstanding += total;
    }
    if (status === "cancelled" && created.slice(0, 10) >= periodFrom && created.slice(0, 10) <= periodTo) cancelledValueMonth += total;
  }

  // payments (cash flow)
  let collectedMonth = 0;
  const methodCount: Record<string, number> = {};
  for (const p of payments) {
    if (p.status !== "paid") continue;
    const when = ((p.paid_at as string) ?? (p.created_at as string) ?? "").slice(0, 10);
    if (when >= periodFrom && when <= periodTo) collectedMonth += (p.amount as number) ?? 0;
    const m = (p.method as string) || "อื่นๆ";
    methodCount[m] = (methodCount[m] ?? 0) + 1;
  }
  const methodSummary = Object.entries(methodCount)
    .sort((a, b) => b[1] - a[1])
    .map(([m, c]) => `${METHOD_TH[m] ?? m} ${c}`)
    .join(" · ");

  // hotel KPIs
  const occupiedToday = new Set(
    bookings.filter((b) => OCCUPYING.has(b.status as string) && (b.check_in as string) <= today && today < (b.check_out as string)).map((b) => b.room_id as string),
  ).size;
  const occupancyToday = Math.round((occupiedToday / roomCount) * 100);
  const adr = roomNightsMonth > 0 ? revenueMonth / roomNightsMonth : 0;
  const revpar = revenueMonth / (roomCount * rangeDays);
  const alos = staysMonth > 0 ? roomNightsMonth / staysMonth : 0;

  // 6-month revenue series
  const revenueSeries: { month: string; revenue: number }[] = [];
  const base = new Date(`${periodTo.slice(0, 7)}-01T00:00:00Z`);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const ym = d.toISOString().slice(0, 7);
    revenueSeries.push({ month: MONTHS_TH[d.getUTCMonth()], revenue: revByMonth.get(ym) ?? 0 });
  }

  const donut = (Object.keys(STATUS_COLOR) as BookingStatus[])
    .filter((s) => statusCounts[s])
    .map((s) => ({ name: STATUS_TH[s], value: statusCounts[s], color: STATUS_COLOR[s] }));

  // ── Daily operations ──
  const arrivals = bookings.filter((b) => b.check_in === today && b.status !== "cancelled");
  const departures = bookings.filter((b) => b.check_out === today && b.status !== "cancelled");
  const inHouse = bookings.filter(
    (b) => OCCUPYING.has(b.status as string) && (b.check_in as string) <= today && today < (b.check_out as string),
  );

  // ── Pack 4: revenue-by-room, source mix, demand ──
  const baseMs = Date.parse(`${today}T00:00:00Z`);
  const revByRoom = new Map<string, number>();
  const bySource: Record<string, number> = { online: 0, walk_in: 0 };
  const createdCounts = new Map<string, number>();
  let cancelledCount = 0;
  let noShowCount = 0;
  let leadTimeSum = 0;
  let leadTimeN = 0;
  for (const b of bookings) {
    const status = b.status as string;
    const amt = (b.total_amount as number) ?? 0;
    bySource[(b.source as string) === "walk_in" ? "walk_in" : "online"] += 1;
    createdCounts.set((b.created_at as string).slice(0, 10), (createdCounts.get((b.created_at as string).slice(0, 10)) ?? 0) + 1);
    if (status === "cancelled") cancelledCount += 1;
    if (status === "no_show") noShowCount += 1;
    if (EARNING.has(status)) revByRoom.set(b.room_id as string, (revByRoom.get(b.room_id as string) ?? 0) + amt);
    if (status !== "cancelled") {
      const ci = Date.parse(`${b.check_in}T00:00:00Z`);
      const cr = Date.parse(`${(b.created_at as string).slice(0, 10)}T00:00:00Z`);
      if (!Number.isNaN(ci) && !Number.isNaN(cr)) {
        const days = Math.round((ci - cr) / 86_400_000);
        if (days >= 0) {
          leadTimeSum += days;
          leadTimeN += 1;
        }
      }
    }
  }
  const topRooms = [...revByRoom.entries()]
    .map(([id, v]) => ({ name: roomName.get(id) ?? "—", value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxRoomRev = topRooms[0]?.value || 1;
  const totalBookings = bookings.length;
  const cancelRate = totalBookings ? Math.round((cancelledCount / totalBookings) * 100) : 0;
  const noShowRate = totalBookings ? Math.round((noShowCount / totalBookings) * 100) : 0;
  const avgLeadTime = leadTimeN ? Math.round(leadTimeSum / leadTimeN) : 0;
  const sourceDonut = [
    { name: "ออนไลน์", value: bySource.online, color: "#5b7fa6" },
    { name: "Walk-in", value: bySource.walk_in, color: "#d4a24c" },
  ].filter((d) => d.value > 0);

  const trend = (days: number) =>
    Array.from({ length: days }, (_, j) => {
      const d = new Date(baseMs - (days - 1 - j) * 86_400_000);
      return { label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, count: createdCounts.get(d.toISOString().slice(0, 10)) ?? 0 };
    });
  const trendD7 = trend(7);
  const trendD30 = trend(30);
  const trendD90 = trend(90);

  // ── Pack 5: occupancy heatmap (next 14 days) ──
  const heatmap = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(baseMs + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const occ = new Set(
      bookings.filter((b) => b.status !== "cancelled" && b.status !== "no_show" && (b.check_in as string) <= iso && iso < (b.check_out as string)).map((b) => b.room_id as string),
    ).size;
    return { iso, day: d.getUTCDate(), dow: d.getUTCDay(), ratio: occ / roomCount, occ };
  });
  const weekendDays = heatmap.filter((h) => h.dow === 0 || h.dow === 6).slice(0, 2);
  const weekendOcc = weekendDays.length ? Math.round((weekendDays.reduce((s, h) => s + h.ratio, 0) / weekendDays.length) * 100) : 0;

  // ── Pack 6: customers (repeat, top spenders, RFM) ──
  const custAgg = new Map<string, { spent: number; stays: number; last: string | null }>();
  for (const b of bookings) {
    if (!EARNING.has(b.status as string)) continue;
    const cid = b.customer_id as string;
    const cur = custAgg.get(cid) ?? { spent: 0, stays: 0, last: null };
    cur.spent += (b.total_amount as number) ?? 0;
    cur.stays += 1;
    const ci = b.check_in as string;
    if (!cur.last || ci > cur.last) cur.last = ci;
    custAgg.set(cid, cur);
  }
  const withStay = [...custAgg.values()].filter((c) => c.stays >= 1).length;
  const repeatCustomers = [...custAgg.values()].filter((c) => c.stays >= 2).length;
  const repeatRate = withStay ? Math.round((repeatCustomers / withStay) * 100) : 0;
  const topCustomers = [...custAgg.entries()]
    .map(([id, c]) => ({ name: customerName.get(id) ?? "—", spent: c.spent, stays: c.stays }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);
  const custCreated = new Map((customersData ?? []).map((c) => [c.id as string, c.created_at as string]));
  let segNew = (customersData ?? []).length - custAgg.size; // customers with no stay yet = new
  let segRegular = 0;
  let segLapsed = 0;
  for (const [id, agg] of custAgg) {
    const lastD = agg.last ? Math.floor((baseMs - Date.parse(`${agg.last}T00:00:00Z`)) / 86_400_000) : null;
    const created = custCreated.get(id);
    const ageD = created ? Math.floor((baseMs - Date.parse(created)) / 86_400_000) : null;
    if (agg.stays >= 1 && lastD !== null && lastD > 120) segLapsed += 1;
    else if (agg.stays <= 1 || (ageD !== null && ageD <= 60)) segNew += 1;
    else if (agg.stays >= 3 && lastD !== null && lastD <= 90) segRegular += 1;
    else segNew += 1;
  }
  if (segNew < 0) segNew = 0;
  const leads = (leadsRecent ?? []) as Record<string, unknown>[];

  const recent = bookings.slice(0, 8);
  const newLeads = leadCount ?? 0;
  const todayLabel = new Date(today).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="dashboard-print flex flex-col gap-6">
      <PageHeader title="ภาพรวม" description="สรุปการจองและรายได้ของ LandCamp" />

      <DashboardToolbar from={periodFrom} to={periodTo} preset={preset} />

      {/* ── Action Center ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ActionCard href="/admin/bookings" label="รอตรวจสลิป" count={pendingReview} hint="ตรวจและยืนยัน" icon={ICON.slip} active={pendingReview > 0} tone="blue" />
        <ActionCard href="/admin/bookings" label="รอชำระเงิน" count={pendingPaymentCount} hint={outstanding > 0 ? `ค้าง ${baht(outstanding)}` : "ไม่มีค้าง"} icon={ICON.wallet} active={pendingPaymentCount > 0} tone="amber" />
        <ActionCard href="/admin/calendar" label="เช็คอินวันนี้" count={arrivals.length} hint="เตรียมต้อนรับ" icon={ICON.login} active={arrivals.length > 0} tone="forest" />
        <ActionCard href="/admin/customers" label="Lead ใหม่ (7 วัน)" count={newLeads} hint="ติดตามต่อ" icon={ICON.spark} active={newLeads > 0} tone="clay" />
      </div>

      {/* ── Hotel metrics ── */}
      <MetricStrip cols={6}>
        <Metric primary label={`รายได้ ${periodLabel}`} value={baht(revenueMonth)} foot="ตามวันเข้าพัก" />
        <Metric label="Occupancy วันนี้" value={`${occupancyToday}%`} foot={`${occupiedToday}/${roomCount} ห้อง`} accent="forest" />
        <Metric label="ADR" value={baht(adr)} foot="ราคาเฉลี่ย/คืน" accent="sage" />
        <Metric label="RevPAR" value={baht(revpar)} foot="ต่อห้องเปิดขาย" accent="sage" />
        <Metric label="ALOS" value={alos.toFixed(1)} foot="คืน/การเข้าพัก" accent="neutral" />
        <Metric label="Room-nights" value={roomNightsMonth} foot={`ขายได้ ${periodLabel}`} accent="neutral" />
      </MetricStrip>

      {/* ── Daily ops (2/3) + Finance (1/3) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title={`วันนี้ · ${todayLabel}`} className="lg:col-span-2" bodyClassName="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            <OpsTile label="เข้าพัก" value={arrivals.length} tone="forest" icon={ICON.login} />
            <OpsTile label="เช็คเอาท์" value={departures.length} tone="clay" icon={ICON.logout} />
            <OpsTile label="กำลังพักอยู่" value={inHouse.length} tone="sage" icon={ICON.bed} />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <OpsList title="ผู้มาถึงวันนี้" empty="ไม่มีเช็คอิน" rows={arrivals} roomName={roomName} customerName={customerName} />
            <OpsList title="เช็คเอาท์วันนี้" empty="ไม่มีเช็คเอาท์" rows={departures} roomName={roomName} customerName={customerName} />
          </div>
        </Panel>

        <Panel title="การเงิน" bodyClassName="flex flex-col gap-1">
          <FinanceRow label="ค้างชำระ" value={baht(outstanding)} hint={`${pendingPaymentCount} รายการ`} tone="amber" />
          <FinanceRow label={`รับชำระ ${periodLabel}`} value={baht(collectedMonth)} hint={methodSummary || "—"} tone="forest" />
          <FinanceRow label={`ยกเลิก ${periodLabel}`} value={baht(cancelledValueMonth)} hint={`${statusCounts.cancelled ?? 0} รายการรวม`} tone="neutral" />
          <FinanceRow label="รายได้รวมสะสม" value={baht(revenueTotal)} hint="ยืนยันทั้งหมด" tone="sage" last />
        </Panel>
      </div>

      {/* ── Revenue chart + status donut ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="รายได้ย้อนหลัง 6 เดือน" className="lg:col-span-2">
          <RevenueAreaChart data={revenueSeries} />
        </Panel>
        <Panel title="สัดส่วนสถานะการจอง">
          <StatusDonut data={donut} />
        </Panel>
      </div>

      {/* ── Pack 5: Occupancy heatmap ── */}
      <Panel
        title="ห้องว่าง 14 วันข้างหน้า"
        actions={<span className="text-xs text-[color:var(--color-ink)]/55">สุดสัปดาห์หน้า <span className="font-semibold text-[color:var(--color-forest-deep)]">{weekendOcc}%</span> เต็ม</span>}
      >
        <div className="flex flex-wrap gap-1.5">
          {heatmap.map((h) => {
            const pct = Math.round(h.ratio * 100);
            const isWeekend = h.dow === 0 || h.dow === 6;
            const st = heatStyle(h.ratio);
            return (
              <div key={h.iso} className="flex flex-col items-center gap-1" title={`${pct}% เต็ม (${h.occ}/${roomCount} ห้อง)`}>
                <div className="flex h-12 w-9 items-end justify-center rounded-md border border-[color:var(--color-forest-deep)]/10" style={{ background: st.background }}>
                  <span className="pb-1 text-[10px] font-semibold tabular-nums" style={{ color: st.color }}>{pct}%</span>
                </div>
                <span className={`text-[10px] tabular-nums ${isWeekend ? "font-semibold text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-ink)]/45"}`}>{h.day}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-[color:var(--color-ink)]/40">สีเข้ม = ห้องเต็ม · ตัวเลขในกล่อง = % การเข้าพัก · วันสีน้ำตาล = เสาร์–อาทิตย์</p>
      </Panel>

      {/* ── Pack 4: booking trend (with period toggle) + source mix ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="แนวโน้มการจอง" className="lg:col-span-2">
          <BookingTrendChart d7={trendD7} d30={trendD30} d90={trendD90} />
        </Panel>
        <Panel title="ช่องทางการจอง">
          <StatusDonut data={sourceDonut} />
        </Panel>
      </div>

      {/* ── Pack 4: revenue by room + demand ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="รายได้แยกตามห้อง" className="lg:col-span-2">
          {topRooms.length === 0 ? (
            <EmptyState>ยังไม่มีรายได้</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {topRooms.map((r) => (
                <li key={r.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-[color:var(--color-ink)]/75">{r.name}</span>
                    <span className="font-semibold tabular-nums text-[color:var(--color-forest-deep)]">{baht(r.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-bone-soft)]/70">
                    <div className="h-2 rounded-full bg-[color:var(--color-warm-clay)]" style={{ width: `${Math.max(4, (r.value / maxRoomRev) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="ดีมานด์" bodyClassName="flex flex-col gap-1">
          <FinanceRow label="จองล่วงหน้าเฉลี่ย" value={`${avgLeadTime} วัน`} hint="ก่อนวันเข้าพัก" tone="forest" />
          <FinanceRow label="อัตรายกเลิก" value={`${cancelRate}%`} hint={`${cancelledCount} รายการ`} tone="neutral" />
          <FinanceRow label="ไม่มาตามนัด" value={`${noShowRate}%`} hint={`${noShowCount} รายการ`} tone="amber" last />
        </Panel>
      </div>

      {/* ── Pack 6: customers ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="ลูกค้าใช้จ่ายสูงสุด" bodyClassName={topCustomers.length === 0 ? "" : "p-0"}>
          {topCustomers.length === 0 ? (
            <EmptyState>ยังไม่มีข้อมูล</EmptyState>
          ) : (
            <ol className="divide-y divide-slate-100">
              {topCustomers.map((c, i) => (
                <li key={`${c.name}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)]/8 text-[11px] font-semibold text-[color:var(--color-forest-deep)]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{c.name}</span>
                    <span className="block text-[11px] text-[color:var(--color-ink)]/45">{c.stays} ครั้ง</span>
                  </span>
                  <span className="font-semibold tabular-nums text-[color:var(--color-forest-deep)]">{baht(c.spent)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="กลุ่มลูกค้า" bodyClassName="flex flex-col gap-4">
          <div>
            <div className="font-display text-3xl font-semibold tabular-nums text-[color:var(--color-forest-deep)]">{repeatRate}%</div>
            <div className="text-[11px] text-[color:var(--color-ink)]/55">อัตรากลับมาซ้ำ ({repeatCustomers}/{withStay} ที่เคยเข้าพัก)</div>
          </div>
          <div className="flex flex-col gap-1">
            <SegRow label="ใหม่" value={segNew} dot="bg-[color:var(--color-warm-clay)]" />
            <SegRow label="ประจำ" value={segRegular} dot="bg-emerald-500" />
            <SegRow label="ห่างหาย" value={segLapsed} dot="bg-rose-500" last />
          </div>
        </Panel>

        <Panel title="Lead ล่าสุด" bodyClassName={leads.length === 0 ? "" : "p-0"}>
          {leads.length === 0 ? (
            <EmptyState>ยังไม่มี Lead</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {leads.map((l) => (
                <li key={l.id as string} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{(l.name as string) || "—"}</span>
                    <span className="block truncate text-[11px] text-[color:var(--color-ink)]/45">
                      {(l.phone as string) || "—"}{l.checkin_date ? ` · เข้าพัก ${l.checkin_date}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[color:var(--color-ink)]/40">{new Date(l.created_at as string).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Recent bookings ── */}
      <Panel title="การจองล่าสุด" bodyClassName="p-0">
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
                  <Link href="/admin/bookings" className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">
                    {b.booking_code as string}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{customerName.get(b.customer_id as string) ?? "—"}</td>
                <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{roomName.get(b.room_id as string) ?? "—"}</td>
                <td className="px-5 py-3">
                  <Badge tone={STATUS_TONE[b.status as BookingStatus]}>{STATUS_TH[b.status as BookingStatus]}</Badge>
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-[color:var(--color-forest-deep)]">
                  {baht((b.total_amount as number) ?? 0)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}

/* ── Action Center card ─────────────────────────────────────────── */
function ActionCard({
  href,
  label,
  count,
  hint,
  icon,
  active,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  hint: string;
  icon: ReactNode;
  active: boolean;
  tone: "blue" | "amber" | "forest" | "clay";
}) {
  const tints: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    forest: "bg-[color:var(--color-forest-deep)]/12 text-[color:var(--color-forest-deep)]",
    clay: "bg-[color:var(--color-warm-clay)]/15 text-[color:var(--color-warm-clay)]",
  };
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-28px_rgba(45,55,40,0.45)] ${active ? "border-[color:var(--color-warm-clay)]/30" : "border-slate-200/80"}`}
    >
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tints[tone]}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold leading-tight tabular-nums text-[color:var(--color-forest-deep)]">{count}</span>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-warm-clay)]" />}
        </div>
        <div className="truncate text-[11px] text-slate-400">{hint}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-[color:var(--color-warm-clay)]">
        <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/* ── Ops tile ──────────────────────────────────────────────────── */
function OpsTile({ label, value, tone, icon }: { label: string; value: number; tone: "forest" | "clay" | "sage"; icon: ReactNode }) {
  const tints: Record<string, string> = {
    forest: "bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]",
    clay: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]",
    sage: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)]",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[color:var(--color-bone-soft)]/40 px-3.5 py-3">
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tints[tone]}`}>{icon}</span>
      <div>
        <div className="font-display text-2xl font-semibold leading-none tabular-nums text-[color:var(--color-forest-deep)]">{value}</div>
        <div className="mt-1 text-[11px] text-[color:var(--color-ink)]/55">{label}</div>
      </div>
    </div>
  );
}

/* ── Arrivals / departures list ────────────────────────────────── */
function OpsList({
  title,
  empty,
  rows,
  roomName,
  customerName,
}: {
  title: string;
  empty: string;
  rows: Record<string, unknown>[];
  roomName: Map<string, string>;
  customerName: Map<string, string>;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink)]/40">{title}</div>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-[color:var(--color-bone-soft)]/30 px-3 py-4 text-center text-xs text-[color:var(--color-ink)]/45">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.slice(0, 5).map((b) => (
            <li key={b.id as string} className="flex items-center justify-between gap-2 rounded-lg bg-[color:var(--color-bone-soft)]/40 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{customerName.get(b.customer_id as string) ?? "—"}</span>
                <span className="block truncate text-[11px] text-[color:var(--color-ink)]/55">{roomName.get(b.room_id as string) ?? "—"}</span>
              </span>
            </li>
          ))}
          {rows.length > 5 && <li className="px-3 text-[11px] text-[color:var(--color-ink)]/45">+{rows.length - 5} เพิ่มเติม</li>}
        </ul>
      )}
    </div>
  );
}

/* ── Finance row ───────────────────────────────────────────────── */
function FinanceRow({ label, value, hint, tone, last }: { label: string; value: string; hint: string; tone: "amber" | "forest" | "sage" | "neutral"; last?: boolean }) {
  const dot: Record<string, string> = {
    amber: "bg-amber-500",
    forest: "bg-[color:var(--color-forest-deep)]",
    sage: "bg-[color:var(--color-sage-mid)]",
    neutral: "bg-[color:var(--color-sage-light)]",
  };
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 ${last ? "" : "border-b border-slate-100"}`}>
      <span className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]/70">
        <span className={`h-2 w-2 rounded-full ${dot[tone]}`} />
        {label}
      </span>
      <span className="text-right">
        <span className="block font-display text-base font-semibold tabular-nums text-[color:var(--color-forest-deep)]">{value}</span>
        <span className="block text-[10px] text-[color:var(--color-ink)]/45">{hint}</span>
      </span>
    </div>
  );
}

/* ── customer segment row ──────────────────────────────────────── */
function SegRow({ label, value, dot, last }: { label: string; value: number; dot: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${last ? "" : "border-b border-slate-100"}`}>
      <span className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]/70">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-[color:var(--color-forest-deep)]">{value}</span>
    </div>
  );
}

/* ── icons ─────────────────────────────────────────────────────── */
const ICON: Record<string, ReactNode> = {
  slip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M5 3h11l3 3v15l-2-1.2L16 21l-2-1.2L12 21l-2-1.2L8 21l-2-1.2L5 21z" /><path d="M8 8h7M8 12h7" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></svg>,
  login: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>,
  bed: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 7v12M3 13h18v6M21 13v-2a3 3 0 0 0-3-3H8v5" /><circle cx="6.5" cy="10.5" r="1.5" /></svg>,
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>,
};
