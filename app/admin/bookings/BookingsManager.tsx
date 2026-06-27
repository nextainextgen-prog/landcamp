"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { BookingStatus } from "@/types";
import { siteConfig } from "@/data/siteConfig";
import { ActionButton } from "@/components/admin/ActionButton";
import { useConfirmAction } from "@/components/admin/useConfirmAction";
import { CalendarField } from "@/components/ui/CalendarField";

const ACTIVE_STATUSES = new Set<BookingStatus>(["pending_payment", "payment_review", "confirmed"]);

/* Inline professional icons (no emoji). */
function BIcon({ name, className = "h-3.5 w-3.5" }: { name: string; className?: string }) {
  const p: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4" /></>,
    pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
    cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
    star: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    warn: <><path d="M12 3 2 20h20z" /><path d="M12 9v5M12 17h.01" /></>,
    broom: <><path d="M19 4 9 14M6 21l3-3M4 16l4 4M8 14l2 2" /><path d="M14 9l5 5-3 3-5-5z" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill={name === "star" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name]}
    </svg>
  );
}

export type BookingRow = {
  id: string;
  booking_code: string;
  customer_id: string;
  room_id: string;
  room_name: string;
  room_image: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    provider: string | null;
    lineUserId: string | null;
    isVip: boolean;
    tags: string[];
  };
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: BookingStatus;
  total_amount: number;
  notes: string | null;
  checked_in_at: string | null;
  created_at: string;
  payment: {
    amount: number;
    kind: string;
    status: string;
    verify_status: string | null;
    verify_note: string | null;
    slip_image: string | null;
  } | null;
};

const STATUS_TH: Record<BookingStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};
const STATUS_CLASS: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-neutral-200 text-neutral-600",
  completed: "bg-teal-100 text-teal-800",
  no_show: "bg-red-100 text-red-700",
};
// Solid accent colours for the left status bar on list cards.
const STATUS_ACCENT: Record<BookingStatus, string> = {
  pending_payment: "#d9a441",
  payment_review: "#5b8baf",
  confirmed: "#3fa173",
  cancelled: "#c0bbb0",
  completed: "#2f9e8f",
  no_show: "#c0563f",
};
const VERIFY: Record<string, { label: string; cls: string }> = {
  matched: { label: "สลิปตรง (ยอด+บัญชีถูกต้อง)", cls: "bg-emerald-100 text-emerald-800" },
  amount_mismatch: { label: "ยอดไม่ตรง", cls: "bg-amber-100 text-amber-800" },
  account_mismatch: { label: "บัญชีปลายทางไม่ตรง", cls: "bg-amber-100 text-amber-800" },
  duplicate: { label: "สลิปซ้ำ (เคยใช้แล้ว)", cls: "bg-red-100 text-red-700" },
  unreadable: { label: "อ่านสลิปไม่ออก", cls: "bg-red-100 text-red-700" },
  error: { label: "ระบบตรวจไม่สำเร็จ", cls: "bg-neutral-200 text-neutral-600" },
  pending: { label: "ยังไม่ได้ตรวจ", cls: "bg-neutral-200 text-neutral-600" },
};
const FILTERS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "payment_review", label: "รอตรวจสลิป" },
  { key: "pending_payment", label: "รอชำระ" },
  { key: "confirmed", label: "ยืนยันแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
  { key: "cancelled", label: "ยกเลิก" },
];

function thaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nightsBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
function parseNote(note: string | null): Record<string, unknown> | null {
  if (!note) return null;
  try {
    return JSON.parse(note) as Record<string, unknown>;
  } catch {
    return { message: note };
  }
}

const STEPS = ["จองห้อง", "แนบสลิป", "ยืนยัน", "เข้าพัก", "เสร็จสิ้น"];
function completedSteps(status: BookingStatus): number {
  switch (status) {
    case "pending_payment": return 1;
    case "payment_review": return 2;
    case "confirmed": return 3;
    case "completed": return 5;
    default: return 0; // cancelled / no_show
  }
}

function Stepper({ status, checkedIn = false }: { status: BookingStatus; checkedIn?: boolean }) {
  const terminal = status === "cancelled" || status === "no_show";
  const done = status === "confirmed" && checkedIn ? 4 : completedSteps(status);
  return (
    <div>
      {terminal && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          การจองนี้{STATUS_TH[status]}
        </div>
      )}
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          const isDone = i < done;
          const isCurrent = i === done && !terminal;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-[color:var(--color-warm-clay)] text-white ring-4 ring-[color:var(--color-warm-clay)]/20"
                        : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {isDone ? <BIcon name="check" className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`text-center text-[10px] leading-tight ${isCurrent ? "font-semibold text-[color:var(--color-forest-deep)]" : "text-[color:var(--color-ink)]/50"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`mx-1 mb-4 h-0.5 flex-1 ${i < done ? "bg-emerald-500" : "bg-neutral-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (provider === "line") return <span className="rounded-full bg-[#06C755]/12 px-2 py-0.5 text-[11px] font-medium text-[#06A94B]">LINE</span>;
  if (provider === "google") return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">Google</span>;
  return <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">Walk-in</span>;
}

export function BookingsManager({ initialRows }: { initialRows: BookingRow[] }) {
  const [rows, setRows] = useState<BookingRow[]>(initialRows);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [source, setSource] = useState<"all" | "line" | "google" | "walkin">("all");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "checkin" | "amount">("recent");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialRows[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  function sourceOf(r: BookingRow): "line" | "google" | "walkin" {
    if (r.customer.provider === "line") return "line";
    if (r.customer.provider === "google") return "google";
    return "walkin";
  }

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (source !== "all" && sourceOf(r) !== source) return false;
      if (dateFilter && r.check_in !== dateFilter) return false;
      if (!term) return true;
      return r.booking_code.toLowerCase().includes(term) || r.customer.name.toLowerCase().includes(term) || r.customer.phone.includes(term);
    });
  }, [rows, filter, source, dateFilter, q]);

  const sorted = useMemo(() => {
    const arr = [...visible];
    if (sort === "checkin") arr.sort((a, b) => (a.check_in < b.check_in ? -1 : a.check_in > b.check_in ? 1 : 0));
    else if (sort === "amount") arr.sort((a, b) => b.total_amount - a.total_amount);
    else arr.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    return arr;
  }, [visible, sort]);

  // Group by check-in proximity when sorting by check-in.
  const dayKeys = useMemo(() => {
    const d = new Date();
    const todayKey = ymdLocal(d);
    const tomorrowKey = ymdLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    const weekKey = ymdLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    return { todayKey, tomorrowKey, weekKey };
  }, []);

  const groups = useMemo(() => {
    if (sort !== "checkin") return null;
    const { todayKey, tomorrowKey, weekKey } = dayKeys;
    const buckets: { key: string; label: string; rows: BookingRow[] }[] = [
      { key: "today", label: "เข้าพักวันนี้", rows: [] },
      { key: "tomorrow", label: "พรุ่งนี้", rows: [] },
      { key: "week", label: "ภายใน 7 วัน", rows: [] },
      { key: "later", label: "ภายหลัง", rows: [] },
      { key: "past", label: "ที่ผ่านมา", rows: [] },
    ];
    const by = Object.fromEntries(buckets.map((b) => [b.key, b])) as Record<string, (typeof buckets)[number]>;
    for (const r of sorted) {
      if (r.check_in < todayKey) by.past.rows.push(r);
      else if (r.check_in === todayKey) by.today.rows.push(r);
      else if (r.check_in === tomorrowKey) by.tomorrow.rows.push(r);
      else if (r.check_in <= weekKey) by.week.rows.push(r);
      else by.later.rows.push(r);
    }
    return buckets.filter((b) => b.rows.length > 0);
  }, [sorted, sort, dayKeys]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  // Other active bookings on the same room with overlapping dates.
  const overlaps = useMemo(() => {
    if (!selected) return [];
    return rows.filter(
      (r) =>
        r.id !== selected.id &&
        r.room_name === selected.room_name &&
        ACTIVE_STATUSES.has(r.status) &&
        r.check_in < selected.check_out &&
        selected.check_in < r.check_out,
    );
  }, [rows, selected]);

  async function saveEdit(id: string, edit: { check_in: string; check_out: string; adults: number; children: number; total_amount: number }): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ edit }) });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? "");
      setRows((l) => l.map((r) => (r.id === id ? { ...r, ...edit } : r)));
      setToast("บันทึกการแก้ไขแล้ว");
      setTimeout(() => setToast(null), 2000);
      return true;
    } catch (e) {
      setToast(`แก้ไขไม่สำเร็จ${e instanceof Error && e.message ? `: ${e.message}` : ""}`);
      setTimeout(() => setToast(null), 3000);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function checkIn(id: string): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "check_in" }) });
      if (!res.ok) throw new Error();
      setRows((l) => l.map((r) => (r.id === id ? { ...r, checked_in_at: new Date().toISOString() } : r)));
      setToast("เช็คอินแล้ว · ลูกค้าเข้าพัก");
      setTimeout(() => setToast(null), 2000);
      return true;
    } catch {
      setToast("เช็คอินไม่สำเร็จ ลองใหม่");
      setTimeout(() => setToast(null), 2500);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(id: string, payment: { amount: number; kind: string; method: string }): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ payment }) });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? "");
      setRows((l) => l.map((r) => (r.id === id ? { ...r, payment: { amount: payment.amount, kind: payment.kind, status: "paid", verify_status: r.payment?.verify_status ?? null, verify_note: r.payment?.verify_note ?? null, slip_image: r.payment?.slip_image ?? null } } : r)));
      setToast("บันทึกรับเงินแล้ว");
      setTimeout(() => setToast(null), 2000);
      return true;
    } catch (e) {
      setToast(`บันทึกไม่สำเร็จ${e instanceof Error && e.message ? `: ${e.message}` : ""}`);
      setTimeout(() => setToast(null), 3000);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes(id: string, notes: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notes }) });
      if (!res.ok) throw new Error();
      setRows((l) => l.map((r) => (r.id === id ? { ...r, notes } : r)));
      setToast("บันทึกโน้ตแล้ว");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("บันทึกโน้ตไม่สำเร็จ");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, string>, optimistic: BookingStatus): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setRows((l) => l.map((r) => (r.id === id ? { ...r, status: optimistic } : r)));
      return true;
    } catch {
      setToast("ทำรายการไม่สำเร็จ ลองใหม่");
      setTimeout(() => setToast(null), 2500);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function resendCard(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/bookings/${id}/resend-card`, { method: "POST" });
      setToast("ส่งการ์ด LINE แล้ว (ถ้าลูกค้าผูก LINE ไว้)");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,340px)_minmax(0,1fr)]">
      {/* ── Left: controls (filter card + stats + calendar + source) ── */}
      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink)]/45">สถานะการจอง</div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === f.key ? "bg-[color:var(--color-warm-clay)] text-white" : "bg-[color:var(--color-bone-soft)] text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]/70"}`}
              >
                {f.label}
                {counts[f.key] ? (
                  <span className={`rounded-full px-1.5 text-[10px] ${filter === f.key ? "bg-white/25" : "bg-white text-[color:var(--color-forest-deep)]"}`}>{counts[f.key]}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <StatsBox rows={rows} />
        <MiniCalendar rows={rows} active={dateFilter} onPick={(d) => setDateFilter((cur) => (cur === d ? null : d))} />

        <div className="rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink)]/45">ช่องทางลูกค้า</div>
          <div className="flex flex-wrap gap-1.5">
            {([["all", "ทั้งหมด"], ["line", "LINE"], ["google", "Google"], ["walkin", "Walk-in"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSource(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${source === k ? "bg-[color:var(--color-forest-deep)] text-white" : "bg-[color:var(--color-bone-soft)] text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]/70"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Middle: list ── */}
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-3 shadow-sm">
        {/* search */}
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35"><BIcon name="search" className="h-4 w-4" /></span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ชื่อ / เบอร์ / รหัสจอง"
            className="w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)]/40 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[color:var(--color-warm-clay)] focus:bg-white"
          />
        </div>
        {/* list toolbar: count · sort */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[color:var(--color-ink)]/50">{sorted.length} รายการ</span>
          <label className="flex items-center gap-1.5 text-xs text-[color:var(--color-ink)]/50">
            เรียงโดย
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-2 py-1 text-xs font-medium text-[color:var(--color-forest-deep)] outline-none focus:border-[color:var(--color-warm-clay)]"
            >
              <option value="recent">ใหม่สุด</option>
              <option value="checkin">ใกล้เข้าพัก</option>
              <option value="amount">ยอดสูงสุด</option>
            </select>
          </label>
        </div>

        {/* active date-filter chip */}
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter(null)}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--color-warm-clay)]/12 px-3 py-1 text-xs font-medium text-[color:var(--color-warm-clay)] hover:bg-[color:var(--color-warm-clay)]/20"
          >
            เข้าพัก {thaiDate(dateFilter)} <span className="text-sm leading-none">×</span>
          </button>
        )}

        <ul className="flex max-h-[78vh] flex-col gap-2 overflow-y-auto pr-1">
          {sorted.length === 0 && <li className="rounded-lg border border-dashed p-6 text-center text-sm text-[color:var(--color-ink)]/45">ไม่พบรายการ</li>}
          {groups
            ? groups.map((g) => (
                <li key={g.key} className="flex flex-col gap-2">
                  <div className="sticky top-0 z-[1] flex items-center gap-2 bg-white/90 py-1 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/60">{g.label}</span>
                    <span className="rounded-full bg-[color:var(--color-bone-soft)] px-1.5 text-[10px] font-medium text-[color:var(--color-ink)]/55">{g.rows.length}</span>
                  </div>
                  {g.rows.map((r) => (
                    <BookingCard key={r.id} r={r} active={selectedId === r.id} onSelect={() => setSelectedId(r.id)} dayKeys={dayKeys} busy={busy} onPatch={patch} onZoom={setZoom} />
                  ))}
                </li>
              ))
            : sorted.map((r) => (
                <li key={r.id}>
                  <BookingCard r={r} active={selectedId === r.id} onSelect={() => setSelectedId(r.id)} dayKeys={dayKeys} busy={busy} onPatch={patch} onZoom={setZoom} />
                </li>
              ))}
        </ul>
      </div>

      {/* ── Detail ── */}
      <div className="min-w-0">
        {!selected ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[color:var(--color-forest-deep)]/15 text-sm text-[color:var(--color-ink)]/45">
            เลือกการจองทางซ้ายเพื่อดูรายละเอียด
          </div>
        ) : (
          <BookingDetail key={selected.id} r={selected} busy={busy} overlaps={overlaps} onPatch={patch} onResend={resendCard} onZoom={setZoom} onSaveNotes={saveNotes} onSaveEdit={saveEdit} onRecordPayment={recordPayment} onCheckIn={checkIn} />
        )}
        {toast && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</div>}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="สลิป" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function BookingCard({
  r,
  active,
  onSelect,
  dayKeys,
  busy,
  onPatch,
  onZoom,
}: {
  r: BookingRow;
  active: boolean;
  onSelect: () => void;
  dayKeys: { todayKey: string; tomorrowKey: string };
  busy: boolean;
  onPatch: (id: string, body: Record<string, string>, optimistic: BookingStatus) => void;
  onZoom: (src: string) => void;
}) {
  const isToday = r.check_in === dayKeys.todayKey;
  const isTomorrow = r.check_in === dayKeys.tomorrowKey;
  const needsAction = r.status === "payment_review";
  const inHouse = r.status === "confirmed" && Boolean(r.checked_in_at);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border py-3 pl-4 pr-3.5 transition-all ${
        active
          ? "border-[color:var(--color-warm-clay)]/45 bg-[color:var(--color-warm-clay)]/[0.06] shadow-sm"
          : needsAction
            ? "border-blue-300/70 bg-blue-50/40 ring-1 ring-blue-200 hover:shadow-sm"
            : "border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/30 hover:bg-[color:var(--color-bone-soft)]/50 hover:shadow-sm"
      }`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: STATUS_ACCENT[r.status] }} aria-hidden />
      <div className="flex items-start gap-3">
        <Avatar c={r.customer} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-semibold text-[color:var(--color-forest-deep)]">{r.customer.name}</span>
              {r.customer.isVip && <span className="flex-shrink-0 text-amber-500"><BIcon name="star" className="h-3 w-3" /></span>}
            </span>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[r.status]}`}>{STATUS_TH[r.status]}</span>
          </div>
          <div className="mt-0.5 flex items-end justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              {inHouse && <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> อยู่ในที่พัก</span>}
              {!inHouse && isToday && <span className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">วันนี้</span>}
              {!inHouse && isTomorrow && <span className="flex-shrink-0 rounded-full bg-[color:var(--color-warm-clay)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-warm-clay)]">พรุ่งนี้</span>}
              <span className="truncate text-xs text-[color:var(--color-ink)]/55">{r.room_name} · {shortDate(r.check_in)}</span>
            </span>
            <span className="flex-shrink-0 text-sm font-semibold text-[color:var(--color-forest-deep)]">฿{r.total_amount.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-[color:var(--color-ink)]/35">{r.booking_code}</div>
        </div>
      </div>

      {needsAction && (
        <div className="mt-2.5 flex gap-2 border-t border-[color:var(--color-forest-deep)]/8 pt-2.5">
          {r.payment?.slip_image && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onZoom(r.payment!.slip_image!); }}
              className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
            >
              ดูสลิป
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); onPatch(r.id, { action: "confirm" }, "confirmed"); }}
            className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--color-warm-clay)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
          >
            <BIcon name="check" className="h-3.5 w-3.5" /> ยืนยัน
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ c }: { c: BookingRow["customer"] }) {
  return (
    <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]">
      {c.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.avatar} alt={c.name} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{(c.name || "?").charAt(0)}</span>
      )}
    </span>
  );
}

function StatRow({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[color:var(--color-ink)]/55">{label}</dt>
      <dd className={`font-semibold ${cls || "text-[color:var(--color-forest-deep)]"}`}>{value}</dd>
    </div>
  );
}

function StatsBox({ rows }: { rows: BookingRow[] }) {
  const revenue = rows.filter((r) => r.status === "confirmed" || r.status === "completed").reduce((s, r) => s + r.total_amount, 0);
  const review = rows.filter((r) => r.status === "payment_review").length;
  const pending = rows.filter((r) => r.status === "pending_payment").length;
  return (
    <div className="rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink)]/45">สรุป</div>
      <dl className="flex flex-col gap-2 text-sm">
        <StatRow label="จองทั้งหมด" value={`${rows.length} รายการ`} />
        <StatRow label="รายได้ (ยืนยัน+เสร็จ)" value={`฿${revenue.toLocaleString("en-US")}`} />
        <StatRow label="รอตรวจสลิป" value={`${review}`} cls={review ? "text-blue-600" : ""} />
        <StatRow label="ค้างชำระ" value={`${pending}`} cls={pending ? "text-red-600" : ""} />
      </dl>
    </div>
  );
}

function MiniCalendar({ rows, active, onPick }: { rows: BookingRow[]; active: string | null; onPick: (iso: string) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const checkInDays = useMemo(() => new Set(rows.map((r) => r.check_in)), [rows]);
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDow = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const iso = (d: number) => `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(new Date(year, m - 1, 1))} className="rounded px-2 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">‹</button>
        <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{month.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => setMonth(new Date(year, m + 1, 1))} className="rounded px-2 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[color:var(--color-ink)]/40">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const di = iso(d);
          const has = checkInDays.has(di);
          const isActive = active === di;
          return (
            <button
              key={i}
              type="button"
              disabled={!has}
              onClick={() => has && onPick(di)}
              className={`relative h-7 rounded-md text-xs ${isActive ? "bg-[color:var(--color-warm-clay)] font-semibold text-white" : has ? "font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]" : "text-[color:var(--color-ink)]/30"}`}
            >
              {d}
              {has && !isActive && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[color:var(--color-warm-clay)]" />}
            </button>
          );
        })}
      </div>
      {active && <button type="button" onClick={() => onPick(active)} className="mt-2 text-xs text-[color:var(--color-warm-clay)] hover:underline">ล้างวันที่ที่เลือก</button>}
    </div>
  );
}

function BookingDetail({
  r,
  busy,
  overlaps,
  onPatch,
  onResend,
  onZoom,
  onSaveNotes,
  onSaveEdit,
  onRecordPayment,
  onCheckIn,
}: {
  r: BookingRow;
  busy: boolean;
  overlaps: BookingRow[];
  onPatch: (id: string, body: Record<string, string>, optimistic: BookingStatus) => Promise<boolean>;
  onResend: (id: string) => void;
  onZoom: (src: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onSaveEdit: (id: string, edit: { check_in: string; check_out: string; adults: number; children: number; total_amount: number }) => Promise<boolean>;
  onRecordPayment: (id: string, payment: { amount: number; kind: string; method: string }) => Promise<boolean>;
  onCheckIn: (id: string) => Promise<boolean>;
}) {
  const c = r.customer;
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const { confirm, dialog } = useConfirmAction();
  const [noteDraft, setNoteDraft] = useState(r.notes ?? "");
  const [copied, setCopied] = useState<"" | "summary" | "map">("");
  const [hkSent, setHkSent] = useState(false);
  const [audit, setAudit] = useState<{ id: string; actor: string | null; action: string; to_status: string | null; created_at: string }[]>([]);

  async function sendHousekeeping() {
    const res = await fetch("/api/admin/housekeeping", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ room_id: r.room_id, booking_id: r.id, note: "ทำความสะอาดหลังเช็คเอาท์" }) });
    if (!res.ok) throw new Error("ส่งงานแม่บ้านไม่สำเร็จ");
    setHkSent(true);
    setTimeout(() => setHkSent(false), 2500);
  }
  const nights = nightsBetween(r.check_in, r.check_out);
  const inHouse = r.status === "confirmed" && Boolean(r.checked_in_at);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${r.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const d = (await res.json()) as { items?: typeof audit };
        if (alive) setAudit(d.items ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => { alive = false; };
    // re-fetch when the booking or its status/check-in changes
  }, [r.id, r.status, r.checked_in_at]);

  function flash(which: "summary" | "map") {
    setCopied(which);
    setTimeout(() => setCopied(""), 1500);
  }
  function copySummary() {
    const text = [
      `การจอง ${r.booking_code}`,
      `ลูกค้า: ${c.name}${c.phone ? ` (${c.phone})` : ""}`,
      `ห้อง: ${r.room_name}`,
      `เข้าพัก: ${thaiDate(r.check_in)} → ${thaiDate(r.check_out)} (${nights} คืน)`,
      `ผู้เข้าพัก: ผู้ใหญ่ ${r.adults}${r.children > 0 ? ` · เด็ก ${r.children}` : ""}`,
      `ยอด: ฿${r.total_amount.toLocaleString("en-US")}`,
      `สถานะ: ${STATUS_TH[r.status]}`,
    ].join("\n");
    void navigator.clipboard?.writeText(text);
    flash("summary");
  }
  function copyMap() {
    void navigator.clipboard?.writeText(siteConfig.contact.googleMaps);
    flash("map");
  }
  const note = parseNote(r.payment?.verify_note ?? null);
  const verify = r.payment?.verify_status ? VERIFY[r.payment.verify_status] ?? VERIFY.pending : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-5 shadow-sm">
      {overlaps.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <BIcon name="warn" className="mt-px h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            ห้องนี้มีการจองช่วงวันที่ทับซ้อน {overlaps.length} รายการ:{" "}
            <span className="font-semibold">{overlaps.map((o) => o.booking_code).join(", ")}</span> — ตรวจสอบก่อนยืนยัน
          </span>
        </div>
      )}
      {/* Customer */}
      <div className="flex items-start gap-3 border-b border-[color:var(--color-forest-deep)]/8 pb-4">
        <Avatar c={c} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[color:var(--color-forest-deep)]">{c.name}</h3>
            <ProviderBadge provider={c.provider} />
            {c.isVip && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"><BIcon name="star" className="h-3 w-3" /> VIP</span>}
            {c.tags.map((t) => <span key={t} className="rounded-full bg-[color:var(--color-bone-soft)] px-2 py-0.5 text-[11px] text-[color:var(--color-forest-deep)]/70">{t}</span>)}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[color:var(--color-ink)]/60">
            {c.phone && <span className="inline-flex items-center gap-1"><BIcon name="phone" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/40" /> {c.phone}</span>}
            {c.email && <span className="inline-flex items-center gap-1 truncate"><BIcon name="mail" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/40" /> {c.email}</span>}
            {c.lineUserId && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#06C755]" /> LINE ผูกแล้ว</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setPhoneOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="phone" /> โทร</button>
            {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="mail" /> อีเมล</a>}
            <a href={`/admin/customers/${r.customer_id}`} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">ดูประวัติลูกค้า</a>
            <button type="button" onClick={copyMap} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="pin" /> {copied === "map" ? "คัดลอกลิงก์แล้ว" : "แผนที่"}</button>
            <button type="button" onClick={copySummary} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="clipboard" /> {copied === "summary" ? "คัดลอกแล้ว" : "คัดลอกสรุป"}</button>
            {ACTIVE_STATUSES.has(r.status) && (
              <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="pencil" /> แก้ไขการจอง</button>
            )}
            <button type="button" onClick={() => setPayOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-2.5 py-1 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"><BIcon name="cash" /> บันทึกรับเงิน</button>
            <ActionButton variant="secondary" size="sm" onClick={sendHousekeeping} pendingLabel="กำลังส่ง…" doneLabel="ส่งงานแล้ว" className="!rounded-lg !px-2.5 !py-1 !text-xs !font-medium" icon={<BIcon name="broom" />}>{hkSent ? "ส่งงานแล้ว" : "ส่งงานแม่บ้าน"}</ActionButton>
            {c.lineUserId && <button type="button" disabled={busy} onClick={() => onResend(r.id)} className="rounded-lg border border-[#06C755]/40 px-2.5 py-1 text-xs text-[#06A94B] hover:bg-[#06C755]/8 disabled:opacity-50">ส่งการ์ด LINE</button>}
          </div>
        </div>
      </div>

      {/* Booking detail */}
      <div className="flex gap-4">
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[color:var(--color-bone-soft)]">
          {r.room_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.room_image} alt={r.room_name} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[color:var(--color-ink)]/50">{r.booking_code}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_CLASS[r.status]}`}>{STATUS_TH[r.status]}</span>
          </div>
          <div className="mt-0.5 font-semibold text-[color:var(--color-forest-deep)]">{r.room_name}</div>
          <div className="mt-1 text-[color:var(--color-ink)]/75">
            <span className="font-medium">{thaiDate(r.check_in)}</span> → <span className="font-medium">{thaiDate(r.check_out)}</span>
            <span className="text-[color:var(--color-ink)]/50"> ({nights} คืน)</span>
          </div>
          <div className="mt-0.5 text-xs text-[color:var(--color-ink)]/55">
            ผู้ใหญ่ {r.adults}{r.children > 0 ? ` · เด็ก ${r.children}` : ""} · {r.payment?.kind === "deposit" ? "มัดจำ" : "ชำระเต็ม"} · จองเมื่อ {thaiDate(r.created_at)}
          </div>
          <div className="mt-1 font-display text-xl text-[color:var(--color-forest-deep)]">฿{r.total_amount.toLocaleString("en-US")}</div>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-y border-[color:var(--color-forest-deep)]/8 py-4">
        <Stepper status={r.status} checkedIn={inHouse} />
      </div>

      {/* Auto slip-check result (system-verified — no manual checking) */}
      {r.payment && (
        <div className="flex flex-col gap-2 rounded-xl bg-[color:var(--color-bone-soft)]/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">ผลตรวจสลิปอัตโนมัติ</span>
            {verify && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verify.cls}`}>{verify.label}</span>}
          </div>
          <p className="text-[11px] text-[color:var(--color-ink)]/45">
            ระบบตรวจให้อัตโนมัติด้วย EasySlip (ยอด · บัญชีปลายทาง · สลิปซ้ำ/ปลอม) — ไม่ต้องตรวจเอง
          </p>
          {note && (note.amountInSlip || note.sender) ? (
            <div className="text-xs text-[color:var(--color-ink)]/55">
              {note.amountInSlip ? <>ยอดในสลิป ฿{String(note.amountInSlip)} </> : null}
              {note.sender ? <>· ผู้โอน {String(note.sender)}</> : null}
            </div>
          ) : null}
          {r.payment.slip_image ? (
            <button type="button" onClick={() => onZoom(r.payment!.slip_image!)} className="self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.payment.slip_image} alt="สลิป" className="h-40 w-auto rounded-lg border border-[color:var(--color-forest-deep)]/10 object-contain" />
            </button>
          ) : (
            <p className="text-xs text-[color:var(--color-ink)]/45">ยังไม่มีสลิป</p>
          )}
        </div>
      )}

      {/* Internal note / special request */}
      <div className="rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/30 p-4">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">โน้ต / คำขอพิเศษ</div>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={2}
          placeholder="บันทึกภายใน เช่น ขอเตียงเสริม · มาดึก · แพ้อาหาร…"
          className="w-full resize-y rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={busy || noteDraft.trim() === (r.notes ?? "")}
            onClick={() => onSaveNotes(r.id, noteDraft.trim())}
            className="rounded-lg bg-[color:var(--color-forest-deep)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--color-warm-clay)] disabled:opacity-40"
          >
            บันทึกโน้ต
          </button>
        </div>
      </div>

      {/* Audit trail */}
      {audit.length > 0 && (
        <div className="rounded-xl border border-[color:var(--color-forest-deep)]/10 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">ประวัติการดำเนินการ</div>
          <ul className="flex flex-col gap-1.5">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[color:var(--color-ink)]/75">
                  {a.action === "check_in" ? "เช็คอิน" : a.to_status && STATUS_TH[a.to_status as BookingStatus] ? STATUS_TH[a.to_status as BookingStatus] : a.action}
                </span>
                <span className="text-[color:var(--color-ink)]/40">
                  {a.actor ?? "—"} · {new Date(a.created_at).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--color-forest-deep)]/8 pt-4">
        {r.status === "payment_review" && (
          <>
            <button type="button" disabled={busy} onClick={() => confirm({ title: "ยืนยันการจอง", message: `ยืนยันการจอง ${r.booking_code} ของ ${c.name}? ระบบจะส่งการ์ดยืนยันให้ลูกค้า`, confirmLabel: "ยืนยัน", successText: "ยืนยันแล้ว", run: async () => { if (!(await onPatch(r.id, { action: "confirm" }, "confirmed"))) throw new Error("ทำรายการไม่สำเร็จ ลองใหม่"); } })} className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50">ยืนยันการจอง</button>
            <button type="button" disabled={busy} onClick={() => confirm({ title: "ปฏิเสธการจอง", message: `ปฏิเสธสลิปและยกเลิก ${r.booking_code}? การจองจะถูกยกเลิก`, confirmLabel: "ปฏิเสธ", danger: true, successText: "ปฏิเสธแล้ว", run: async () => { if (!(await onPatch(r.id, { action: "reject" }, "cancelled"))) throw new Error("ทำรายการไม่สำเร็จ ลองใหม่"); } })} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">ปฏิเสธ</button>
          </>
        )}
        {r.status === "confirmed" && !inHouse && (
          <>
            <ActionButton variant="primary" onClick={async () => { if (!(await onCheckIn(r.id))) throw new Error("เช็คอินไม่สำเร็จ"); }} pendingLabel="กำลังเช็คอิน…" doneLabel="เช็คอินแล้ว" className="!text-sm">เช็คอิน (ลูกค้ามาถึง)</ActionButton>
            <button type="button" disabled={busy} onClick={() => confirm({ title: "ไม่มาตามนัด", message: `ยืนยันว่า ${c.name} ไม่มาเข้าพักตามนัด (${r.booking_code})?`, confirmLabel: "ไม่มาตามนัด", danger: true, successText: "บันทึกแล้ว", run: async () => { if (!(await onPatch(r.id, { status: "no_show" }, "no_show"))) throw new Error("ทำรายการไม่สำเร็จ ลองใหม่"); } })} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2 text-sm text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50">ไม่มาตามนัด</button>
          </>
        )}
        {r.status === "confirmed" && inHouse && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> อยู่ในที่พัก</span>
            <button type="button" disabled={busy} onClick={() => onPatch(r.id, { status: "completed" }, "completed")} className="rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">เช็คเอาท์แล้ว</button>
          </>
        )}
        {(r.status === "pending_payment" || r.status === "payment_review" || r.status === "confirmed") && (
          <button type="button" disabled={busy} onClick={() => confirm({ title: "ยกเลิกการจอง", message: `ยกเลิก ${r.booking_code} ของ ${c.name}? การดำเนินการนี้ย้อนกลับไม่ได้`, confirmLabel: "ยกเลิกการจอง", danger: true, successText: "ยกเลิกแล้ว", run: async () => { if (!(await onPatch(r.id, { status: "cancelled" }, "cancelled"))) throw new Error("ทำรายการไม่สำเร็จ ลองใหม่"); } })} className="ml-auto rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">ยกเลิกการจอง</button>
        )}
      </div>

      {phoneOpen && <PhonePopup name={c.name} phone={c.phone} onClose={() => setPhoneOpen(false)} />}
      {editOpen && (
        <EditDialog
          r={r}
          busy={busy}
          onClose={() => setEditOpen(false)}
          onSave={async (edit) => {
            const ok = await onSaveEdit(r.id, edit);
            if (ok) setEditOpen(false);
          }}
        />
      )}
      {payOpen && (
        <PaymentDialog
          r={r}
          busy={busy}
          onClose={() => setPayOpen(false)}
          onSave={async (payment) => {
            const ok = await onRecordPayment(r.id, payment);
            if (ok) setPayOpen(false);
          }}
        />
      )}
      {dialog}
    </div>
  );
}

function EditDialog({
  r,
  busy,
  onClose,
  onSave,
}: {
  r: BookingRow;
  busy: boolean;
  onClose: () => void;
  onSave: (edit: { check_in: string; check_out: string; adults: number; children: number; total_amount: number }) => void;
}) {
  const [checkIn, setCheckIn] = useState(r.check_in);
  const [checkOut, setCheckOut] = useState(r.check_out);
  const [adults, setAdults] = useState(r.adults);
  const [children, setChildren] = useState(r.children);
  const [total, setTotal] = useState(r.total_amount);
  const nights = nightsBetween(checkIn, checkOut);
  const valid = checkOut > checkIn && adults >= 1 && total >= 0;
  const inputCls = "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[color:var(--color-forest-deep)]">แก้ไขการจอง {r.booking_code}</h3>
        <p className="mt-1 text-xs text-[color:var(--color-ink)]/45">{r.room_name}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ช่วงวันเข้าพัก
            <CalendarField
              mode="range"
              start={checkIn}
              end={checkOut}
              onRangeChange={({ start, end }) => { setCheckIn(start); setCheckOut(end); }}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ผู้ใหญ่
            <input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">เด็ก
            <input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ยอดรวม (บาท)
            <input type="number" min={0} value={total} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
          </label>
        </div>
        <p className="mt-2 text-xs text-[color:var(--color-ink)]/45">{nights > 0 ? `${nights} คืน` : "วันเช็คเอาท์ต้องหลังเช็คอิน"} · ระบบจะปฏิเสธถ้าช่วงวันที่ชนกับการจองอื่นของห้องนี้</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2 text-sm text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]">ยกเลิก</button>
          <button
            type="button"
            disabled={busy || !valid}
            onClick={() => onSave({ check_in: checkIn, check_out: checkOut, adults, children, total_amount: total })}
            className="rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({
  r,
  busy,
  onClose,
  onSave,
}: {
  r: BookingRow;
  busy: boolean;
  onClose: () => void;
  onSave: (payment: { amount: number; kind: string; method: string }) => void;
}) {
  const [amount, setAmount] = useState(r.total_amount);
  const [kind, setKind] = useState("full");
  const [method, setMethod] = useState("cash");
  const inputCls = "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[color:var(--color-forest-deep)]">บันทึกรับเงิน · {r.booking_code}</h3>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">จำนวนเงิน (บาท)
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ประเภท
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
              <option value="full">ชำระเต็มจำนวน</option>
              <option value="deposit">มัดจำ</option>
              <option value="remainder">ส่วนที่เหลือ</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ช่องทาง
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              <option value="cash">เงินสด</option>
              <option value="transfer">โอน</option>
              <option value="promptpay">พร้อมเพย์</option>
              <option value="card">บัตร</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2 text-sm text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]">ยกเลิก</button>
          <button type="button" disabled={busy || amount <= 0} onClick={() => onSave({ amount, kind, method })} className="rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50">บันทึก</button>
        </div>
      </div>
    </div>
  );
}

function PhonePopup({ name, phone, onClose }: { name: string; phone: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const has = Boolean(phone && phone.trim());
  function copy() {
    if (!has) return;
    void navigator.clipboard?.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]"><BIcon name="phone" className="h-5 w-5" /></div>
        <div className="text-sm text-[color:var(--color-ink)]/55">โทรหา {name}</div>
        {has ? (
          <>
            <div className="mt-1 select-all font-display text-2xl font-bold tracking-wide text-[color:var(--color-forest-deep)]">{phone}</div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={copy} className="flex-1 rounded-lg border border-[color:var(--color-forest-deep)]/20 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
                {copied ? "คัดลอกแล้ว" : "คัดลอกเบอร์"}
              </button>
              <a href={`tel:${phone}`} className="flex-1 rounded-lg bg-[color:var(--color-forest-deep)] py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-warm-clay)]">โทรออก</a>
            </div>
          </>
        ) : (
          <div className="mt-2 text-sm text-[color:var(--color-ink)]/45">ลูกค้ายังไม่มีเบอร์โทรในระบบ</div>
        )}
        <button type="button" onClick={onClose} className="mt-4 text-xs text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/70">ปิด</button>
      </div>
    </div>
  );
}
