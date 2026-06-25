"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Channel = "line" | "google" | "walk_in" | "online";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  line_user_id: string | null;
  created_at: string;
  tags: string[];
  channel: Channel;
  profile_complete: boolean;
  bookings_count: number;
  total_spent: number;
  last_booking: string | null;
};

export type CustomerStats = {
  total: number;
  newThisMonth: number;
  newLastMonth: number;
  revenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  bookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
};

type SortKey = "name" | "bookings" | "spent" | "last";

/* ── helpers ───────────────────────────────────────────────────── */
function thaiDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function relDate(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  if (days < 30) return `${days} วันก่อน`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนก่อน`;
  return `${Math.floor(days / 365)} ปีก่อน`;
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean || clean === "—") return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function pctChange(now: number, prev: number): number {
  if (prev > 0) return Math.round(((now - prev) / prev) * 100);
  return now > 0 ? 100 : 0;
}

const CHANNEL_META: Record<Channel, { label: string; cls: string; ring: string }> = {
  line: { label: "LINE", cls: "bg-[#06C755]/12 text-[#05a948] ring-[#06C755]/25", ring: "ring-[#06C755]/45" },
  google: { label: "Google", cls: "bg-blue-100 text-blue-700 ring-blue-200", ring: "ring-blue-300" },
  walk_in: { label: "Walk-in", cls: "bg-amber-100 text-amber-800 ring-amber-200", ring: "ring-amber-300" },
  online: { label: "ออนไลน์", cls: "bg-slate-100 text-slate-600 ring-slate-200", ring: "ring-slate-300" },
};

const CHANNEL_FILTERS: Channel[] = ["line", "google", "walk_in", "online"];

const CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

function toCsv(rows: CustomerRow[]): string {
  const head = ["ชื่อ", "อีเมล", "เบอร์โทร", "ช่องทาง", "จอง", "ยอดใช้จ่าย", "จองล่าสุด"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.name,
      r.email === "—" ? "" : r.email,
      r.phone,
      CHANNEL_META[r.channel].label,
      String(r.bookings_count),
      String(r.total_spent),
      r.last_booking ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.map(esc).join(","), ...lines].join("\r\n");
}

function downloadCsv(rows: CustomerRow[], suffix = "") {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `customers${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── CSV parse (header-aware, quote-safe) ──────────────────────── */
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

type ParsedRow = { name: string; phone: string; email: string; tags: string[] };

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const first = splitRow(lines[0]).map((c) => c.toLowerCase());
  const looksHeader = first.some((c) => /name|ชื่อ|phone|เบอร|tel|โทร|email|อีเมล|mail|tag|แท็ก/.test(c));
  let idx = { name: 0, phone: 1, email: 2, tags: 3 };
  let start = 0;
  if (looksHeader) {
    start = 1;
    const find = (...keys: string[]) => first.findIndex((c) => keys.some((k) => c.includes(k)));
    const n = find("ชื่อ", "name");
    const p = find("เบอร", "phone", "tel", "โทร");
    const e = find("อีเมล", "email", "mail");
    const t = find("แท็ก", "tag");
    idx = { name: n < 0 ? 0 : n, phone: p < 0 ? 1 : p, email: e, tags: t };
  }

  const rows: ParsedRow[] = [];
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);
    const name = cells[idx.name] ?? "";
    const phone = cells[idx.phone] ?? "";
    if (!name && !phone) continue;
    const email = idx.email >= 0 ? cells[idx.email] ?? "" : "";
    const tagsRaw = idx.tags >= 0 ? cells[idx.tags] ?? "" : "";
    const tags = tagsRaw.split(/[;|]/).map((x) => x.trim()).filter(Boolean);
    rows.push({ name, phone, email, tags });
  }
  return rows;
}

/* ════════════════════════════════════════════════════════════════ */
export function CustomersList({
  initialRows,
  stats,
}: {
  initialRows: CustomerRow[];
  stats: CustomerStats;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [channels, setChannels] = useState<Set<Channel>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("last");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = initialRows.filter((r) => {
      if (channels.size > 0 && !channels.has(r.channel)) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name, "th") * dir;
        case "bookings":
          return (a.bookings_count - b.bookings_count) * dir;
        case "spent":
          return (a.total_spent - b.total_spent) * dir;
        case "last":
        default:
          return ((a.last_booking ?? "").localeCompare(b.last_booking ?? "")) * dir;
      }
    });
  }, [q, channels, sortKey, sortDir, initialRows]);

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function toggleChannel(c: Channel) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (rows.every((r) => prev.has(r.id))) {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setToast(null);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) {
        setToast({ ok: false, text: "ไม่พบข้อมูลในไฟล์ — ต้องมีคอลัมน์ ชื่อ และ เบอร์โทร" });
        return;
      }
      const res = await fetch("/api/admin/customers/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: parsed }),
      });
      const data = (await res.json()) as { created?: number; skipped?: number; errors?: string[]; error?: string };
      if (!res.ok && !data.created) {
        setToast({ ok: false, text: data.error ?? "นำเข้าไม่สำเร็จ" });
        return;
      }
      const parts = [`เพิ่ม ${data.created ?? 0} ราย`];
      if (data.skipped) parts.push(`ข้าม ${data.skipped} (เบอร์ซ้ำ)`);
      if (data.errors?.length) parts.push(`ผิดพลาด ${data.errors.length} แถว`);
      setToast({ ok: true, text: parts.join(" · ") });
      router.refresh();
    } catch {
      setToast({ ok: false, text: "อ่านไฟล์ไม่สำเร็จ" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="ลูกค้าทั้งหมด"
          value={stats.total.toLocaleString("en-US")}
          tone="forest"
          icon={ICONS.users}
          sub={stats.newThisMonth > 0 ? `+${stats.newThisMonth} เดือนนี้` : "—"}
        />
        <Kpi
          label="ใหม่เดือนนี้"
          value={stats.newThisMonth.toLocaleString("en-US")}
          tone="sage"
          icon={ICONS.calendar}
          delta={pctChange(stats.newThisMonth, stats.newLastMonth)}
        />
        <Kpi
          label="รายได้รวม"
          value={`฿${stats.revenue.toLocaleString("en-US")}`}
          tone="clay"
          icon={ICONS.cash}
          delta={pctChange(stats.revenueThisMonth, stats.revenueLastMonth)}
        />
        <Kpi
          label="การจองทั้งหมด"
          value={stats.bookings.toLocaleString("en-US")}
          tone="ink"
          icon={ICONS.bookings}
          delta={pctChange(stats.bookingsThisMonth, stats.bookingsLastMonth)}
        />
      </div>

      {/* ── List card ── */}
      <section className={CARD}>
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">รายชื่อลูกค้า</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-500">
                {rows.length.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="กรองรายการนี้ — ชื่อ / อีเมล / เบอร์ / แท็ก"
                  className="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-9 text-sm text-[color:var(--color-ink)] outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--color-warm-clay)]/45 focus:bg-white focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    aria-label="ล้างการค้นหา"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--color-warm-clay)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--color-forest-deep)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                เพิ่มลูกค้า
              </button>

              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImportFile} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                title="นำเข้าลูกค้าจากไฟล์ CSV (ต้องมี ชื่อ + เบอร์โทร)"
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <path d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {importing ? "นำเข้า…" : "นำเข้า"}
              </button>
              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                disabled={rows.length === 0}
                title="ส่งออกรายการที่กรองเป็น CSV"
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          {toast && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span>{toast.ok ? "✓" : "!"}</span>
              {toast.text}
              <button type="button" onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">ปิด</button>
            </div>
          )}

          {/* Filters OR bulk-action bar */}
          {someSelected ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[color:var(--color-warm-clay)]/10 px-3 py-2">
              <span className="text-xs font-semibold text-[color:var(--color-forest-deep)]">
                เลือก {selected.size} รายการ
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCsv(rows.filter((r) => selected.has(r.id)), "-selected")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
                    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  ส่งออกที่เลือก
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-white/60"
                >
                  ล้าง
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={channels.size === 0} onClick={() => setChannels(new Set())}>ทั้งหมด</Chip>
              {CHANNEL_FILTERS.map((c) => (
                <Chip key={c} active={channels.has(c)} onClick={() => toggleChannel(c)}>
                  {CHANNEL_META[c].label}
                </Chip>
              ))}
              {channels.size > 0 && <span className="ml-1 text-[11px] text-slate-400">เลือก {channels.size} ช่องทาง</span>}
            </div>
          )}
        </header>

        {rows.length === 0 ? (
          <EmptyState
            isFiltered={initialRows.length > 0}
            onImport={() => fileRef.current?.click()}
            onAdd={() => setAddOpen(true)}
          />
        ) : (
          <div className="max-h-[calc(100vh-340px)] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <th className="w-10 px-3 py-3">
                    <Checkbox checked={allOnPageSelected} indeterminate={someSelected && !allOnPageSelected} onChange={toggleAll} ariaLabel="เลือกทั้งหมด" />
                  </th>
                  <SortHead label="ลูกค้า" col="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3">ติดต่อ</th>
                  <th className="px-5 py-3">ช่องทาง</th>
                  <SortHead label="จอง" col="bookings" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortHead label="ยอดใช้จ่าย" col="spent" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <SortHead label="จองล่าสุด" col="last" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const isSel = selected.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`group relative transition-colors ${isSel ? "bg-[color:var(--color-warm-clay)]/[0.06]" : "hover:bg-slate-50/80"}`}
                    >
                      {/* hover/selected left accent */}
                      <td className="relative w-10 px-3 py-3">
                        <span className={`absolute left-0 top-0 h-full w-[3px] bg-[color:var(--color-warm-clay)] transition-opacity ${isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                        <Checkbox checked={isSel} onChange={() => toggleRow(r.id)} ariaLabel={`เลือก ${r.name}`} />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/customers/${r.id}`)}
                          className="flex items-center gap-3 text-left"
                        >
                          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)]/8 text-xs font-semibold text-[color:var(--color-forest-deep)] ring-2 ${CHANNEL_META[r.channel].ring}`}>
                            {initials(r.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="font-medium text-[color:var(--color-forest-deep)] group-hover:text-[color:var(--color-warm-clay)]">{r.name}</span>
                            {r.tags.length > 0 && (
                              <span className="mt-0.5 flex flex-wrap gap-1">
                                {r.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{t}</span>
                                ))}
                                {r.tags.length > 2 && <span className="text-[10px] text-slate-400">+{r.tags.length - 2}</span>}
                              </span>
                            )}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[color:var(--color-ink)]/75">{r.email}</div>
                        {r.phone ? (
                          <div className="text-xs tabular-nums text-slate-400">{r.phone}</div>
                        ) : (
                          <div className="text-xs text-amber-600/80">— ยังไม่มีเบอร์</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${CHANNEL_META[r.channel].cls}`}>
                          {CHANNEL_META[r.channel].label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                          {r.bookings_count}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-[color:var(--color-forest-deep)]">
                        ฿{r.total_spent.toLocaleString("en-US")}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[color:var(--color-ink)]/65" title={thaiDate(r.last_booking)}>
                        {relDate(r.last_booking)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.phone ? (
                            <a href={`tel:${r.phone}`} title={`โทร ${r.phone}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[color:var(--color-forest-deep)] opacity-0 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 focus:opacity-100 group-hover:opacity-100">
                              <IconPhone />
                            </a>
                          ) : (
                            <span title="ไม่มีเบอร์โทร" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-slate-300 opacity-0 group-hover:opacity-100">
                              <IconPhone />
                            </span>
                          )}
                          {r.line_user_id ? (
                            <button type="button" onClick={() => openLineChat(r.line_user_id!)} title="แชท LINE — คัดลอก User ID และเปิด LINE OA Manager" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#05a948] opacity-0 transition-all hover:border-[#06C755]/40 hover:bg-[#06C755]/10 focus:opacity-100 group-hover:opacity-100">
                              <IconChat />
                            </button>
                          ) : (
                            <span title="ลูกค้ารายนี้ไม่ได้เชื่อม LINE" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-slate-300 opacity-0 group-hover:opacity-100">
                              <IconChat />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/customers/${r.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-forest-deep)]/8 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-warm-clay)] hover:text-white"
                          >
                            <IconEye />
                            ดูข้อมูล
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {addOpen && (
        <AddCustomerModal
          onClose={() => setAddOpen(false)}
          onDone={(text) => {
            setAddOpen(false);
            setToast({ ok: true, text });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function openLineChat(lineUserId: string) {
  try {
    navigator.clipboard?.writeText(lineUserId);
  } catch {
    /* clipboard may be blocked — still open the manager */
  }
  window.open("https://chat.line.biz/", "_blank", "noopener,noreferrer");
}

/* ── add-customer modal ────────────────────────────────────────── */
function AddCustomerModal({ onClose, onDone }: { onClose: () => void; onDone: (text: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("กรุณากรอกชื่อ");
    if (phone.replace(/\D/g, "").length < 9) return setErr("กรุณากรอกเบอร์โทรให้ถูกต้อง");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/customers/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rows: [{ name: name.trim(), phone: phone.trim(), email: email.trim(), tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }],
        }),
      });
      const data = (await res.json()) as { created?: number; skipped?: number; error?: string };
      if (data.created) onDone(`เพิ่มลูกค้า “${name.trim()}” แล้ว`);
      else if (data.skipped) setErr("เบอร์โทรนี้มีลูกค้าอยู่แล้ว");
      else setErr(data.error ?? "บันทึกไม่สำเร็จ");
    } catch {
      setErr("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-warm-clay)] focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-[color:var(--color-forest-night)]/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">เพิ่มลูกค้าใหม่</h3>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3.5 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">ชื่อลูกค้า <span className="text-red-500">*</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="เช่น คุณสมชาย ใจดี" autoFocus />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">เบอร์โทร <span className="text-red-500">*</span></span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={field} placeholder="08x-xxx-xxxx" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">อีเมล</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={field} placeholder="(ไม่บังคับ)" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">แท็ก</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={field} placeholder="คั่นด้วย , เช่น VIP, ขาประจำ" />
          </label>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">ยกเลิก</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[color:var(--color-warm-clay)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-60">
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── empty state ───────────────────────────────────────────────── */
function EmptyState({ isFiltered, onImport, onAdd }: { isFiltered: boolean; onImport: () => void; onAdd: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
          <circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.4M21 20c0-2.5-1.4-4.7-3.5-5.6" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[color:var(--color-forest-deep)]">
        {isFiltered ? "ไม่พบลูกค้าตามเงื่อนไข" : "ยังไม่มีลูกค้า"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
        {isFiltered ? "ลองปรับตัวกรองหรือคำค้นหา" : "เริ่มต้นด้วยการเพิ่มลูกค้าเอง หรือนำเข้าจากไฟล์ CSV"}
      </p>
      {!isFiltered && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-warm-clay)] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:var(--color-forest-deep)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            เพิ่มลูกค้า
          </button>
          <button type="button" onClick={onImport} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-slate-50">
            นำเข้า CSV
          </button>
        </div>
      )}
    </div>
  );
}

/* ── sortable header cell ──────────────────────────────────────── */
function SortHead({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (c: SortKey) => void;
  align?: "left" | "center" | "right";
}) {
  const active = sortKey === col;
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <th className="px-5 py-3" aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`group/sort inline-flex w-full items-center gap-1 ${justify} text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${active ? "text-[color:var(--color-forest-deep)]" : "text-slate-400 hover:text-[color:var(--color-forest-deep)]"}`}
      >
        {label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-3 w-3 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-40"}`}>
          {active && sortDir === "asc" ? <path d="m18 15-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" /> : <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </button>
    </th>
  );
}

/* ── checkbox ──────────────────────────────────────────────────── */
function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`flex items-center justify-center rounded-[5px] border transition-colors ${
        checked || indeterminate
          ? "border-[color:var(--color-warm-clay)] bg-[color:var(--color-warm-clay)] text-white"
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
      style={{ height: 18, width: 18 }}
    >
      {indeterminate ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3"><path d="M5 12h14" strokeLinecap="round" /></svg>
      ) : checked ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3"><path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : null}
    </button>
  );
}

/* ── filter chip ──────────────────────────────────────────────── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]" : "border border-slate-200 text-slate-500 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

/* ── KPI card ──────────────────────────────────────────────────── */
function Kpi({
  label,
  value,
  sub,
  delta,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  delta?: number;
  tone: "forest" | "sage" | "clay" | "ink";
  icon: ReactNode;
}) {
  const tints: Record<string, string> = {
    forest: "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]",
    sage: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)]",
    clay: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]",
    ink: "bg-slate-200/70 text-slate-600",
  };
  return (
    <div className={`${CARD} flex items-center gap-4 p-4`}>
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tints[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</div>
        <div className="font-display text-2xl font-semibold leading-tight tabular-nums text-[color:var(--color-forest-deep)]">{value}</div>
        {delta !== undefined ? (
          <div className="mt-0.5 flex items-center gap-1 text-[11px]">
            <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-slate-400"}`}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {delta !== 0 ? `${Math.abs(delta)}%` : ""}
            </span>
            <span className="text-slate-400">เทียบเดือนก่อน</span>
          </div>
        ) : (
          sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── icons ─────────────────────────────────────────────────────── */
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px]">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.4M21 20c0-2.5-1.4-4.7-3.5-5.6" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v6M18 9v6" />
    </svg>
  ),
  bookings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h7" />
    </svg>
  ),
};
