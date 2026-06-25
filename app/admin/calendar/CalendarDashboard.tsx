"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DayView, WeekView, MonthView } from "./CalendarViews";
import {
  Avatar,
  MONTHS_TH,
  addDays,
  parseYmd,
  statusColor,
  statusLabel,
  thaiShortDate,
  timeAgo,
  weekStart,
  type CalBooking,
  type CalRoom,
} from "./calendar-shared";

export type { CalBooking, CalRoom } from "./calendar-shared";

type ViewMode = "day" | "week" | "month";

export function CalendarDashboard({
  bookings,
  rooms,
  today,
  now,
}: {
  bookings: CalBooking[];
  rooms: CalRoom[];
  today: string;
  now: number;
}) {
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState<Date>(() => parseYmd(today));

  function shift(dir: number) {
    if (view === "day") setAnchor((a) => addDays(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
  }
  function goToday() {
    setAnchor(parseYmd(today));
  }

  const label = useMemo(() => {
    if (view === "day") {
      return anchor.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
    }
    if (view === "week") {
      const s = weekStart(anchor);
      const e = addDays(s, 6);
      return `${s.getDate()} ${MONTHS_TH[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_TH[e.getMonth()].slice(0, 3)}`;
    }
    return `${MONTHS_TH[anchor.getMonth()]} ${anchor.getFullYear() + 543}`;
  }, [view, anchor]);

  // ── Derived business lists ──
  const staying = useMemo(
    () =>
      bookings
        .filter((b) => b.check_in <= today && today < b.check_out && b.status !== "no_show")
        .sort((a, b) => a.check_out.localeCompare(b.check_out)),
    [bookings, today],
  );
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.check_in > today)
        .sort((a, b) => a.check_in.localeCompare(b.check_in))
        .slice(0, 12),
    [bookings, today],
  );
  const tasks = useMemo(() => {
    const review = bookings.filter((b) => b.status === "payment_review").length;
    const pending = bookings.filter((b) => b.status === "pending_payment").length;
    const checkIn = bookings.filter((b) => b.check_in === today && b.status !== "no_show").length;
    const checkOut = bookings.filter((b) => b.check_out === today && b.status !== "no_show").length;
    return [
      { key: "review", title: "รอตรวจสลิป", count: review, accent: "#b5654d", href: "/admin/bookings" },
      { key: "pending", title: "รอชำระเงิน", count: pending, accent: "#d4a24c", href: "/admin/bookings" },
      { key: "in", title: "เช็คอินวันนี้", count: checkIn, accent: "#4d584b", href: "/admin/bookings" },
      { key: "out", title: "เช็คเอาท์วันนี้", count: checkOut, accent: "#778475", href: "/admin/bookings" },
    ];
  }, [bookings, today]);
  const activity = useMemo(
    () =>
      [...bookings]
        .filter((b) => b.createdAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [bookings],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[color:var(--color-forest-deep)]">
          ปฏิทินการจอง
        </h1>
        <p className="text-sm text-[color:var(--color-ink)]/55">
          ภาพรวมการเข้าพัก ลูกค้า และสถานะที่ต้องติดตาม
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        {/* ── Left rail: tasks + activity ── */}
        <aside className="flex flex-col gap-6">
          <Card title="สิ่งที่ต้องทำ" icon="📋">
            <div className="flex flex-col gap-2.5">
              {tasks.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/8 bg-white px-3 py-2.5 transition-colors hover:bg-[color:var(--color-bone-soft)]/40"
                  style={{ borderLeft: `3px solid ${t.accent}` }}
                >
                  <span className="flex-1 text-sm font-medium text-[color:var(--color-forest-deep)]">{t.title}</span>
                  <span
                    className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white"
                    style={{ background: t.count > 0 ? t.accent : "#c9c2b4" }}
                  >
                    {t.count}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="ความเคลื่อนไหวล่าสุด" icon="🔔">
            <ul className="flex flex-col gap-3">
              {activity.length === 0 && (
                <li className="text-xs text-[color:var(--color-ink)]/40">ยังไม่มีความเคลื่อนไหว</li>
              )}
              {activity.map((b) => (
                <li key={b.id} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusColor(b.status) }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[color:var(--color-forest-deep)]">
                      <span className="font-medium">{b.customer}</span> · {statusLabel(b.status)}
                    </p>
                    <p className="truncate text-[11px] text-[color:var(--color-ink)]/45">
                      {b.room} · {timeAgo(b.createdAt, now)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CustomerStrip
              title="กำลังเข้าพัก"
              icon="🏡"
              empty="ตอนนี้ไม่มีผู้เข้าพัก"
              items={staying.map((b) => ({
                b,
                sub: `${b.room} · เหลือ ${nightsLeft(today, b.check_out)} คืน`,
              }))}
            />
            <CustomerStrip
              title="การจองที่จะถึง"
              icon="📅"
              empty="ยังไม่มีการจองล่วงหน้า"
              items={upcoming.map((b) => ({
                b,
                sub: `${b.room} · ${thaiShortDate(b.check_in)}`,
              }))}
            />
          </div>

          {/* Calendar */}
          <section className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">
                  <span>🗓️</span> ปฏิทิน
                </h2>
                <div className="flex rounded-lg border border-[color:var(--color-forest-deep)]/12 p-0.5">
                  {(["day", "week", "month"] as ViewMode[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        view === v
                          ? "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)]"
                          : "text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-forest-deep)]"
                      }`}
                    >
                      {v === "day" ? "วัน" : v === "week" ? "สัปดาห์" : "เดือน"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-sm font-medium text-[color:var(--color-forest-deep)]">{label}</span>
                <button onClick={goToday} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
                  วันนี้
                </button>
                <button onClick={() => shift(-1)} aria-label="ก่อนหน้า" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">‹</button>
                <button onClick={() => shift(1)} aria-label="ถัดไป" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-forest-deep)]/15 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">›</button>
              </div>
            </header>

            {view === "day" && <DayView bookings={bookings} anchor={anchor} today={today} />}
            {view === "week" && <WeekView bookings={bookings} anchor={anchor} today={today} />}
            {view === "month" && <MonthView bookings={bookings} rooms={rooms} anchor={anchor} today={today} />}
          </section>
        </div>
      </div>
    </div>
  );
}

function nightsLeft(today: string, checkOut: string): number {
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
      <header className="flex items-center gap-2 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-4 py-3">
        <span>{icon}</span>
        <h3 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CustomerStrip({
  title,
  icon,
  empty,
  items,
}: {
  title: string;
  icon: string;
  empty: string;
  items: { b: CalBooking; sub: string }[];
}) {
  return (
    <Card title={title} icon={icon}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color:var(--color-ink)]/40">{empty}</p>
      ) : (
        <ul className="flex max-h-[188px] flex-col gap-1 overflow-y-auto pr-1">
          {items.map(({ b, sub }) => (
            <li key={`${title}-${b.id}`}>
              <Link
                href={`/admin/customers/${b.customerId}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[color:var(--color-bone-soft)]/45"
              >
                <Avatar name={b.customer} url={b.avatarUrl} vip={b.isVip} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[color:var(--color-forest-deep)]">
                    {b.customer}
                    {b.isVip && <span className="text-[10px] text-[color:var(--color-warm-clay)]">★</span>}
                  </p>
                  <p className="truncate text-xs text-[color:var(--color-ink)]/55">{sub}</p>
                </div>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor(b.status) }} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
