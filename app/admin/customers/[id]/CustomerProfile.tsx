"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/admin/ui";
import type { CustomerMetrics } from "@/lib/customers/metrics";
import type { BookingStatus } from "@/types";
import { CustomerTimeline, type TimelineItem } from "./CustomerTimeline";
import { CustomerAnalytics } from "./CustomerAnalytics";
import { CustomerNotifications, type NotifyLogItem } from "./CustomerNotifications";
import {
  VipTagsPanel,
  TaxPanel,
  NotesPanel,
  ContactsPanel,
  type CrmNote,
  type CrmContact,
  type CrmTax,
} from "./CustomerCrm";

export type ProfileBooking = {
  id: string;
  code: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  total: number;
  adults: number;
  children: number;
  createdAt: string;
};

export type ProfilePayment = {
  id: string;
  bookingCode: string;
  roomName: string;
  amount: number;
  kind: "deposit" | "remainder" | "full";
  method: string | null;
  ref: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt: string | null;
  slipUrl: string | null;
  createdAt: string;
};

type ProfileCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  isVip: boolean;
  tags: string[];
  source: string;
  authProvider: string | null;
  createdAt: string;
};

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
const PAY_KIND_TH = { deposit: "มัดจำ", remainder: "ส่วนที่เหลือ", full: "เต็มจำนวน" } as const;
const PAY_STATUS: Record<ProfilePayment["status"], { th: string; tone: "amber" | "forest" | "red" | "neutral" }> = {
  pending: { th: "รอชำระ", tone: "amber" },
  paid: { th: "จ่ายแล้ว", tone: "forest" },
  failed: { th: "ล้มเหลว", tone: "red" },
  refunded: { th: "คืนเงิน", tone: "neutral" },
};
const ACTIVE = new Set<BookingStatus>(["pending_payment", "payment_review", "confirmed"]);

const CARD = "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

function thaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function initials(name: string): string {
  const c = name.trim();
  if (!c || c === "—") return "?";
  const p = c.split(/\s+/).filter(Boolean);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
}
function channelLabel(source: string, provider: string | null): string {
  if (source === "walk_in") return "Walk-in";
  if (provider === "line") return "LINE";
  if (provider === "google") return "Google";
  return "จองออนไลน์";
}
const METHOD_TH: Record<string, string> = {
  transfer: "โอน",
  bank_transfer: "โอน",
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  qr: "QR",
  card: "บัตร",
};
function methodLabel(m: string | null): string {
  if (!m) return "—";
  return METHOD_TH[m] ?? m;
}

/* ── inline icons (declared before TABS, which references them) ── */
const svg = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px]" aria-hidden>{path}</svg>
);
const I = {
  Grid: () => svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
  Calendar: () => svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
  Card: () => svg(<><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>),
  Activity: () => svg(<path d="M3 12h4l3 8 4-16 3 8h4" />),
  Note: () => svg(<><path d="M4 4h16v12l-4 4H4z" /><path d="M16 20v-4h4" /></>),
  Chat: () => svg(<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" />),
  Chart: () => svg(<><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>),
  Plus: () => svg(<path d="M12 5v14M5 12h14" />),
  Dots: () => svg(<><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></>),
  Files: () => svg(<><path d="M4 4h6l2 3h8v11a1 1 0 0 1-1 1H4z" /></>),
  Wallet: () => svg(<><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M16 12h3" /></>),
  Piggy: () => svg(<><path d="M19 9a7 7 0 0 0-13 2 4 4 0 0 0 1 7v2h2v-1.5a8 8 0 0 0 4 0V20h2v-2a7 7 0 0 0 2-5" /><path d="M19 9l2-1M9 8h3" /></>),
  Clock: () => svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  Download: () => svg(<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />),
  Bell: () => svg(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
};

type TabKey = "overview" | "bookings" | "payments" | "files" | "notify" | "timeline" | "notes" | "communications" | "analytics";
const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "ภาพรวม", icon: <I.Grid /> },
  { key: "bookings", label: "การจอง", icon: <I.Calendar /> },
  { key: "payments", label: "การชำระเงิน", icon: <I.Card /> },
  { key: "files", label: "ไฟล์", icon: <I.Files /> },
  { key: "notify", label: "แจ้งเตือน LINE", icon: <I.Bell /> },
  { key: "timeline", label: "ไทม์ไลน์", icon: <I.Activity /> },
  { key: "notes", label: "โน้ต", icon: <I.Note /> },
  { key: "communications", label: "การติดต่อ", icon: <I.Chat /> },
  { key: "analytics", label: "วิเคราะห์", icon: <I.Chart /> },
];

export function CustomerProfile({
  customer,
  metrics,
  bookings,
  payments,
  notes,
  contacts,
  tax,
  timeline,
  totalSpent,
  lineLinked,
  notifyLog,
}: {
  customer: ProfileCustomer;
  metrics: CustomerMetrics;
  bookings: ProfileBooking[];
  payments: ProfilePayment[];
  notes: CrmNote[];
  contacts: CrmContact[];
  tax: CrmTax;
  timeline: TimelineItem[];
  totalSpent: number;
  lineLinked: boolean;
  notifyLog: NotifyLogItem[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");

  const upcoming = useMemo(() => {
    const todayKey = ymd(new Date());
    return bookings
      .filter((b) => ACTIVE.has(b.status) && b.checkIn >= todayKey)
      .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  }, [bookings]);

  const nextStay = upcoming[0];

  const payStats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const p of payments) {
      if (p.status === "paid") paid += p.amount;
      else if (p.status === "pending") pending += p.amount;
    }
    return { paid, pending };
  }, [payments]);
  const slips = useMemo(() => payments.filter((p) => p.slipUrl), [payments]);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header card: identity + KPI ── */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
            {customer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.avatarUrl} alt={customer.name} className="h-16 w-16 flex-shrink-0 rounded-2xl border border-[color:var(--color-forest-deep)]/12 object-cover" />
            ) : (
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-forest-deep)]/8 text-xl font-semibold text-[color:var(--color-forest-deep)]">
                {initials(customer.name)}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold text-[color:var(--color-forest-deep)]">{customer.name}</h1>
                <Badge tone={metrics.segment.tone}>{metrics.segment.label}</Badge>
                {customer.isVip && <Badge tone="amber">★ VIP</Badge>}
                <Badge tone="neutral">{channelLabel(customer.source, customer.authProvider)}</Badge>
              </div>
              <p className="mt-1 text-[13px] text-[color:var(--color-ink)]/50">
                เป็นสมาชิกตั้งแต่ {thaiDate(customer.createdAt)}
                {customer.phone && <> · {customer.phone}</>}
                {customer.email && <> · {customer.email}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/customers" className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">← กลับ</Link>
            <Link href="/admin/walk-in" className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-forest-deep)] px-3.5 py-2 text-sm font-medium text-[color:var(--color-bone)] hover:bg-[color:var(--color-warm-clay)]">
              <I.Plus /> จองให้
            </Link>
            <Kebab email={customer.email} phone={customer.phone} />
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 divide-x divide-y divide-[color:var(--color-forest-deep)]/8 border-t border-[color:var(--color-forest-deep)]/8 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          <Kpi label="จองทั้งหมด" value={metrics.totalBookings} />
          <Kpi label="ยอดรวม" value={`฿${totalSpent.toLocaleString("en-US")}`} />
          <Kpi label="เฉลี่ย/ครั้ง" value={`฿${metrics.avgOrderValue.toLocaleString("en-US")}`} />
          <Kpi label="RFM" value={metrics.rfm.code} sub={`R${metrics.rfm.r}·F${metrics.rfm.f}·M${metrics.rfm.m}`} />
          <Kpi label="CLV (คาด)" value={`฿${metrics.clv.toLocaleString("en-US")}`} />
          <Kpi label="Health" value={String(metrics.health.score)} badge={<Badge tone={metrics.health.tone}>{metrics.health.label}</Badge>} />
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className={`${CARD} flex flex-wrap gap-1 p-1.5`}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]"
                : "text-[color:var(--color-ink)]/60 hover:bg-[color:var(--color-bone-soft)]"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            {nextStay && (
              <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-forest-deep)]/60">การเข้าพักครั้งถัดไป</p>
                  <p className="mt-1 font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{nextStay.roomName}</p>
                  <p className="text-sm text-[color:var(--color-ink)]/55">{thaiDate(nextStay.checkIn)} – {thaiDate(nextStay.checkOut)} · {nextStay.code}</p>
                </div>
                <Badge tone={STATUS_TONE[nextStay.status]}>{STATUS_TH[nextStay.status]}</Badge>
              </div>
            )}
            <SectionCard title="จองล่าสุด">
              {bookings.length === 0 ? <Empty>ยังไม่มีการจอง</Empty> : (
                <BookingTable rows={bookings.slice(0, 5)} />
              )}
            </SectionCard>
          </div>
          <div className="flex flex-col gap-5">
            <SectionCard title="ข้อมูลติดต่อ">
              <dl className="flex flex-col gap-3 text-sm">
                <InfoRow label="อีเมล" value={customer.email || "—"} />
                <InfoRow label="เบอร์โทร" value={customer.phone || "—"} />
                <InfoRow label="ช่องทาง" value={channelLabel(customer.source, customer.authProvider)} />
                <InfoRow label="เป็นสมาชิกตั้งแต่" value={thaiDate(customer.createdAt)} />
              </dl>
            </SectionCard>
            <VipTagsPanel customerId={customer.id} initialIsVip={customer.isVip} initialTags={customer.tags} />
            <TaxPanel customerId={customer.id} initialTax={tax} />
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <SectionCard title={`การจองทั้งหมด (${bookings.length})`}>
          {bookings.length === 0 ? <Empty>ยังไม่มีการจอง</Empty> : <BookingTable rows={bookings} />}
        </SectionCard>
      )}

      {tab === "payments" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PayStat label="ชำระทั้งหมด" value={`฿${payStats.paid.toLocaleString("en-US")}`} tone="sage" icon={<I.Wallet />} />
            <PayStat label="ค้างชำระ" value={`฿${payStats.pending.toLocaleString("en-US")}`} tone="clay" icon={<I.Piggy />} />
            <PayStat label="จำนวนรายการ" value={`${payments.length} รายการ`} tone="forest" icon={<I.Clock />} />
          </div>
          <SectionCard title="ประวัติการชำระเงิน" noPad>
            {payments.length === 0 ? (
              <div className="p-5"><Empty>ยังไม่มีรายการชำระเงิน</Empty></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--color-forest-deep)]/8 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink)]/45">
                      <th className="px-5 py-3.5">วันที่</th>
                      <th className="px-5 py-3.5">การจอง</th>
                      <th className="px-5 py-3.5">ช่องทาง</th>
                      <th className="px-5 py-3.5">อ้างอิง</th>
                      <th className="px-5 py-3.5 text-right">ยอด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[color:var(--color-bone-soft)]/30">
                        <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">
                          {thaiDate(p.paidAt ?? p.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">{p.bookingCode}</span>
                          <span className="ml-2 text-xs text-[color:var(--color-ink)]/40">{PAY_KIND_TH[p.kind]}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">{methodLabel(p.method)}</td>
                        <td className="px-5 py-4 text-[color:var(--color-ink)]/55">{p.ref ?? "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <span className="font-semibold text-[color:var(--color-forest-deep)]">฿{p.amount.toLocaleString("en-US")}</span>
                          <span className="mt-0.5 block">
                            <Badge tone={PAY_STATUS[p.status].tone}>{PAY_STATUS[p.status].th}</Badge>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "files" && (
        <div className="flex flex-col gap-5">
          <SectionCard title={`สลิปการโอนเงิน (${slips.length})`}>
            {slips.length === 0 ? (
              <Empty>ยังไม่มีสลิปการโอน</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {slips.map((p) => (
                  <a
                    key={p.id}
                    href={p.slipUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/30 transition-shadow hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.slipUrl ?? ""} alt={`สลิป ${p.bookingCode}`} className="h-36 w-full bg-white object-contain" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-[12px] text-[color:var(--color-forest-deep)]">{p.bookingCode}</div>
                        <div className="text-[11px] text-[color:var(--color-ink)]/45">{thaiDate(p.paidAt ?? p.createdAt)}</div>
                      </div>
                      <span className="text-[12px] font-semibold text-[color:var(--color-forest-deep)]">฿{p.amount.toLocaleString("en-US")}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={`ใบเสร็จ / ใบยืนยันการจอง (${bookings.length})`} noPad>
            {bookings.length === 0 ? (
              <div className="p-5"><Empty>ยังไม่มีใบเสร็จ</Empty></div>
            ) : (
              <ul className="divide-y divide-[color:var(--color-forest-deep)]/8">
                {bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]"><I.Files /></span>
                      <div className="min-w-0">
                        <div className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">{b.code}</div>
                        <div className="truncate text-xs text-[color:var(--color-ink)]/45">{b.roomName} · {thaiDate(b.checkIn)}</div>
                      </div>
                    </div>
                    <Link
                      href={`/booking/${b.code}`}
                      target="_blank"
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
                    >
                      <I.Download /> ดูใบเสร็จ
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "timeline" && (
        <SectionCard title="ไทม์ไลน์กิจกรรม" noPad>
          {timeline.length === 0 ? <div className="p-5"><Empty>ยังไม่มีกิจกรรม</Empty></div> : <CustomerTimeline items={timeline} />}
        </SectionCard>
      )}

      {tab === "notify" && (
        <CustomerNotifications
          customerId={customer.id}
          lineLinked={lineLinked}
          initialLog={notifyLog}
          bookings={bookings.map((b) => ({
            id: b.id,
            code: b.code,
            roomName: b.roomName,
            status: b.status,
          }))}
        />
      )}

      {tab === "notes" && <NotesPanel customerId={customer.id} initialNotes={notes} />}
      {tab === "communications" && <ContactsPanel customerId={customer.id} initialContacts={contacts} />}

      {tab === "analytics" && (
        <CustomerAnalytics bookings={bookings} payments={payments} metrics={metrics} memberSince={customer.createdAt} />
      )}
    </div>
  );
}

/* ── small building blocks ── */
function Kpi({ label, value, sub, badge }: { label: string; value: ReactNode; sub?: string; badge?: ReactNode }) {
  return (
    <div className="px-5 py-3.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/45">{label}</div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="font-display text-xl font-semibold text-[color:var(--color-forest-deep)]">{value}</span>
        {badge}
      </div>
      {sub && <div className="text-[11px] text-[color:var(--color-ink)]/40">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children, noPad }: { title: string; children: ReactNode; noPad?: boolean }) {
  return (
    <section className={CARD}>
      <header className="border-b border-[color:var(--color-forest-deep)]/8 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{title}</h2>
      </header>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </section>
  );
}

function BookingTable({ rows }: { rows: ProfileBooking[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-forest-deep)]/8 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink)]/45">
            <th className="px-5 py-3">รหัส</th>
            <th className="px-5 py-3">ห้อง</th>
            <th className="px-5 py-3">เข้า–ออก</th>
            <th className="px-5 py-3">สถานะ</th>
            <th className="px-5 py-3 text-right">ยอด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-[color:var(--color-bone-soft)]/30">
              <td className="whitespace-nowrap px-5 py-4">
                <Link href={`/booking/${b.code}`} className="font-mono text-[13px] text-[color:var(--color-forest-deep)] hover:text-[color:var(--color-warm-clay)]">{b.code}</Link>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">{b.roomName}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">{thaiDate(b.checkIn)} – {thaiDate(b.checkOut)}</td>
              <td className="whitespace-nowrap px-5 py-4"><Badge tone={STATUS_TONE[b.status]}>{STATUS_TH[b.status]}</Badge></td>
              <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[color:var(--color-forest-deep)]">฿{b.total.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[color:var(--color-ink)]/50">{label}</dt>
      <dd className="truncate text-right font-medium text-[color:var(--color-forest-deep)]">{value}</dd>
    </div>
  );
}

function PayStat({ label, value, tone, icon }: { label: string; value: string; tone: "sage" | "clay" | "forest"; icon: ReactNode }) {
  const tints: Record<string, string> = {
    sage: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)]",
    clay: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]",
    forest: "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]",
  };
  return (
    <div className={`${CARD} flex items-center gap-4 p-4`}>
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tints[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/45">{label}</div>
        <div className="font-display text-xl font-semibold text-[color:var(--color-forest-deep)]">{value}</div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-forest-deep)]/20 bg-[color:var(--color-bone-soft)]/30 px-6 py-10 text-center text-sm text-[color:var(--color-ink)]/55">
      {children}
    </div>
  );
}

function Kebab({ email, phone }: { email: string; phone: string }) {
  const [open, setOpen] = useState(false);
  const copy = (v: string) => { if (v) void navigator.clipboard?.writeText(v); setOpen(false); };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
        <I.Dots />
      </button>
      {open && (
        <>
          <button type="button" aria-label="close" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white py-1 shadow-xl">
            <button type="button" disabled={!email} onClick={() => copy(email)} className="block w-full px-4 py-2 text-left text-sm text-[color:var(--color-ink)]/75 hover:bg-[color:var(--color-bone-soft)] disabled:opacity-40">คัดลอกอีเมล</button>
            <button type="button" disabled={!phone} onClick={() => copy(phone)} className="block w-full px-4 py-2 text-left text-sm text-[color:var(--color-ink)]/75 hover:bg-[color:var(--color-bone-soft)] disabled:opacity-40">คัดลอกเบอร์โทร</button>
          </div>
        </>
      )}
    </div>
  );
}

