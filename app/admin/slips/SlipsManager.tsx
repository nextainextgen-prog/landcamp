"use client";

import { useMemo, useState } from "react";

import { Metric, MetricStrip } from "@/components/admin/ui";
import { CalendarField } from "@/components/ui/CalendarField";
import { addDays, startOfMonth, type DateRange } from "@/lib/revenue/metrics";

export type SlipRow = {
  id: string;
  created_at: string;
  booking_code: string | null;
  api_success: boolean;
  verify_status: string;
  is_duplicate: boolean;
  trans_ref: string | null;
  amount_in_slip: number | null;
  amount_expected: number | null;
  is_amount_matched: boolean;
  sender_name: string | null;
  sender_bank: string | null;
  receiver_name: string | null;
  receiver_bank: string | null;
  receiver_account: string | null;
  slip_paid_at: string | null;
  message: string | null;
  slip_image: string | null;
};

// Verdict labels — no emoji, colour tones only.
const VERIFY: Record<string, { label: string; cls: string }> = {
  matched: { label: "สลิปถูกต้อง", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  amount_mismatch: { label: "ยอดไม่ตรง", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
  duplicate: { label: "สลิปซ้ำ", cls: "bg-red-100 text-red-700 ring-red-200" },
  unreadable: { label: "อ่านสลิปไม่ออก", cls: "bg-red-100 text-red-700 ring-red-200" },
  error: { label: "ระบบตรวจขัดข้อง", cls: "bg-red-100 text-red-700 ring-red-200" },
  pending: { label: "รอตรวจ", cls: "bg-blue-100 text-blue-800 ring-blue-200" },
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

type SortKey = "date" | "api" | "ref" | "sender" | "receiver" | "amount";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 12;

const baht = (v: number | null) =>
  v == null ? "—" : `฿${Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(rows: SlipRow[]) {
  const head = [
    "datetime", "api_status", "trans_ref", "booking_code",
    "sender_name", "sender_bank", "receiver_name", "receiver_bank", "receiver_account",
    "slip_type", "amount_in_slip", "amount_expected", "slip_paid_at",
  ];
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    head.join(","),
    ...rows.map((r) =>
      [
        fmtDateTime(r.created_at),
        r.api_success ? "success" : "failed",
        r.trans_ref ?? "",
        r.booking_code ?? "",
        r.sender_name ?? "",
        r.sender_bank ?? "",
        r.receiver_name ?? "",
        r.receiver_bank ?? "",
        r.receiver_account ?? "",
        (VERIFY[r.verify_status] ?? VERIFY.pending).label,
        r.amount_in_slip ?? "",
        r.amount_expected ?? "",
        r.slip_paid_at ?? "",
      ].map(cell).join(","),
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `landcamp-slips-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col leading-[0] ${active ? "text-[color:var(--color-forest-deep)]" : "text-[color:var(--color-ink)]/25"}`} aria-hidden>
      <svg viewBox="0 0 24 24" width="9" height="6" fill="currentColor" className={active && dir === "asc" ? "opacity-100" : "opacity-40"}><path d="M12 6l6 8H6z" /></svg>
      <svg viewBox="0 0 24 24" width="9" height="6" fill="currentColor" className={active && dir === "desc" ? "opacity-100" : "opacity-40"}><path d="M12 18l-6-8h12z" /></svg>
    </span>
  );
}

export function SlipsManager({
  initialRows,
  today,
  earliest,
}: {
  initialRows: SlipRow[];
  today: string;
  earliest: string;
}) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [custom, setCustom] = useState<DateRange>({ from: addDays(today, -29), to: today });
  const [tab, setTab] = useState<string>("all");
  const [account, setAccount] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState<SlipRow | null>(null);

  const range = useMemo(
    () => rangeForPreset(preset, today, earliest, custom),
    [preset, today, earliest, custom],
  );

  // Distinct receiving accounts seen on the slips (single source = EasySlip data).
  const accounts = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of initialRows) {
      if (!r.receiver_name && !r.receiver_bank) continue;
      const key = `${r.receiver_name ?? ""}|${r.receiver_bank ?? ""}`;
      const label = [r.receiver_name, r.receiver_bank].filter(Boolean).join(" · ");
      if (label) m.set(key, label);
    }
    return [...m.entries()].map(([key, label]) => ({ key, label }));
  }, [initialRows]);

  // Rows within the chosen date range (drives both KPIs and table).
  const inRange = useMemo(() => {
    return initialRows.filter((r) => {
      const d = r.created_at.slice(0, 10);
      return d >= range.from && d <= range.to;
    });
  }, [initialRows, range]);

  const kpi = useMemo(() => {
    let matched = 0, duplicate = 0, problem = 0, apiOk = 0, sum = 0;
    for (const r of inRange) {
      if (r.verify_status === "matched") matched++;
      else if (r.verify_status === "duplicate") duplicate++;
      else problem++;
      if (r.api_success) apiOk++;
      if (r.amount_in_slip) sum += r.amount_in_slip;
    }
    const total = inRange.length;
    return {
      total,
      matched,
      duplicate,
      problem,
      sum,
      apiRate: total ? Math.round((apiOk / total) * 100) : 0,
    };
  }, [inRange]);

  // Tab + account filters applied to the in-range rows for the table.
  const filtered = useMemo(() => {
    let list = inRange;
    if (tab !== "all") {
      list = list.filter((r) =>
        tab === "unreadable"
          ? r.verify_status === "unreadable" || r.verify_status === "error"
          : r.verify_status === tab,
      );
    }
    if (account !== "all") {
      list = list.filter((r) => `${r.receiver_name ?? ""}|${r.receiver_bank ?? ""}` === account);
    }
    return list;
  }, [inRange, tab, account]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: inRange.length };
    for (const r of inRange) {
      const bucket = r.verify_status === "error" ? "unreadable" : r.verify_status;
      c[bucket] = (c[bucket] ?? 0) + 1;
    }
    return c;
  }, [inRange]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const cmp = (a: SlipRow, b: SlipRow): number => {
      switch (sortKey) {
        case "api": return (Number(a.api_success) - Number(b.api_success)) * dir;
        case "ref": return (a.trans_ref ?? "").localeCompare(b.trans_ref ?? "") * dir;
        case "sender": return (a.sender_name ?? "").localeCompare(b.sender_name ?? "") * dir;
        case "receiver": return (a.receiver_name ?? "").localeCompare(b.receiver_name ?? "") * dir;
        case "amount": return ((a.amount_in_slip ?? 0) - (b.amount_in_slip ?? 0)) * dir;
        case "date":
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    };
    return [...filtered].sort(cmp);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
    setPage(0);
  }

  const TABS: { key: string; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "matched", label: "สลิปถูกต้อง" },
    { key: "duplicate", label: "สลิปซ้ำ" },
    { key: "amount_mismatch", label: "ยอดไม่ตรง" },
    { key: "unreadable", label: "อ่านไม่ออก/ขัดข้อง" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setPage(0); }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ${
                  tab === t.key
                    ? "bg-[color:var(--color-forest-deep)] text-white ring-[color:var(--color-forest-deep)]"
                    : "bg-white text-[color:var(--color-ink)]/65 ring-[color:var(--color-forest-deep)]/15 hover:bg-[color:var(--color-bone-soft)]/50"
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-xs opacity-70">{tabCounts[t.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => exportCsv(sorted)}
            disabled={sorted.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--color-forest-deep)] px-3.5 py-2 text-xs font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)] disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
            ส่งออก CSV
          </button>
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
          <div className="rounded-full bg-[color:var(--color-bone-soft)]/60 px-3 py-1">
            <CalendarField
              mode="range"
              start={range.from}
              end={range.to}
              maxDate={today}
              onRangeChange={({ start, end }) => { setCustom({ from: start, to: end }); setPreset("custom"); setPage(0); }}
              placeholder="เลือกช่วงวันที่"
              className="text-xs text-[color:var(--color-ink)]/70"
            />
          </div>
          {accounts.length > 0 && (
            <select
              value={account}
              onChange={(e) => { setAccount(e.target.value); setPage(0); }}
              className="ml-auto rounded-full border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-1.5 text-xs text-[color:var(--color-ink)]/70 focus:border-[color:var(--color-warm-clay)] focus:outline-none"
            >
              <option value="all">บัญชีรับเงินทั้งหมด</option>
              {accounts.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <MetricStrip cols={6}>
        <Metric primary label="สลิปทั้งหมด" value={kpi.total.toLocaleString()} foot="ในช่วงที่เลือก" />
        <Metric label="สลิปถูกต้อง" value={kpi.matched.toLocaleString()} foot="ยอด+บัญชีตรง" accent="forest" />
        <Metric label="สลิปซ้ำ" value={kpi.duplicate.toLocaleString()} foot="ถูกบล็อก" accent={kpi.duplicate > 0 ? "amber" : "neutral"} />
        <Metric label="มีปัญหา" value={kpi.problem.toLocaleString()} foot="ยอดไม่ตรง/อ่านไม่ออก" accent={kpi.problem > 0 ? "amber" : "neutral"} />
        <Metric label="ยอดรวมในสลิป" value={baht(kpi.sum)} foot="เฉพาะที่อ่านได้" accent="neutral" />
        <Metric label="ตรวจสำเร็จ" value={`${kpi.apiRate}%`} foot="ผ่าน EasySlip" accent="neutral" />
      </MetricStrip>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/40 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--color-forest-deep)]/65">
              <tr>
                <Th label="วันที่" sortable onSort={() => toggleSort("date")} active={sortKey === "date"} dir={sortDir} />
                <Th label="API Status" sortable onSort={() => toggleSort("api")} active={sortKey === "api"} dir={sortDir} />
                <Th label="หมายเลข" sortable onSort={() => toggleSort("ref")} active={sortKey === "ref"} dir={sortDir} />
                <Th label="บัญชีผู้โอน" sortable onSort={() => toggleSort("sender")} active={sortKey === "sender"} dir={sortDir} />
                <Th label="บัญชีรับเงิน" sortable onSort={() => toggleSort("receiver")} active={sortKey === "receiver"} dir={sortDir} />
                <Th label="ประเภทสลิป" />
                <Th label="จำนวน" align="right" sortable onSort={() => toggleSort("amount")} active={sortKey === "amount"} dir={sortDir} />
                <Th label="สลิป" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-[color:var(--color-ink)]/45">
                    ยังไม่มีประวัติการตรวจสลิปในช่วงที่เลือก
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const verify = VERIFY[r.verify_status] ?? VERIFY.pending;
                  return (
                      <tr key={r.id} className="align-top hover:bg-[color:var(--color-bone-soft)]/30">
                        <td className="whitespace-nowrap px-3 py-3 text-[color:var(--color-ink)]/75">{fmtDateTime(r.created_at)}</td>
                        <td className="px-3 py-3">
                          {r.api_success ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                              สำเร็จ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                              ล้มเหลว
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-mono text-xs text-[color:var(--color-ink)]/80">{r.trans_ref ?? "—"}</div>
                          {r.booking_code && <div className="text-[11px] text-[color:var(--color-ink)]/45">{r.booking_code}</div>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[color:var(--color-ink)]/85">{r.sender_name ?? "—"}</div>
                          {r.sender_bank && <div className="text-[11px] text-[color:var(--color-ink)]/45">{r.sender_bank}</div>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[color:var(--color-ink)]/85">{r.receiver_name ?? "—"}</div>
                          <div className="text-[11px] text-[color:var(--color-ink)]/45">{[r.receiver_bank, r.receiver_account].filter(Boolean).join(" · ") || "—"}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${verify.cls}`}>{verify.label}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-[color:var(--color-forest-deep)]">
                          {baht(r.amount_in_slip)}
                          {r.amount_expected != null && !r.is_amount_matched && r.amount_in_slip != null && (
                            <div className="text-[11px] font-normal text-amber-700">ควรเป็น {baht(r.amount_expected)}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {r.slip_image ? (
                            <button
                              type="button"
                              onClick={() => setZoom(r)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]/50"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                              ข้อมูลสลิป
                            </button>
                          ) : (
                            <span className="text-xs text-[color:var(--color-ink)]/35">ไม่มีรูป</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — always visible, even with no rows */}
        <div className="flex items-center justify-end gap-3 border-t border-[color:var(--color-forest-deep)]/10 px-4 py-3 text-xs text-[color:var(--color-ink)]/55">
              <span>หน้า {safePage + 1} ถึง {pageCount}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  aria-label="ก่อนหน้า"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-ink)]/60 hover:bg-[color:var(--color-bone-soft)]/50 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-[color:var(--color-forest-deep)] px-2 text-xs font-semibold text-white">
                  {safePage + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  aria-label="ถัดไป"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-ink)]/60 hover:bg-[color:var(--color-bone-soft)]/50 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            </div>
      </div>

      {/* Slip detail modal */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setZoom(null)}>
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/10 px-5 py-3">
              <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">ข้อมูลสลิป</span>
              <button type="button" onClick={() => setZoom(null)} aria-label="ปิด" className="rounded-md p-1 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]/60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {zoom.slip_image && (
                <img src={zoom.slip_image} alt="สลิป" className="w-full rounded-lg border border-[color:var(--color-forest-deep)]/10 object-contain" />
              )}
              <dl className="flex flex-col gap-2 text-sm">
                <DetailRow label="เลขอ้างอิง" value={zoom.trans_ref} mono />
                <DetailRow label="เวลาบนสลิป" value={zoom.slip_paid_at ? fmtDateTime(zoom.slip_paid_at) : null} />
                <DetailRow label="ผู้โอน" value={[zoom.sender_name, zoom.sender_bank].filter(Boolean).join(" · ") || null} />
                <DetailRow label="ผู้รับ" value={[zoom.receiver_name, zoom.receiver_bank, zoom.receiver_account].filter(Boolean).join(" · ") || null} />
                <DetailRow label="ยอดในสลิป" value={baht(zoom.amount_in_slip)} />
                <DetailRow label="ยอดที่ต้องจ่าย" value={baht(zoom.amount_expected)} />
                {zoom.message && <DetailRow label="หมายเหตุระบบ" value={zoom.message} />}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  label,
  align = "left",
  sortable = false,
  onSort,
  active = false,
  dir = "desc",
}: {
  label: string;
  align?: "left" | "right";
  sortable?: boolean;
  onSort?: () => void;
  active?: boolean;
  dir?: SortDir;
}) {
  return (
    <th className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"}`}>
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={`inline-flex items-center gap-1 hover:text-[color:var(--color-forest-deep)] ${active ? "text-[color:var(--color-forest-deep)]" : ""}`}
        >
          {label}
          <SortIcon active={active} dir={dir} />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wide text-[color:var(--color-ink)]/45">{label}</dt>
      <dd className={`text-[color:var(--color-ink)]/85 ${mono ? "font-mono text-xs" : ""}`}>{value ?? "—"}</dd>
    </div>
  );
}
