"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Panel, EmptyState, Metric, MetricStrip } from "@/components/admin/ui";
import {
  computeRevenue,
  addDays,
  startOfMonth,
  type RevBooking,
  type RevPayment,
  type RevEntry,
  type RevView,
  type Granularity,
  type DateRange,
  type RevenueInput,
} from "@/lib/revenue/metrics";
import { RevenueTrendChart, BreakdownDonut, BreakdownBars, CalendarHeatmap } from "./RevenueCharts";
import { ImportModal } from "./ImportModal";

export type RevenueData = {
  bookings: RevBooking[];
  payments: RevPayment[];
  entries: RevEntry[];
  rooms: { id: string; name: string }[];
  customers: [string, string][];
  today: string; // Bangkok YYYY-MM-DD
  earliest: string; // earliest data date YYYY-MM-DD
};

type Preset = "7d" | "30d" | "mtd" | "90d" | "ytd" | "12m" | "all" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "7d", label: "7 วัน" },
  { key: "30d", label: "30 วัน" },
  { key: "mtd", label: "เดือนนี้" },
  { key: "90d", label: "ไตรมาส" },
  { key: "ytd", label: "ปีนี้" },
  { key: "12m", label: "12 เดือน" },
  { key: "all", label: "ทั้งหมด" },
];

const baht = (v: number) => `฿${Math.round(v).toLocaleString("en-US")}`;

function rangeForPreset(p: Preset, today: string, earliest: string, custom: DateRange): DateRange {
  switch (p) {
    case "7d": return { from: addDays(today, -6), to: today };
    case "30d": return { from: addDays(today, -29), to: today };
    case "mtd": return { from: startOfMonth(today), to: today };
    case "90d": return { from: addDays(today, -89), to: today };
    case "ytd": return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case "12m": return { from: addDays(today, -364), to: today };
    case "all": return { from: earliest, to: today };
    case "custom": return custom;
  }
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[color:var(--color-ink)]/45">ใหม่</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-[color:var(--color-bone-soft)]/70 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === o.key ? "bg-white text-[color:var(--color-forest-deep)] shadow-sm" : "text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function exportCsv(rows: { date: string; type: string; ref: string; customer: string; room: string; method: string; amount: number }[]) {
  const head = ["date", "type", "ref", "customer", "room", "method", "amount"];
  const lines = [
    head.join(","),
    ...rows.map((r) =>
      [r.date, r.type, r.ref, r.customer, r.room, r.method, r.amount]
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

const TYPE_TH: Record<string, string> = { booking: "การจอง", payment: "ชำระเงิน", manual: "บันทึกเอง" };
const PAGE_SIZE = 12;

export function RevenueReport(data: RevenueData) {
  const router = useRouter();
  const [view, setView] = useState<RevView>("booked");
  const [preset, setPreset] = useState<Preset>("30d");
  const [custom, setCustom] = useState<DateRange>({ from: addDays(data.today, -29), to: data.today });
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [roomId, setRoomId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const input: RevenueInput = useMemo(
    () => ({
      bookings: data.bookings,
      payments: data.payments,
      entries: data.entries,
      roomName: new Map(data.rooms.map((r) => [r.id, r.name])),
      customerName: new Map(data.customers),
    }),
    [data],
  );

  const range = useMemo(
    () => rangeForPreset(preset, data.today, data.earliest, custom),
    [preset, data.today, data.earliest, custom],
  );

  // Auto-pick a sensible granularity when the preset changes (still overridable).
  const autoGran: Granularity = useMemo(() => {
    const span = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86_400_000;
    return span > 92 ? "month" : "day";
  }, [range]);
  const effGran = preset === "custom" ? granularity : autoGran;

  const result = useMemo(
    () => computeRevenue(input, { view, granularity: effGran, range, roomId }),
    [input, view, effGran, range, roomId],
  );

  const k = result.kpis;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return result.transactions;
    return result.transactions.filter(
      (t) => t.ref.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.room.toLowerCase().includes(q),
    );
  }, [result.transactions, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={view}
            onChange={setView}
            options={[{ key: "booked", label: "ยอดจอง" }, { key: "collected", label: "เงินเก็บจริง" }]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--color-warm-clay)]/30 bg-[color:var(--color-warm-clay)]/8 px-3.5 py-2 text-xs font-semibold text-[color:var(--color-warm-clay)] transition-colors hover:bg-[color:var(--color-warm-clay)]/15"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              นำเข้าข้อมูล
            </button>
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--color-forest-deep)] px-3.5 py-2 text-xs font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
              ส่งออก CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => { setPreset(p.key); setPage(0); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.key ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]" : "bg-[color:var(--color-bone-soft)]/60 text-[color:var(--color-ink)]/60 hover:bg-[color:var(--color-bone-soft)]"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-bone-soft)]/60 px-2 py-1">
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => { setCustom((c) => ({ ...c, from: e.target.value })); setPreset("custom"); }}
              className="bg-transparent text-xs text-[color:var(--color-ink)]/70 focus:outline-none"
            />
            <span className="text-[color:var(--color-ink)]/30">–</span>
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              max={data.today}
              onChange={(e) => { setCustom((c) => ({ ...c, to: e.target.value })); setPreset("custom"); }}
              className="bg-transparent text-xs text-[color:var(--color-ink)]/70 focus:outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setPage(0); }}
              className="rounded-full border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-1.5 text-xs text-[color:var(--color-ink)]/70 focus:border-[color:var(--color-warm-clay)] focus:outline-none"
            >
              <option value="all">ทุกห้อง</option>
              {data.rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <Segmented
              value={effGran}
              onChange={(g) => { setGranularity(g); setPreset("custom"); }}
              options={[{ key: "day", label: "วัน" }, { key: "month", label: "เดือน" }]}
            />
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <MetricStrip cols={6}>
        <Metric
          primary
          label={view === "booked" ? "ยอดจองรวม" : "เงินเก็บได้รวม"}
          value={baht(k.primaryTotal)}
          foot={<span className="inline-flex items-center gap-1">เทียบช่วงก่อน <DeltaBadge pct={k.primaryGrowthPct} /></span>}
        />
        <Metric label="เงินเก็บได้จริง" value={baht(k.collected)} foot={`${Math.round(k.collectionRate * 100)}% ของยอดจอง`} accent="forest" />
        <Metric label="ค้างชำระ" value={baht(k.outstanding)} foot="ยอดจอง − เก็บแล้ว" accent={k.outstanding > 0 ? "amber" : "neutral"} />
        <Metric label="จำนวนการจอง" value={k.bookingCount.toLocaleString()} foot="รายการ" accent="neutral" />
        <Metric label="เฉลี่ย/การจอง" value={baht(k.aov)} foot="ต่อบิล" accent="neutral" />
        <Metric label="เฉลี่ย/วัน" value={baht(k.avgDailyCollected)} foot="เงินเก็บได้" accent="neutral" />
      </MetricStrip>

      {/* ── Trend + room donut ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title={`แนวโน้มรายได้ (${view === "booked" ? "ยอดจอง" : "เงินเก็บจริง"})`} className="lg:col-span-2">
          <RevenueTrendChart data={result.series} showCompare />
        </Panel>
        <Panel title="สัดส่วนตามห้อง">
          <BreakdownDonut data={result.byRoom} centerLabel="รวม" />
        </Panel>
      </div>

      {/* ── Method + category + heatmap ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="ตามช่องทางชำระ">
          <BreakdownBars data={result.byMethod} />
        </Panel>
        <Panel title="ตามประเภทรายได้">
          <BreakdownBars data={result.byCategory} />
        </Panel>
        <Panel title="ความหนาแน่นรายวัน">
          <CalendarHeatmap data={effGran === "day" ? result.series : computeRevenue(input, { view, granularity: "day", range, roomId }).series} />
        </Panel>
      </div>

      {/* ── Transactions ── */}
      <Panel
        title="รายการธุรกรรม"
        bodyClassName="p-0"
        actions={
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="ค้นหา รหัส / ลูกค้า / ห้อง"
            className="w-48 rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-1.5 text-xs text-[color:var(--color-ink)] focus:border-[color:var(--color-warm-clay)] focus:outline-none"
          />
        }
      >
        {filtered.length === 0 ? (
          <div className="p-5"><EmptyState>ไม่มีรายการในช่วงเวลานี้</EmptyState></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--color-bone-soft)]/50 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-forest-deep)]/65">
                  <tr>
                    <th className="px-5 py-3 font-medium">วันที่</th>
                    <th className="px-5 py-3 font-medium">ประเภท</th>
                    <th className="px-5 py-3 font-medium">อ้างอิง</th>
                    <th className="px-5 py-3 font-medium">ลูกค้า</th>
                    <th className="px-5 py-3 font-medium">ห้อง</th>
                    <th className="px-5 py-3 font-medium">ช่องทาง</th>
                    <th className="px-5 py-3 text-right font-medium">ยอด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
                  {pageRows.map((t) => (
                    <tr key={t.id} className="hover:bg-[color:var(--color-bone-soft)]/30">
                      <td className="whitespace-nowrap px-5 py-3 text-[color:var(--color-ink)]/70">{t.date}</td>
                      <td className="px-5 py-3 text-[color:var(--color-ink)]/60">{TYPE_TH[t.type] ?? t.type}</td>
                      <td className="px-5 py-3 font-mono text-[13px] text-[color:var(--color-forest-deep)]">{t.ref}</td>
                      <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{t.customer}</td>
                      <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{t.room}</td>
                      <td className="px-5 py-3 text-[color:var(--color-ink)]/60">{t.method}</td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right font-medium ${t.amount < 0 ? "text-red-500" : "text-[color:var(--color-forest-deep)]"}`}>
                        {baht(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-forest-deep)]/8 px-5 py-3 text-xs text-[color:var(--color-ink)]/55">
              <span>{filtered.length.toLocaleString()} รายการ</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="rounded-lg px-2.5 py-1 hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">←</button>
                <span>{safePage + 1} / {pageCount}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1} className="rounded-lg px-2.5 py-1 hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">→</button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
