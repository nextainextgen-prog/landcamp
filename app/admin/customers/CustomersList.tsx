"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Channel = "line" | "google" | "walk_in" | "online";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  is_vip: boolean;
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
  vip: number;
  revenue: number;
  withPhone: number;
};

type ChannelFilter = "all" | Channel;
type PhoneFilter = "all" | "yes" | "no";

function thaiDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean || clean === "—") return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const CHANNEL_META: Record<Channel, { label: string; cls: string }> = {
  line: { label: "LINE", cls: "bg-[#06C755]/12 text-[#05a948] ring-[#06C755]/25" },
  google: { label: "Google", cls: "bg-blue-100 text-blue-700 ring-blue-200" },
  walk_in: { label: "Walk-in", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
  online: { label: "ออนไลน์", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

function toCsv(rows: CustomerRow[]): string {
  const head = ["ชื่อ", "อีเมล", "เบอร์โทร", "ช่องทาง", "จอง", "ยอดใช้จ่าย", "จองล่าสุด", "VIP"];
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
      r.is_vip ? "VIP" : "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.map(esc).join(","), ...lines].join("\r\n");
}

export function CustomersList({
  initialRows,
  stats,
}: {
  initialRows: CustomerRow[];
  stats: CustomerStats;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [vipOnly, setVipOnly] = useState(false);
  const [phone, setPhone] = useState<PhoneFilter>("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return initialRows.filter((r) => {
      if (channel !== "all" && r.channel !== channel) return false;
      if (vipOnly && !r.is_vip) return false;
      if (phone === "yes" && r.phone.trim().length === 0) return false;
      if (phone === "no" && r.phone.trim().length > 0) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [q, channel, vipOnly, phone, initialRows]);

  const phonePct = stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0;

  function exportCsv() {
    const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ลูกค้าทั้งหมด" value={stats.total.toLocaleString("en-US")} tone="forest" icon={ICONS.users} />
        <Stat label="ใหม่เดือนนี้" value={stats.newThisMonth.toLocaleString("en-US")} tone="sage" icon={ICONS.calendar} />
        <Stat label="ลูกค้า VIP" value={stats.vip.toLocaleString("en-US")} tone="clay" icon={ICONS.star} />
        <Stat
          label="มีเบอร์โทร"
          value={`${phonePct}%`}
          sub={`${stats.withPhone.toLocaleString("en-US")}/${stats.total.toLocaleString("en-US")} ราย`}
          tone="ink"
          icon={ICONS.phone}
        />
      </div>

      {/* List card */}
      <section className={CARD}>
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">รายชื่อลูกค้า</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {rows.length.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ค้นหาชื่อ / อีเมล / เบอร์ / แท็ก"
                  className="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-[color:var(--color-ink)] outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--color-warm-clay)]/45 focus:bg-white focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15"
                />
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={rows.length === 0}
                title="ส่งออก CSV"
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={channel === "all"} onClick={() => setChannel("all")}>ทั้งหมด</Chip>
            <Chip active={channel === "line"} onClick={() => setChannel("line")}>LINE</Chip>
            <Chip active={channel === "google"} onClick={() => setChannel("google")}>Google</Chip>
            <Chip active={channel === "walk_in"} onClick={() => setChannel("walk_in")}>Walk-in</Chip>
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <Chip active={vipOnly} onClick={() => setVipOnly((v) => !v)}>★ VIP</Chip>
            <Chip active={phone === "yes"} onClick={() => setPhone((p) => (p === "yes" ? "all" : "yes"))}>มีเบอร์</Chip>
            <Chip active={phone === "no"} onClick={() => setPhone((p) => (p === "no" ? "all" : "no"))}>ไม่มีเบอร์</Chip>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">
              {initialRows.length === 0 ? "ยังไม่มีลูกค้า — ลูกค้าจะปรากฏเมื่อมีการลงทะเบียน/จอง หรือเพิ่มผ่าน Walk-in" : "ไม่พบลูกค้าตามเงื่อนไข"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <th className="px-5 py-3">ลูกค้า</th>
                  <th className="px-5 py-3">ติดต่อ</th>
                  <th className="px-5 py-3">ช่องทาง</th>
                  <th className="px-5 py-3 text-center">จอง</th>
                  <th className="px-5 py-3 text-right">ยอดใช้จ่าย</th>
                  <th className="px-5 py-3">จองล่าสุด</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/admin/customers/${r.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-forest-deep)]/8 text-xs font-semibold text-[color:var(--color-forest-deep)]">
                          {initials(r.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[color:var(--color-forest-deep)]">{r.name}</span>
                            {r.is_vip && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                                ★ VIP
                              </span>
                            )}
                          </div>
                          {r.tags.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {r.tags.slice(0, 2).map((t) => (
                                <span key={t} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                  {t}
                                </span>
                              ))}
                              {r.tags.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{r.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[color:var(--color-ink)]/75">{r.email}</div>
                      {r.phone ? (
                        <div className="text-xs text-slate-400">{r.phone}</div>
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
                      <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {r.bookings_count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[color:var(--color-forest-deep)]">
                      ฿{r.total_spent.toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-ink)]/65">{thaiDate(r.last_booking)}</td>
                    <td className="px-5 py-3 text-right">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[color:var(--color-warm-clay)]"
                      >
                        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── filter chip ──────────────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]"
          : "border border-slate-200 text-slate-500 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

/* ── summary stat card ─────────────────────────────────────────── */
function Stat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
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
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tints[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</div>
        <div className="font-display text-2xl font-semibold leading-tight text-[color:var(--color-forest-deep)]">
          {value}
        </div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
    </div>
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
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19l1-5.8L3.6 9.1l5.8-.8z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  ),
};
