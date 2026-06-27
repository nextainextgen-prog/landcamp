"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CustomerMetrics } from "@/lib/customers/metrics";
import type { BookingStatus } from "@/types";
import type { ProfileBooking, ProfilePayment } from "./CustomerProfile";

const CLAY = "#9a795b";
const FOREST = "#4d584b";
const SAGE = "#778475";
const CARD = "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

const TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EARNING = new Set<BookingStatus>(["confirmed", "completed"]);

const STATUS_META: Record<BookingStatus, { th: string; color: string }> = {
  confirmed: { th: "ยืนยันแล้ว", color: FOREST },
  completed: { th: "เสร็จสิ้น", color: SAGE },
  pending_payment: { th: "รอชำระ", color: "#cf9b46" },
  payment_review: { th: "รอตรวจสลิป", color: "#5b8baf" },
  cancelled: { th: "ยกเลิก", color: "#b9b2a6" },
  no_show: { th: "ไม่มาตามนัด", color: "#c0563f" },
};

const METHOD_TH: Record<string, string> = {
  transfer: "โอน", bank_transfer: "โอน", cash: "เงินสด", promptpay: "พร้อมเพย์", qr: "QR", card: "บัตร",
};
const methodLabel = (m: string | null) => (m ? METHOD_TH[m] ?? m : "ไม่ระบุ");

function nights(b: ProfileBooking): number {
  const n = Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86_400_000);
  return Math.max(1, n);
}

export function CustomerAnalytics({
  bookings,
  payments,
  metrics,
  memberSince,
}: {
  bookings: ProfileBooking[];
  payments: ProfilePayment[];
  metrics: CustomerMetrics;
  memberSince: string;
}) {
  // Grow every colored bar / meter from 0 on mount so the page animates in.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const a = useMemo(() => {
    const n = bookings.length;
    const earn = bookings.filter((b) => EARNING.has(b.status));
    const avgNights = n > 0 ? Math.round((bookings.reduce((s, b) => s + nights(b), 0) / n) * 10) / 10 : 0;
    const avgGuests = n > 0 ? Math.round((bookings.reduce((s, b) => s + b.adults + b.children, 0) / n) * 10) / 10 : 0;

    const tenureMonths = Math.max(0, Math.round((new Date().getTime() - new Date(memberSince).getTime()) / (30 * 86_400_000)));
    const tenureYears = Math.max(tenureMonths / 12, 0.5);
    const freqPerYear = n > 0 ? Math.round((n / tenureYears) * 10) / 10 : 0;

    // avg gap between consecutive bookings (days)
    const sorted = [...bookings].sort((x, y) => (x.createdAt < y.createdAt ? -1 : 1));
    let gapSum = 0, gapN = 0;
    for (let i = 1; i < sorted.length; i++) {
      gapSum += Math.round((new Date(sorted[i].createdAt).getTime() - new Date(sorted[i - 1].createdAt).getTime()) / 86_400_000);
      gapN += 1;
    }
    const avgGap = gapN > 0 ? Math.round(gapSum / gapN) : null;

    // monthly spend (earning, by createdAt) — last 12 buckets
    const mMap = new Map<number, { label: string; amount: number }>();
    for (const b of earn) {
      const d = new Date(b.createdAt);
      const key = d.getFullYear() * 12 + d.getMonth();
      const cur = mMap.get(key) ?? { label: TH_MON[d.getMonth()], amount: 0 };
      cur.amount += b.total;
      mMap.set(key, cur);
    }
    const monthly = [...mMap.entries()].sort((x, y) => x[0] - y[0]).slice(-12).map(([, v]) => v);

    // status breakdown
    const sMap = new Map<BookingStatus, number>();
    for (const b of bookings) sMap.set(b.status, (sMap.get(b.status) ?? 0) + 1);
    const statusData = [...sMap.entries()].map(([k, v]) => ({ name: STATUS_META[k].th, value: v, color: STATUS_META[k].color }));

    // room preference
    const rMap = new Map<string, { count: number; spent: number }>();
    for (const b of bookings) {
      const cur = rMap.get(b.roomName) ?? { count: 0, spent: 0 };
      cur.count += 1;
      if (EARNING.has(b.status)) cur.spent += b.total;
      rMap.set(b.roomName, cur);
    }
    const rooms = [...rMap.entries()].map(([name, v]) => ({ name, ...v })).sort((x, y) => y.count - x.count);

    // payment behaviour
    const methodMap = new Map<string, number>();
    let depositCount = 0, fullCount = 0, paidAmt = 0, pendingAmt = 0;
    for (const p of payments) {
      methodMap.set(methodLabel(p.method), (methodMap.get(methodLabel(p.method)) ?? 0) + 1);
      if (p.kind === "full") fullCount += 1; else depositCount += 1;
      if (p.status === "paid") paidAmt += p.amount; else if (p.status === "pending") pendingAmt += p.amount;
    }
    const methods = [...methodMap.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count);

    // seasonality — stays by check-in month
    const season = Array(12).fill(0) as number[];
    for (const b of bookings) season[new Date(b.checkIn).getMonth()] += 1;
    const seasonMax = Math.max(1, ...season);

    return {
      n, avgNights, avgGuests, tenureMonths, freqPerYear, avgGap,
      monthly, statusData, rooms, methods, depositCount, fullCount, paidAmt, pendingAmt, season, seasonMax,
    };
  }, [bookings, payments, memberSince]);

  if (a.n === 0) {
    return (
      <div className={`${CARD} px-6 py-16 text-center text-sm text-[color:var(--color-ink)]/50`}>
        ยังไม่มีข้อมูลการจอง — สถิติจะแสดงเมื่อมีการจองแล้ว
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="มูลค่าตลอดชีพ" value={`฿${metrics.totalSpent.toLocaleString("en-US")}`} />
        <Tile label="CLV คาดการณ์" value={`฿${metrics.clv.toLocaleString("en-US")}`} />
        <Tile label="เฉลี่ย/ครั้ง" value={`฿${metrics.avgOrderValue.toLocaleString("en-US")}`} />
        <Tile label="คืนเฉลี่ย/ครั้ง" value={`${a.avgNights} คืน`} />
        <Tile label="ผู้เข้าพักเฉลี่ย" value={`${a.avgGuests} คน`} />
        <Tile label="เป็นสมาชิก" value={`${a.tenureMonths} เดือน`} />
        <Tile label="ความถี่จอง" value={`${a.freqPerYear}/ปี`} />
        <Tile label="ห่างจองเฉลี่ย" value={a.avgGap === null ? "—" : `${a.avgGap} วัน`} />
      </div>

      {/* Spend over time + status donut */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="ยอดใช้จ่ายตามเวลา" className="lg:col-span-2">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,40,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip formatter={(v) => [`฿${Number(v).toLocaleString("en-US")}`, "ยอด"] as [string, string]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(45,55,40,0.12)", fontSize: 12 }} cursor={{ fill: "rgba(154,121,91,0.08)" }} />
                <Bar dataKey="amount" fill={CLAY} radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="สัดส่วนสถานะการจอง">
          <div className="flex h-60 flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={a.statusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
                    {a.statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} ครั้ง`, n] as [string, string]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(45,55,40,0.12)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {a.statusData.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--color-ink)]/60">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Room preference */}
      <ChartCard title="ห้องที่ชอบจอง">
        <div className="flex flex-col gap-2.5">
          {a.rooms.map((r, i) => {
            const maxSpent = Math.max(...a.rooms.map((x) => x.spent), 1);
            const pct = Math.round((r.spent / maxSpent) * 100);
            const top = i === 0;
            return (
              <div key={r.name} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    top ? "bg-[color:var(--color-warm-clay)] text-white" : "bg-[color:var(--color-bone-soft)] text-[color:var(--color-ink)]/55"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5 text-[color:var(--color-forest-deep)]">
                      <span className="truncate">{r.name}</span>
                      {top && (
                        <span className="flex-shrink-0 rounded-full bg-[color:var(--color-warm-clay)]/12 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--color-warm-clay)]">
                          ชอบสุด
                        </span>
                      )}
                    </span>
                    <span className="flex-shrink-0 text-[color:var(--color-ink)]/45">
                      {r.count} ครั้ง · ฿{r.spent.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-bone-soft)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: mounted ? `${pct}%` : "0%",
                        background: top ? "var(--color-warm-clay)" : "var(--color-sage-mid)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Payment behaviour + Seasonality */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="พฤติกรรมการชำระเงิน">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniBox label="จ่ายแล้ว" value={`฿${a.paidAmt.toLocaleString("en-US")}`} tone="sage" />
              <MiniBox label="ค้างชำระ" value={`฿${a.pendingAmt.toLocaleString("en-US")}`} tone="clay" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[color:var(--color-ink)]/50">วิธีชำระ</p>
              <div className="flex flex-col gap-2">
                {a.methods.length === 0 ? (
                  <span className="text-xs text-[color:var(--color-ink)]/40">ยังไม่มีข้อมูลการชำระ</span>
                ) : a.methods.map((m) => {
                  const max = a.methods[0]?.count || 1;
                  return (
                    <div key={m.name}>
                      <div className="mb-0.5 flex justify-between text-xs text-[color:var(--color-ink)]/60"><span>{m.name}</span><span>{m.count}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-bone-soft)]"><div className="h-full rounded-full bg-[color:var(--color-sage-mid)] transition-[width] duration-700 ease-out" style={{ width: mounted ? `${(m.count / max) * 100}%` : "0%" }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-[color:var(--color-ink)]/45">มัดจำ/บางส่วน {a.depositCount} · เต็มจำนวน {a.fullCount}</p>
          </div>
        </ChartCard>

        <ChartCard title="ช่วงเดือนที่มักเข้าพัก">
          <div className="grid grid-cols-6 gap-2">
            {a.season.map((c, i) => {
              const intensity = c / a.seasonMax;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    title={`${TH_MON[i]} · ${c} ครั้ง`}
                    className="flex h-10 w-full items-center justify-center rounded-lg text-[11px] font-semibold"
                    style={{
                      background: c === 0 ? "var(--color-bone-soft)" : `rgba(154,121,91,${0.2 + intensity * 0.8})`,
                      color: intensity > 0.5 ? "#fff" : "var(--color-forest-deep)",
                    }}
                  >
                    {c > 0 ? c : ""}
                  </div>
                  <span className="text-[10px] text-[color:var(--color-ink)]/45">{TH_MON[i]}</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* RFM + segment */}
      <ChartCard title="คะแนน RFM และกลุ่มลูกค้า">
        {(() => {
          const tone = healthTone(metrics.health.score);
          return (
            <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 ${tone.bg} ${tone.ring}`}>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${tone.text}`}>กลุ่ม{metrics.segment.label}</div>
                <div className="text-xs text-[color:var(--color-ink)]/50">
                  {metrics.recencyDays === null ? "ยังไม่เคยจอง" : `จองล่าสุด ${metrics.recencyDays} วันก่อน`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right leading-none">
                  <div className={`font-display text-2xl font-bold ${tone.text}`}>{metrics.health.score}</div>
                  <div className="text-[10px] text-[color:var(--color-ink)]/45">Health · {metrics.health.label}</div>
                </div>
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: tone.dot }} />
              </div>
            </div>
          );
        })()}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <RfmCol label="Recency" sub="ความใหม่" score={metrics.rfm.r} mounted={mounted} />
          <RfmCol label="Frequency" sub="ความถี่" score={metrics.rfm.f} mounted={mounted} />
          <RfmCol label="Monetary" sub="มูลค่า" score={metrics.rfm.m} mounted={mounted} />
        </div>
      </ChartCard>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--color-ink)]/45">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{value}</div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${CARD} ${className}`}>
      <header className="border-b border-[color:var(--color-forest-deep)]/8 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MiniBox({ label, value, tone }: { label: string; value: string; tone: "sage" | "clay" }) {
  const bg = tone === "sage" ? "bg-[color:var(--color-sage-mid)]/12" : "bg-[color:var(--color-warm-clay)]/12";
  return (
    <div className={`rounded-xl ${bg} px-4 py-3`}>
      <div className="text-[11px] text-[color:var(--color-ink)]/50">{label}</div>
      <div className="font-display text-base font-semibold text-[color:var(--color-forest-deep)]">{value}</div>
    </div>
  );
}

function healthTone(score: number): { bg: string; text: string; ring: string; dot: string } {
  if (score >= 80) return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "#10b981" };
  if (score >= 50) return { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "#d4a24c" };
  return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "#c0563f" };
}

/** One RFM dimension as a 3-dot meter; dots pop in (staggered) on mount. */
function RfmCol({ label, sub, score, mounted }: { label: string; sub: string; score: number; mounted: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[color:var(--color-bone-soft)]/40 px-2 py-3 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full transition-all duration-500 ease-out"
            style={{
              transitionDelay: `${i * 120}ms`,
              transform: mounted ? "scale(1)" : "scale(0.3)",
              opacity: mounted ? 1 : 0,
              background: i < score ? "var(--color-warm-clay)" : "rgba(45,55,40,0.12)",
            }}
          />
        ))}
      </div>
      <div className="text-xs font-semibold text-[color:var(--color-forest-deep)]">{label}</div>
      <div className="text-[10px] text-[color:var(--color-ink)]/45">{sub}</div>
      <div className="text-[11px] font-semibold text-[color:var(--color-forest-deep)]">{score}/3</div>
    </div>
  );
}
