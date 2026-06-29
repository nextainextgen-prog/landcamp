"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/admin/ui";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { calculateBookingTotal } from "@/lib/booking/pricing";

export type WalkInRoom = {
  id: string;
  name: string;
  slug: string;
  priceWeekday: number;
  priceWeekend: number;
  maxGuests: number;
};
export type BookedRange = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  bookingCode: string;
  guestName: string;
};

const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;
const inputClass =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--color-warm-clay)] focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15";

/* ── date helpers (UTC-safe, ISO YYYY-MM-DD; string compare is chronological) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;
const utc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
function addDays(s: string, n: number): string {
  const dt = new Date(utc(s) + n * 86_400_000);
  return iso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}
/** ISO "YYYY-MM-DD" <-> local Date, for the shared CalendarPicker. */
const isoToDate = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const dateToISO = (d: Date) => iso(d.getFullYear(), d.getMonth(), d.getDate());

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-[color:var(--color-ink)]/60">{label}</span>
        {hint && <span className="text-[11px] text-[color:var(--color-ink)]/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

type Result =
  | { kind: "ok"; bookingCode: string; total: number; paid: boolean; slipStatus?: string | null }
  | { kind: "error"; message: string };

/** EasySlip verdict → Thai label + pill colour (mirrors /admin/bookings). */
const SLIP_VERDICT: Record<string, { label: string; cls: string }> = {
  matched: { label: "สลิปตรง (ยอด+บัญชีถูกต้อง)", cls: "bg-emerald-100 text-emerald-800" },
  amount_mismatch: { label: "ยอดไม่ตรง", cls: "bg-amber-100 text-amber-800" },
  account_mismatch: { label: "บัญชีปลายทางไม่ตรง", cls: "bg-amber-100 text-amber-800" },
  duplicate: { label: "สลิปซ้ำ (เคยใช้แล้ว)", cls: "bg-red-100 text-red-700" },
  unreadable: { label: "อ่านสลิปไม่ออก", cls: "bg-red-100 text-red-700" },
  error: { label: "ระบบตรวจไม่สำเร็จ", cls: "bg-neutral-200 text-neutral-600" },
  pending: { label: "ยังไม่ได้ตรวจ", cls: "bg-neutral-200 text-neutral-600" },
};

/** Read a picked image file into a base64 data URL (what the slip API expects). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Front-desk booking form. Submits to POST /api/admin/walk-in which finds/creates
 * the customer, runs the same availability + pricing as online booking, and
 * records the reservation as `confirmed` (source = walk_in) plus a payment row.
 * Dates are picked on a month calendar that greys out nights already taken for
 * the selected room (loaded server-side, refreshed after each save).
 */
export function WalkInForm({ rooms, booked, today }: { rooms: WalkInRoom[]; booked: BookedRange[]; today: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [extraBed, setExtraBed] = useState(false);
  const [method, setMethod] = useState("cash");
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [slip, setSlip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const room = rooms.find((r) => r.id === roomId) ?? null;

  const occupied = useMemo(() => {
    const set = new Set<string>();
    for (const b of booked) {
      if (b.roomId !== roomId) continue;
      for (let cur = b.checkIn; cur < b.checkOut; cur = addDays(cur, 1)) set.add(cur);
    }
    return set;
  }, [booked, roomId]);

  const rangeBlocked = (from: string, to: string) => {
    for (let cur = from; cur < to; cur = addDays(cur, 1)) if (occupied.has(cur)) return true;
    return false;
  };

  // Occupied nights as Date objects for the shared CalendarPicker (dots + blocked).
  const occupiedDates = useMemo(
    () => Array.from(occupied).map(isoToDate).filter((d): d is Date => Boolean(d)),
    [occupied],
  );

  // Existing bookings for the selected room — reference list beside the calendar.
  const roomBookings = useMemo(() => {
    return booked
      .filter((b) => b.roomId === roomId)
      .map((b) => {
        const ms = new Date(`${b.checkOut}T00:00:00`).getTime() - new Date(`${b.checkIn}T00:00:00`).getTime();
        const nights = Math.max(1, Math.round(ms / 86_400_000));
        return { ...b, nights };
      })
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [booked, roomId]);

  const validRange = Boolean(checkIn && checkOut && checkOut > checkIn && !rangeBlocked(checkIn, checkOut));
  const pricing = room && validRange
    ? calculateBookingTotal({ priceWeekday: room.priceWeekday, priceWeekend: room.priceWeekend, checkIn, checkOut, extraBed })
    : null;
  const guests = Number(adults || 0) + Number(children || 0);
  const overCapacity = room ? guests > room.maxGuests : false;
  const canSubmit = Boolean(name.trim() && phone.trim() && roomId && validRange && !overCapacity && !submitting);

  function resetForm() {
    setName(""); setPhone(""); setEmail("");
    setRoomId(rooms[0]?.id ?? "");
    setCheckIn(""); setCheckOut("");
    setAdults("2"); setChildren("0");
    setExtraBed(false); setMethod("cash"); setPaid(true); setNotes(""); setSlip(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !canSubmit) return;
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          phone,
          email: email || undefined,
          roomId,
          checkIn,
          checkOut,
          adults: Number(adults),
          children: Number(children),
          extraBed,
          method,
          paid,
          notes,
        }),
      });
      const data = (await res.json()) as { id?: string; bookingCode?: string; totalAmount?: number; error?: string };
      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "บันทึกไม่สำเร็จ" });
        return;
      }

      // ── If a transfer slip was attached, run the same EasySlip check used on
      //    /admin/bookings (records in slip history; never blocks the booking). ──
      let slipStatus: string | null | undefined;
      if (method === "transfer" && slip && data.id) {
        try {
          const slipRes = await fetch(`/api/admin/bookings/${data.id}/slip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: slip }),
          });
          const slipData = (await slipRes.json()) as { verify_status?: string | null };
          slipStatus = slipRes.ok ? slipData.verify_status ?? "pending" : "error";
        } catch {
          slipStatus = "error";
        }
      }

      setResult({ kind: "ok", bookingCode: data.bookingCode ?? "—", total: data.totalAmount ?? 0, paid, slipStatus });
      resetForm();
      router.refresh();
    } catch {
      setResult({ kind: "error", message: "เครือข่ายขัดข้อง ลองอีกครั้ง" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex flex-col gap-6">
        {result?.kind === "error" && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            {result.message}
          </div>
        )}

        <Panel title="ข้อมูลผู้เข้าพัก">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="ชื่อ-นามสกุล">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" />
            </Field>
            <Field label="เบอร์โทร">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
            </Field>
            <Field label="อีเมล" hint="ถ้ามี">
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </Field>
          </div>
        </Panel>

        <Panel title="ห้องพักและผู้เข้าพัก">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ห้องพัก">
              <select className={inputClass} value={roomId} onChange={(e) => { setRoomId(e.target.value); setCheckOut(""); }}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {baht(r.priceWeekday)}/คืน</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2 text-[11px] text-[color:var(--color-ink)]/55">
              {room && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <span className="rounded-full bg-[color:var(--color-bone-soft)] px-2.5 py-1">ธรรมดา {baht(room.priceWeekday)}</span>
                  <span className="rounded-full bg-[color:var(--color-bone-soft)] px-2.5 py-1">วันหยุด {baht(room.priceWeekend)}</span>
                  <span className="rounded-full bg-[color:var(--color-bone-soft)] px-2.5 py-1">พักได้ {room.maxGuests} คน</span>
                </div>
              )}
            </div>
            <Field label="ผู้ใหญ่">
              <input type="number" min={1} className={inputClass} value={adults} onChange={(e) => setAdults(e.target.value)} />
            </Field>
            <Field label="เด็ก">
              <input type="number" min={0} className={inputClass} value={children} onChange={(e) => setChildren(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={extraBed}
              onClick={() => setExtraBed((v) => !v)}
              className="inline-flex items-center gap-2.5"
            >
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${extraBed ? "bg-[color:var(--color-warm-clay)]" : "bg-neutral-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${extraBed ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
              <span className="text-sm text-[color:var(--color-ink)]/75">เตียงเสริม <span className="text-[color:var(--color-ink)]/45">(+฿750/คืน)</span></span>
            </button>
            {overCapacity && (
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                เกินจำนวนที่พักได้ ({guests}/{room?.maxGuests} คน)
              </span>
            )}
          </div>
        </Panel>

        <Panel title="เลือกวันเข้าพัก">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
            <CalendarPicker
              mode="range"
              locale="th"
              minDate={isoToDate(today) ?? undefined}
              markedDates={occupiedDates}
              disabledDates={occupiedDates}
              rangeValue={{ start: isoToDate(checkIn), end: isoToDate(checkOut) }}
              onRangeChange={(r) => {
                setResult(null);
                setCheckIn(r.start ? dateToISO(r.start) : "");
                setCheckOut(r.end ? dateToISO(r.end) : "");
              }}
            />

            {/* Existing bookings for the selected room — so staff see what's taken. */}
            <div className="flex min-w-0 flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/60">
                การจองที่มีอยู่{room ? ` · ${room.name}` : ""}
              </div>
              {roomBookings.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)]/30 px-3 py-6 text-center text-xs text-[color:var(--color-ink)]/45">
                  ยังไม่มีการจองสำหรับห้องนี้
                </p>
              ) : (
                <ul className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto pr-1">
                  {roomBookings.map((b) => {
                    const fmt = (iso: string) =>
                      isoToDate(iso)?.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) ?? iso;
                    return (
                      <li
                        key={b.bookingCode || `${b.checkIn}-${b.checkOut}`}
                        className="rounded-lg border border-[color:var(--color-forest-deep)]/10 bg-white px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[color:var(--color-forest-deep)]">
                            {fmt(b.checkIn)} – {fmt(b.checkOut)}
                          </span>
                          <span className="flex-shrink-0 rounded-full bg-[color:var(--color-bone-soft)] px-2 py-0.5 text-[11px] text-[color:var(--color-ink)]/60">
                            {b.nights} คืน
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[color:var(--color-ink)]/55">
                          <span className="font-mono text-[11px]">{b.bookingCode}</span>
                          {b.guestName ? <span className="truncate">· {b.guestName}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="การชำระเงิน">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="วิธีชำระ">
              <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">เงินสด</option>
                <option value="transfer">โอนเงิน</option>
                <option value="card">บัตรเครดิต</option>
              </select>
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2.5">
                <input type="checkbox" className="h-4 w-4 accent-[color:var(--color-warm-clay)]" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                <span className="text-sm text-[color:var(--color-ink)]/70">ชำระเงินแล้ว</span>
              </label>
            </div>
            <Field label="หมายเหตุ">
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เช่น มาถึงดึก" />
            </Field>
          </div>

          {/* Transfer slip — optional. Attach here (e.g. a guest who messaged to
              book) or later on /admin/bookings; both run the same EasySlip check. */}
          {method === "transfer" && (
            <div className="mt-4 rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-[color:var(--color-bone-soft)]/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">แนบสลิปการโอน</span>
                <span className="text-[11px] text-[color:var(--color-ink)]/40">ไม่บังคับ · แนบที่หน้ารายการจองภายหลังได้</span>
              </div>
              <p className="mt-1 text-[11px] text-[color:var(--color-ink)]/45">
                เมื่อบันทึกการจอง ระบบจะตรวจสลิปด้วย EasySlip (ยอด · บัญชีปลายทาง · สลิปซ้ำ) และบันทึกลงประวัติสลิปให้อัตโนมัติ
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {slip ? (
                  <button type="button" onClick={() => setSlip(null)} className="group relative" title="ลบรูปสลิป">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slip} alt="สลิปการโอน" className="h-32 w-auto rounded-lg border border-[color:var(--color-forest-deep)]/10 object-contain" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow transition-transform group-hover:scale-110">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[color:var(--color-forest-deep)]/25 bg-white px-4 py-3 text-xs font-medium text-[color:var(--color-forest-deep)] transition-colors hover:border-[color:var(--color-warm-clay)] hover:bg-[color:var(--color-bone-soft)]/60">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) setSlip(await fileToDataUrl(file));
                      }}
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    เลือกรูปสลิป
                  </label>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ── sticky summary ── */}
      <aside className="lg:sticky lg:top-4">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
          <div className="border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">สรุปการจอง</h2>
          </div>
          <div className="flex flex-col gap-3 p-5 text-sm">
            {result?.kind === "ok" && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-800">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <div className="leading-relaxed">
                  <div className="font-semibold">บันทึกการจองแล้ว</div>
                  <div className="font-mono text-[13px]">{result.bookingCode}</div>
                  <div className="text-[13px] text-emerald-700">
                    ยอด {baht(result.total)} · {result.paid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                  </div>
                  {result.slipStatus && (
                    <div className="mt-1.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SLIP_VERDICT[result.slipStatus]?.cls ?? "bg-neutral-200 text-neutral-600"}`}>
                        สลิป · {SLIP_VERDICT[result.slipStatus]?.label ?? result.slipStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Row label="ห้องพัก" value={room?.name ?? "—"} />
            <Row label="เช็คอิน" value={checkIn ? new Date(utc(checkIn)).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }) : "เลือกวันบนปฏิทิน"} muted={!checkIn} />
            <Row label="เช็คเอาท์" value={checkOut ? new Date(utc(checkOut)).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }) : "—"} muted={!checkOut} />
            <Row label="ผู้เข้าพัก" value={`${adults} ผู้ใหญ่${Number(children) > 0 ? ` · ${children} เด็ก` : ""}`} />

            {checkIn && checkOut && checkOut > checkIn && !validRange && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
                ช่วงวันที่เลือกมีคืนที่ถูกจองแล้วสำหรับห้องนี้ — เลือกใหม่
              </div>
            )}

            {pricing && (
              <div className="mt-1 flex flex-col gap-2 border-t border-[color:var(--color-forest-deep)]/8 pt-3">
                <Row label={`ค่าห้อง · ${pricing.nights} คืน`} value={baht(pricing.baseAmount)} />
                {pricing.weekendNights > 0 && (
                  <Row label={`(รวมวันหยุด ${pricing.weekendNights} คืน)`} value="" sub />
                )}
                {pricing.extraBedAmount > 0 && <Row label="เตียงเสริม" value={baht(pricing.extraBedAmount)} />}
                <div className="mt-1 flex items-baseline justify-between border-t border-[color:var(--color-forest-deep)]/8 pt-3">
                  <span className="text-sm font-medium text-[color:var(--color-ink)]/70">ยอดรวม</span>
                  <span className="font-display text-2xl font-semibold text-[color:var(--color-forest-deep)]">{baht(pricing.totalAmount)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full rounded-xl bg-[color:var(--color-warm-clay)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "กำลังบันทึก…" : "บันทึกการจอง"}
            </button>
            {!canSubmit && !submitting && (
              <p className="text-center text-[11px] text-[color:var(--color-ink)]/40">
                กรอกชื่อ · เบอร์โทร และเลือกช่วงวันที่ว่างให้ครบ
              </p>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value, muted, sub }: { label: string; value: string; muted?: boolean; sub?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${sub ? "text-[11px] text-[color:var(--color-ink)]/40" : ""}`}>
      <span className={sub ? "" : "text-[color:var(--color-ink)]/55"}>{label}</span>
      <span className={`text-right ${muted ? "text-[color:var(--color-ink)]/35" : sub ? "" : "font-medium text-[color:var(--color-forest-deep)]"}`}>{value}</span>
    </div>
  );
}
