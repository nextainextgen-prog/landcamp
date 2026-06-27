"use client";

import Link from "next/link";
import { useState } from "react";

import {
  BOOKING_STATUS_CUSTOMER,
  STATUS_TONE_BADGE,
  formatTHB,
  formatThaiDate,
  getInitials,
} from "@/lib/account/format";
import type { BookingStatus } from "@/types";

export type BookingCard = {
  id: string;
  booking_code: string;
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  extra_bed: boolean;
  base_amount: number;
  extra_bed_amount: number;
  total_amount: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  slip_image: string | null;
  trans_ref: string | null;
};

export type Profile = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  providerLabel: string;
};

/* ── inline icons ── */
function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const p: Record<string, React.ReactNode> = {
    chevron: <path d="m6 9 6 6 6-6" />,
    download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
    doc: <><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" /><path d="M14 2v6h6" /></>,
    receipt: <><path d="M6 2h12v20l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 22Z" /><path d="M9 8h6M9 12h6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 17-5-5L5 21" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.2 2.7-5.8 6-5.8s6 2.6 6 5.8" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6.2" /></>,
    tag: <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="7.5" cy="7.5" r="1.3" /></>,
    check: <path d="m20 6-11 11-5-5" />,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name] ?? null}
    </svg>
  );
}

export function AccountDashboard({
  profile,
  bookings,
}: {
  profile: Profile;
  bookings: BookingCard[];
}) {
  const [slip, setSlip] = useState<string | null>(null);
  const initials = getInitials(profile.fullName);

  // Nearest upcoming stay that is secured (review/confirmed) — surfaced up top.
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = bookings
    .filter((b) => (b.status === "confirmed" || b.status === "payment_review") && b.check_out >= todayIso)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))[0];

  return (
    <div className="space-y-10">
      {/* eyebrow */}
      <div
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] sm:text-[11px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        <span className="text-[color:var(--color-warm-clay)]">01</span>
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/35" />
        <span className="text-[color:var(--color-forest-deep)]/65">บัญชีและการจองของฉัน</span>
      </div>

      {/* ── profile header ── */}
      <section className="overflow-hidden rounded-[24px] border border-[color:var(--color-forest-deep)]/8 bg-white/70 shadow-[0_20px_45px_-22px_rgba(45,55,40,0.18)]">
        <div className="flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-9">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] sm:h-24 sm:w-24">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.fullName ?? "avatar"} className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold">{initials}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] leading-tight text-[color:var(--color-forest-deep)] sm:text-[36px]">
              {profile.fullName ?? "ผู้เยี่ยมชม"}
            </h1>
            {profile.email && <p className="mt-2 truncate text-sm text-[color:var(--color-ink)]/65">{profile.email}</p>}
            {profile.providerLabel && (
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-forest-deep)]/8 px-3 py-1 text-[11px] font-medium text-[color:var(--color-forest-deep)]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {profile.providerLabel}
              </span>
            )}
          </div>
          <div className="sm:ml-auto sm:text-right">
            <div className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55" style={{ fontFamily: "var(--font-ui)" }}>
              การจองทั้งหมด
            </div>
            <div className="mt-1 font-display text-4xl text-[color:var(--color-forest-deep)] sm:text-5xl">{bookings.length}</div>
          </div>
        </div>

        {/* upcoming-stay strip */}
        {upcoming && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-sage-mid)]/8 px-7 py-4 text-sm sm:px-9">
            <span className="inline-flex items-center gap-1.5 font-medium text-[color:var(--color-sage-mid)]">
              <Icon name="check" className="h-4 w-4" /> เข้าพักครั้งถัดไป
            </span>
            <span className="text-[color:var(--color-forest-deep)]">{upcoming.room_name}</span>
            <span className="text-[color:var(--color-ink)]/45">·</span>
            <span className="text-[color:var(--color-ink)]/70">
              {formatThaiDate(upcoming.check_in)} – {formatThaiDate(upcoming.check_out)}
            </span>
          </div>
        )}
      </section>

      {/* ── bookings ── */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] sm:text-[11px]" style={{ fontFamily: "var(--font-ui)" }}>
        <span className="text-[color:var(--color-warm-clay)]">02</span>
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/35" />
        <span className="text-[color:var(--color-forest-deep)]/65">การจองของฉัน</span>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[color:var(--color-forest-deep)]/20 bg-white/60 p-10 text-center">
          <p className="text-base text-[color:var(--color-ink)]/65">ยังไม่มีการจอง</p>
          <Link href="/#rooms" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-warm-clay)] hover:text-[color:var(--color-forest-deep)]">
            เลือกห้องพัก <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {bookings.map((b) => (
            <li key={b.id}>
              <BookingItem booking={b} onViewSlip={setSlip} />
            </li>
          ))}
        </ul>
      )}

      {/* slip lightbox */}
      {slip && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 motion-safe:animate-[fadeIn_.15s_ease-out]"
          onClick={() => setSlip(null)}
        >
          <div className="relative max-h-[90vh] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSlip(null)}
              aria-label="ปิด"
              className="absolute -top-11 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[color:var(--color-ink)] hover:bg-white"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slip} alt="หลักฐานสลิปการโอนเงิน" className="max-h-[90vh] w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function BookingItem({ booking: b, onViewSlip }: { booking: BookingCard; onViewSlip: (src: string) => void }) {
  const [open, setOpen] = useState(false);
  const st = BOOKING_STATUS_CUSTOMER[b.status];
  const paid = b.status === "payment_review" || b.status === "confirmed" || b.status === "completed";

  return (
    <div className="overflow-hidden rounded-[22px] border border-[color:var(--color-forest-deep)]/10 bg-white/75 shadow-[0_14px_36px_-26px_rgba(45,55,40,0.3)] transition-colors hover:border-[color:var(--color-warm-clay)]/30">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-[color:var(--color-forest-deep)]">{b.room_name}</h3>
          <p className="mt-1 font-mono text-[12px] text-[color:var(--color-ink)]/50">{b.booking_code}</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_TONE_BADGE[st.tone]}`}>
            {st.tone === "success" && <Icon name="check" className="h-3.5 w-3.5" />}
            {st.label}
          </span>
          <p className="mt-1 text-[11px] text-[color:var(--color-ink)]/45">{st.sub}</p>
        </div>
      </div>

      {/* facts */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 py-5 sm:grid-cols-4">
        <Fact icon="calendar" label="เช็คอิน" value={formatThaiDate(b.check_in)} />
        <Fact icon="calendar" label="เช็คเอาท์" value={formatThaiDate(b.check_out)} />
        <Fact icon="moon" label="ระยะเวลา" value={`${b.nights} คืน`} />
        <Fact icon="users" label="ผู้เข้าพัก" value={`${b.adults} ผู้ใหญ่${b.children > 0 ? ` · ${b.children} เด็ก` : ""}`} />
      </div>

      {/* amount + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/30 px-6 py-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-ink)]/45" style={{ fontFamily: "var(--font-ui)" }}>
            ยอดรวม
          </span>
          <div className="font-display text-2xl text-[color:var(--color-forest-deep)]">{formatTHB(b.total_amount)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-forest-deep)]/15 px-3.5 py-2 text-sm text-[color:var(--color-forest-deep)] transition-colors hover:bg-white"
          >
            ดูรายละเอียด
            <Icon name="chevron" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <Link
            href={`/booking/${b.booking_code}?doc=booking`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-forest-deep)]/15 px-3.5 py-2 text-sm text-[color:var(--color-forest-deep)] transition-colors hover:bg-white"
          >
            <Icon name="doc" className="h-4 w-4" /> ใบการจอง
          </Link>
          {paid && (
            <Link
              href={`/booking/${b.booking_code}?doc=receipt`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-warm-clay)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--color-forest-deep)]"
            >
              <Icon name="download" className="h-4 w-4" /> ใบเสร็จ
            </Link>
          )}
        </div>
      </div>

      {/* expandable detail */}
      {open && (
        <div className="border-t border-[color:var(--color-forest-deep)]/8 px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-ink)]/45" style={{ fontFamily: "var(--font-ui)" }}>
            สรุปค่าใช้จ่าย
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <Line label={`ค่าห้องพัก · ${b.nights} คืน`} value={formatTHB(b.base_amount)} />
            {b.extra_bed_amount > 0 && <Line label="เตียงเสริม" value={formatTHB(b.extra_bed_amount)} />}
            <div className="flex items-center justify-between border-t border-[color:var(--color-forest-deep)]/8 pt-2 font-medium text-[color:var(--color-forest-deep)]">
              <span>ยอดรวมทั้งหมด</span>
              <span>{formatTHB(b.total_amount)}</span>
            </div>
          </dl>

          {b.notes && (
            <p className="mt-4 rounded-xl bg-[color:var(--color-bone-soft)]/50 px-4 py-3 text-sm text-[color:var(--color-ink)]/70">
              <span className="font-medium text-[color:var(--color-forest-deep)]">หมายเหตุ: </span>
              {b.notes}
            </p>
          )}

          {/* slip evidence */}
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-ink)]/45" style={{ fontFamily: "var(--font-ui)" }}>
              หลักฐานการชำระเงิน
            </p>
            {b.slip_image ? (
              <button
                type="button"
                onClick={() => onViewSlip(b.slip_image as string)}
                className="mt-3 inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-white p-2 pr-4 text-left transition-colors hover:border-[color:var(--color-warm-clay)]/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.slip_image} alt="สลิป" className="h-14 w-14 rounded-lg object-cover" />
                <span className="text-sm">
                  <span className="block font-medium text-[color:var(--color-forest-deep)]">ดูสลิปการโอนเงิน</span>
                  {b.trans_ref && <span className="block text-[12px] text-[color:var(--color-ink)]/50">อ้างอิง: {b.trans_ref}</span>}
                </span>
                <Icon name="image" className="ml-1 h-4 w-4 text-[color:var(--color-ink)]/40" />
              </button>
            ) : (
              <p className="mt-2 text-sm text-[color:var(--color-ink)]/45">ยังไม่มีหลักฐานการชำระเงิน</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-[color:var(--color-warm-clay)]">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/40" style={{ fontFamily: "var(--font-ui)" }}>
          {label}
        </span>
        <span className="block truncate text-sm text-[color:var(--color-forest-deep)]">{value}</span>
      </span>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[color:var(--color-ink)]/70">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
