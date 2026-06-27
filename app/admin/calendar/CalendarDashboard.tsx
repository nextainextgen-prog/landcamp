"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DayView, WeekView, MonthView, ListView } from "./CalendarViews";
import {
  Icon,
  MONTHS_TH,
  STATUS,
  SOURCE_LABEL,
  WEEKDAYS_TH,
  addDays,
  daysInMonth,
  parseYmd,
  sourceLabel,
  statusColor,
  statusLabel,
  thaiShortDate,
  ymd,
  type CalBooking,
  type CalRoom,
  type StatusKey,
} from "./calendar-shared";

export type { CalBooking, CalRoom } from "./calendar-shared";

type ViewMode = "day" | "week" | "month" | "list";

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: "day", label: "วัน" },
  { key: "week", label: "สัปดาห์" },
  { key: "month", label: "เดือน" },
  { key: "list", label: "รายการ" },
];

const STATUS_ORDER: StatusKey[] = [
  "confirmed",
  "pending_payment",
  "payment_review",
  "completed",
  "no_show",
];

export function CalendarDashboard({
  bookings,
  rooms,
  today,
}: {
  bookings: CalBooking[];
  rooms: CalRoom[];
  today: string;
}) {
  const [view, setView] = useState<ViewMode>("day");
  const [anchor, setAnchor] = useState<Date>(() => parseYmd(today));
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [roomSel, setRoomSel] = useState<Set<string>>(new Set());
  const [statusSel, setStatusSel] = useState<Set<string>>(new Set());
  const [sourceSel, setSourceSel] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<CalBooking | null>(null);

  function shift(dir: number) {
    if (view === "day") setAnchor((a) => addDays(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
  }
  const goToday = () => setAnchor(parseYmd(today));

  const dateLabel = useMemo(() => {
    if (view === "day") return anchor.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
    if (view === "week") {
      const s = addDays(anchor, -anchor.getDay());
      const e = addDays(s, 6);
      return `${s.getDate()} ${MONTHS_TH[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_TH[e.getMonth()].slice(0, 3)} ${e.getFullYear() + 543}`;
    }
    return `${MONTHS_TH[anchor.getMonth()]} ${anchor.getFullYear() + 543}`;
  }, [view, anchor]);

  // ── Filtering ──
  const visibleRooms = useMemo(
    () => (roomSel.size === 0 ? rooms : rooms.filter((r) => roomSel.has(r.id))),
    [rooms, roomSel],
  );
  const visibleRoomIds = useMemo(() => new Set(visibleRooms.map((r) => r.id)), [visibleRooms]);

  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (!visibleRoomIds.has(b.roomId)) return false;
      if (statusSel.size > 0 && !statusSel.has(b.status)) return false;
      if (sourceSel.size > 0 && !sourceSel.has(b.source)) return false;
      if (q && !(`${b.customer} ${b.code} ${b.room}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [bookings, visibleRoomIds, statusSel, sourceSel, search]);

  // ── Stats for the selected day ──
  const stats = useMemo(() => {
    const key = ymd(anchor);
    const active = visibleBookings.filter((b) => b.check_in <= key && key < b.check_out);
    const revenue = active.reduce((s, b) => s + b.total, 0);
    const occupied = new Set(active.map((b) => b.roomId)).size;
    const util = visibleRooms.length ? Math.round((occupied / visibleRooms.length) * 100) : 0;
    const unpaid = active.filter((b) => b.status === "pending_payment" || b.status === "payment_review").length;
    return { count: active.length, revenue, util, unpaid };
  }, [visibleBookings, anchor, visibleRooms]);

  const hasFilter = roomSel.size + statusSel.size + sourceSel.size > 0 || search.trim().length > 0;
  function clearFilters() {
    setRoomSel(new Set());
    setStatusSel(new Set());
    setSourceSel(new Set());
    setSearch("");
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  function exportCsv() {
    const head = ["รหัส", "ลูกค้า", "ห้อง", "เช็คอิน", "เช็คเอาท์", "คืน", "ยอด", "สถานะ", "ที่มา"];
    const lines = visibleBookings.map((b) =>
      [b.code, b.customer, b.room, b.check_in, b.check_out, b.nights, b.total, statusLabel(b.status), sourceLabel(b.source)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "﻿" + [head.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${ymd(anchor)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white px-4 py-3 shadow-[0_18px_44px_-32px_rgba(45,55,40,0.35)]">
        <button onClick={goToday} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
          วันนี้
        </button>
        <div className="flex items-center gap-1">
          <IconBtn label="ก่อนหน้า" onClick={() => shift(-1)} icon="chevronLeft" />
          <IconBtn label="ถัดไป" onClick={() => shift(1)} icon="chevronRight" />
        </div>
        <span className="min-w-[150px] text-sm font-semibold text-[color:var(--color-forest-deep)]">{dateLabel}</span>

        <div className="flex rounded-lg border border-[color:var(--color-forest-deep)]/12 p-0.5">
          {VIEW_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === t.key
                  ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]"
                  : "text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-forest-deep)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/admin/walk-in"
            className="flex items-center gap-1.5 rounded-lg bg-[color:var(--color-warm-clay)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--color-forest-deep)]"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            เพิ่มการจอง
          </Link>
          <label className="flex items-center gap-2 rounded-lg border border-[color:var(--color-forest-deep)]/15 px-2.5 py-1.5">
            <Icon name="search" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาลูกค้า / รหัส / ห้อง"
              className="w-44 bg-transparent text-xs outline-none placeholder:text-[color:var(--color-ink)]/35"
            />
          </label>
          <ToolBtn icon="filter" active={showFilters} onClick={() => setShowFilters((v) => !v)}>
            ตัวกรอง
          </ToolBtn>
          <ToolBtn icon="printer" onClick={() => window.print()}>
            พิมพ์
          </ToolBtn>
          <ToolBtn icon="download" onClick={exportCsv}>
            Export
          </ToolBtn>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={`grid grid-cols-1 gap-5 ${showFilters ? "lg:grid-cols-[268px_1fr]" : ""}`}>
        {showFilters && (
          <aside className="flex flex-col gap-4">
            <MiniCalendar anchor={anchor} today={today} bookings={visibleBookings} onPick={setAnchor} />

            <Panel title="สถิติ" icon="chart">
              <dl className="flex flex-col gap-2.5 text-sm">
                <StatRow label="จอง" value={`${stats.count} รายการ`} />
                <StatRow label="รายได้" value={`฿${stats.revenue.toLocaleString("en-US")}`} />
                <StatRow label="Utilization" value={`${stats.util}%`} />
                <StatRow
                  label="ค้างชำระ"
                  value={`${stats.unpaid} รายการ`}
                  danger={stats.unpaid > 0}
                />
              </dl>
            </Panel>

            <Panel title="ห้อง" icon="house">
              <ChipGroup>
                {rooms.map((r) => (
                  <Chip key={r.id} active={roomSel.has(r.id)} onClick={() => toggle(roomSel, setRoomSel, r.id)}>
                    <span className="h-2 w-2 rounded-full" style={{ background: statusColor("confirmed") }} />
                    {r.name}
                  </Chip>
                ))}
              </ChipGroup>
            </Panel>

            <Panel title="สถานะการจอง" icon="tasks" action={hasFilter ? { label: "ล้าง", onClick: clearFilters } : undefined}>
              <ChipGroup>
                {STATUS_ORDER.map((s) => (
                  <Chip key={s} active={statusSel.has(s)} onClick={() => toggle(statusSel, setStatusSel, s)}>
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS[s].color }} />
                    {STATUS[s].label}
                  </Chip>
                ))}
              </ChipGroup>
            </Panel>

            <Panel title="ที่มาลูกค้า" icon="users">
              <ChipGroup>
                {Object.keys(SOURCE_LABEL).map((s) => (
                  <Chip key={s} active={sourceSel.has(s)} onClick={() => toggle(sourceSel, setSourceSel, s)}>
                    {sourceLabel(s)}
                  </Chip>
                ))}
              </ChipGroup>
            </Panel>
          </aside>
        )}

        {/* ── Main view ── */}
        {/* self-start so this card never stretches to match a taller filter rail
            (which would leave an empty white gap under the day grid). */}
        <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-32px_rgba(45,55,40,0.35)]">
          {view !== "list" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-4 py-2.5">
              <span className="text-xs font-medium text-[color:var(--color-ink)]/50">
                {visibleBookings.length} การจอง · {visibleRooms.length} ห้อง
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {STATUS_ORDER.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-[11px] text-[color:var(--color-ink)]/55">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS[s].color }} />
                    {STATUS[s].label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {view === "day" && <DayView bookings={visibleBookings} rooms={visibleRooms} anchor={anchor} today={today} onSelect={setSelected} />}
          {view === "week" && <WeekView bookings={visibleBookings} anchor={anchor} today={today} onSelect={setSelected} />}
          {view === "month" && <MonthView bookings={visibleBookings} rooms={visibleRooms} anchor={anchor} today={today} onSelect={setSelected} />}
          {view === "list" && <ListView bookings={visibleBookings} onSelect={setSelected} />}
        </section>
      </div>

      {selected && <BookingDetailModal b={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Booking detail modal — full stay info + link to the customer's profile
// ─────────────────────────────────────────────
function BookingDetailModal({ b, onClose }: { b: CalBooking; onClose: () => void }) {
  const color = statusColor(b.status);
  const createdLabel = b.createdAt
    ? new Date(b.createdAt).toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose} style={{ animation: "fadeIn 120ms ease-out" }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-forest-deep)] to-[color:var(--color-forest-night)] text-base font-semibold text-[color:var(--color-bone)]">
              {b.customer.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-semibold text-[color:var(--color-forest-deep)]">{b.customer}</span>
                {b.isVip && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">VIP</span>}
              </div>
              <div className="font-mono text-[11px] text-[color:var(--color-ink)]/45">{b.code}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-md p-1 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* status */}
        <div className="flex items-center gap-2 px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: color }}>
            {statusLabel(b.status)}
          </span>
          <span className="text-xs text-[color:var(--color-ink)]/50">{sourceLabel(b.source)}</span>
        </div>

        {/* details */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
          <Detail label="ห้องพัก" value={b.room} />
          <Detail label="จำนวนผู้เข้าพัก" value={`${b.guests} คน`} />
          <Detail label="เช็คอิน" value={thaiShortDate(b.check_in)} />
          <Detail label="เช็คเอาท์" value={thaiShortDate(b.check_out)} />
          <Detail label="จำนวนคืน" value={`${b.nights} คืน`} />
          <Detail label="ยอดรวม" value={`฿${b.total.toLocaleString("en-US")}`} />
          {b.phone && <Detail label="เบอร์โทร" value={b.phone} />}
          {createdLabel && <Detail label="วันที่จอง" value={createdLabel} />}
        </dl>

        {/* actions */}
        <div className="flex gap-2 border-t border-[color:var(--color-forest-deep)]/10 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[color:var(--color-forest-deep)]/15 px-4 py-2 text-sm font-medium text-[color:var(--color-ink)]/70 transition-colors hover:bg-[color:var(--color-bone-soft)]/60">
            ปิด
          </button>
          <Link
            href={`/admin/customers/${b.customerId}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></svg>
            ไปหน้าโปรไฟล์ลูกค้า
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wide text-[color:var(--color-ink)]/45">{label}</dt>
      <dd className="text-[color:var(--color-forest-deep)]">{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mini month calendar
// ─────────────────────────────────────────────
function MiniCalendar({
  anchor,
  today,
  bookings,
  onPick,
}: {
  anchor: Date;
  today: string;
  bookings: CalBooking[];
  onPick: (d: Date) => void;
}) {
  const [vm, setVm] = useState<{ y: number; m: number }>({ y: anchor.getFullYear(), m: anchor.getMonth() });
  const selected = ymd(anchor);

  const dotDays = useMemo(() => {
    const set = new Set<string>();
    const total = daysInMonth(vm.y, vm.m);
    for (let d = 1; d <= total; d += 1) {
      const key = ymd(new Date(vm.y, vm.m, d));
      if (bookings.some((b) => b.check_in <= key && key < b.check_out)) set.add(key);
    }
    return set;
  }, [vm, bookings]);

  const cells = useMemo(() => {
    const first = new Date(vm.y, vm.m, 1);
    const start = new Date(vm.y, vm.m, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [vm]);

  function move(delta: number) {
    const d = new Date(vm.y, vm.m + delta, 1);
    setVm({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between">
        <IconBtn label="ก่อนหน้า" onClick={() => move(-1)} icon="chevronLeft" small />
        <span className="text-xs font-semibold text-[color:var(--color-forest-deep)]">
          {MONTHS_TH[vm.m]} {vm.y + 543}
        </span>
        <IconBtn label="ถัดไป" onClick={() => move(1)} icon="chevronRight" small />
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-[color:var(--color-ink)]/40">
        {WEEKDAYS_TH.map((w) => (
          <span key={w} className="py-1">{w.replace(".", "")}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {cells.map((d) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === vm.m;
          const isToday = key === today;
          const isSel = key === selected;
          return (
            <button
              key={key}
              onClick={() => onPick(d)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] tabular-nums transition-colors ${
                isSel
                  ? "bg-[color:var(--color-forest-deep)] font-semibold text-[color:var(--color-bone)]"
                  : isToday
                    ? "border border-[color:var(--color-warm-clay)] text-[color:var(--color-warm-clay)]"
                    : inMonth
                      ? "text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]"
                      : "text-[color:var(--color-ink)]/25"
              }`}
            >
              {d.getDate()}
              {dotDays.has(key) && !isSel && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[color:var(--color-warm-clay)]" />
              )}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────
function Panel({
  title,
  icon,
  action,
  children,
}: {
  title?: string;
  icon?: Parameters<typeof Icon>[0]["name"];
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-4 shadow-[0_18px_44px_-32px_rgba(45,55,40,0.35)]">
      {title && (
        <header className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/60">
            {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
            {title}
          </h3>
          {action && (
            <button onClick={action.onClick} className="text-[11px] font-medium text-[color:var(--color-warm-clay)] hover:underline">
              {action.label}
            </button>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function StatRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[color:var(--color-ink)]/55">{label}</dt>
      <dd className={`font-semibold ${danger ? "text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-forest-deep)]"}`}>
        {value}
      </dd>
    </div>
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-[color:var(--color-forest-deep)] bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]"
          : "border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-ink)]/60 hover:border-[color:var(--color-forest-deep)]/35"
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  label,
  onClick,
  icon,
  small = false,
}: {
  label: string;
  onClick: () => void;
  icon: Parameters<typeof Icon>[0]["name"];
  small?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] ${
        small ? "h-6 w-6" : "h-8 w-8"
      }`}
    >
      <Icon name={icon} className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

function ToolBtn({
  icon,
  active = false,
  onClick,
  children,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-[color:var(--color-forest-deep)] bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]"
          : "border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
      }`}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
