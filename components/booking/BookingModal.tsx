"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { useT } from "@/app/providers";
import { calculateBookingTotal } from "@/lib/booking/pricing";
import {
  clearBookingIntent,
  saveBookingIntent,
  type BookingIntent,
} from "@/lib/booking/intent";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAvailability } from "@/hooks/useAvailability";
import type { Room } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = "form" | "payment" | "confirmed";
type SubmitState = "idle" | "submitting" | "error";
type SlipState = "idle" | "verifying" | "error";

type BookingCreated = {
  id: string;
  bookingCode: string;
  nights: number;
  totalAmount: number;
  expiresAt: string;
};

type PaymentInfo = {
  qrDataUrl: string;
  payload: string;
  amount: number;
  kind: string;
  depositPercent: number | null;
  account: { name: string; type: string; bank: string | null; number: string };
};

function todayISO(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

function thb(n: number): string {
  return n.toLocaleString("en-US");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function BookingModal({
  room,
  initialIntent,
  onClose,
}: {
  room: Room;
  initialIntent?: BookingIntent | null;
  onClose: () => void;
}) {
  const t = useT();

  const prefill = initialIntent?.slug === room.id ? initialIntent : null;

  const [checkIn, setCheckIn] = useState(prefill?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(prefill?.checkOut ?? "");
  const [adults, setAdults] = useState(prefill?.adults ?? 1);
  const [children, setChildren] = useState(prefill?.children ?? 0);
  const [extraBed, setExtraBed] = useState(prefill?.extraBed ?? false);
  const [notes, setNotes] = useState(prefill?.notes ?? "");

  const [roomId, setRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [phase, setPhase] = useState<Phase>("form");
  const [submit, setSubmit] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [booking, setBooking] = useState<BookingCreated | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [slip, setSlip] = useState<SlipState>("idle");
  const [slipError, setSlipError] = useState("");

  // Lock background scroll + Escape to close.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Resolve the static slug to the DB room UUID the booking APIs require.
  useEffect(() => {
    let active = true;
    fetch(`/api/rooms?slug=${encodeURIComponent(room.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.room?.id) setRoomId(data.room.id as string);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [room.id]);

  // Detect auth state.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);
  const availability = useAvailability(roomId, checkIn, checkOut);

  const pricing = useMemo(() => {
    if (!datesValid) return null;
    return calculateBookingTotal({
      priceWeekday: room.priceWeekday,
      priceWeekend: room.priceWeekend,
      checkIn,
      checkOut,
      extraBed,
    });
  }, [datesValid, room.priceWeekday, room.priceWeekend, checkIn, checkOut, extraBed]);

  const guests = adults + children;
  const overCapacity = guests > room.maxGuests;
  const canSubmit =
    datesValid &&
    !overCapacity &&
    availability.status === "available" &&
    roomId !== null &&
    submit !== "submitting";

  function currentIntent(): BookingIntent {
    return { slug: room.id, checkIn, checkOut, adults, children, extraBed, notes: notes || undefined };
  }

  // Fetch the PromptPay QR for the freshly-created booking.
  async function loadQr(bookingId: string) {
    setPaymentError("");
    try {
      const res = await fetch("/api/payments/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = (await res.json()) as Partial<PaymentInfo> & {
        qr?: { image: string; mime: string; payload: string };
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.qr) {
        setPaymentError(
          data.code === "no_promptpay_account"
            ? t({
                th: "ระบบชำระเงินยังไม่พร้อม — ทีมงานจะติดต่อกลับเพื่อรับชำระ",
                en: "Payment isn't set up yet — our team will contact you to collect payment.",
              })
            : data.error ?? t({ th: "สร้าง QR ไม่สำเร็จ", en: "Couldn't generate the QR." }),
        );
        return;
      }
      setPayment({
        qrDataUrl: `data:${data.qr.mime};base64,${data.qr.image}`,
        payload: data.qr.payload,
        amount: data.amount ?? 0,
        kind: data.kind ?? "full",
        depositPercent: data.depositPercent ?? null,
        account: data.account ?? { name: "", type: "", bank: null, number: "" },
      });
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "network error");
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    // Not signed in → stash intent and bounce through Google OAuth.
    if (!user) {
      saveBookingIntent(currentIntent());
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return;
    }

    setSubmit("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          adults,
          children,
          extraBed,
          notes: notes || undefined,
        }),
      });
      const data = (await res.json()) as Partial<BookingCreated> & { error?: string };
      if (!res.ok) {
        setSubmit("error");
        setErrorMsg(
          res.status === 409
            ? t({ th: "ช่วงวันที่นี้เพิ่งถูกจองไป กรุณาเลือกวันใหม่", en: "These dates were just taken — please pick others." })
            : data.error ?? t({ th: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", en: "Something went wrong. Please try again." }),
        );
        return;
      }
      clearBookingIntent();
      const created: BookingCreated = {
        id: data.id!,
        bookingCode: data.bookingCode!,
        nights: data.nights ?? 0,
        totalAmount: data.totalAmount ?? pricing?.totalAmount ?? 0,
        expiresAt: data.expiresAt ?? "",
      };
      setBooking(created);
      setSubmit("idle");
      setPhase("payment");
      await loadQr(created.id);
    } catch (err) {
      setSubmit("error");
      setErrorMsg(err instanceof Error ? err.message : "network error");
    }
  }

  async function handleSlipFile(file: File) {
    if (!booking) return;
    setSlip("verifying");
    setSlipError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/payments/slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, base64: dataUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; code?: string; expected?: number; got?: number };
      if (res.ok && data.ok) {
        setPhase("confirmed");
        return;
      }
      setSlip("error");
      const map: Record<string, string> = {
        duplicate: t({ th: "สลิปนี้ถูกใช้ไปแล้ว", en: "This slip has already been used." }),
        amount_mismatch: t({
          th: `ยอดในสลิปไม่ตรง (ต้องโอน ${thb(data.expected ?? payment?.amount ?? 0)} บาท)`,
          en: `Slip amount doesn't match (expected ${thb(data.expected ?? payment?.amount ?? 0)} THB).`,
        }),
        verify_failed: t({ th: "อ่านสลิปไม่สำเร็จ ลองถ่ายใหม่ให้ชัด", en: "Couldn't read the slip — try a clearer image." }),
      };
      setSlipError(map[data.code ?? ""] ?? data.error ?? t({ th: "ตรวจสลิปไม่สำเร็จ", en: "Slip verification failed." }));
    } catch (err) {
      setSlip("error");
      setSlipError(err instanceof Error ? err.message : "network error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.button
        type="button"
        aria-label="Close booking"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[color:var(--color-forest-night)]/80 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative w-full sm:max-w-lg max-h-[94vh] bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-t-[20px] sm:rounded-[20px] overflow-hidden flex flex-col"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-[color:var(--color-bone)]/95 backdrop-blur-md flex items-center justify-center hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]"
        >
          <span aria-hidden className="relative block h-5 w-5">
            <span className="absolute inset-0 m-auto h-px w-4 bg-current rotate-45" />
            <span className="absolute inset-0 m-auto h-px w-4 bg-current -rotate-45" />
          </span>
        </button>

        <div className="overflow-y-auto">
          <header className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-[color:var(--color-ink)]/10">
            <span
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              LandCamp · {t({ th: "จองออนไลน์", en: "Book online" })}
            </span>
            <h3
              id="booking-modal-title"
              className="mt-2 font-display text-3xl text-[color:var(--color-forest-deep)] leading-tight"
            >
              {t(room.name)}
            </h3>
            <p
              className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/55"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {thb(room.priceWeekday)}–{thb(room.priceWeekend)} {t({ th: "บาท / คืน", en: "THB / night" })}
            </p>
          </header>

          {phase === "confirmed" && booking ? (
            <Confirmation booking={booking} room={room} onClose={onClose} />
          ) : phase === "payment" && booking ? (
            <PaymentStep
              booking={booking}
              payment={payment}
              paymentError={paymentError}
              slip={slip}
              slipError={slipError}
              onUpload={handleSlipFile}
              onClose={onClose}
            />
          ) : (
            <div className="px-6 sm:px-8 py-6 flex flex-col gap-6">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t({ th: "เช็คอิน", en: "Check-in" })}>
                  <input
                    type="date"
                    value={checkIn}
                    min={todayISO()}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && checkOut <= e.target.value) setCheckOut("");
                    }}
                    className={inputClass}
                  />
                </Field>
                <Field label={t({ th: "เช็คเอาท์", en: "Check-out" })}>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || todayISO()}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Guests */}
              <div className="grid grid-cols-2 gap-4">
                <Stepper
                  label={t({ th: "ผู้ใหญ่", en: "Adults" })}
                  value={adults}
                  min={1}
                  max={room.maxGuests}
                  onChange={setAdults}
                />
                <Stepper
                  label={t({ th: "เด็ก", en: "Children" })}
                  value={children}
                  min={0}
                  max={Math.max(0, room.maxGuests - 1)}
                  onChange={setChildren}
                />
              </div>

              {overCapacity && (
                <p className="text-[13px] text-[color:var(--color-warm-clay)]">
                  {t({
                    th: `ห้องนี้พักได้สูงสุด ${room.maxGuests} ท่าน`,
                    en: `This room sleeps up to ${room.maxGuests} guests.`,
                  })}
                </p>
              )}

              {/* Extra bed */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="flex flex-col">
                  <span className="text-[color:var(--color-forest-deep)] font-medium text-sm">
                    {t({ th: "เตียงเสริม", en: "Extra bed" })}
                  </span>
                  <span className="text-[12px] text-[color:var(--color-ink)]/55">
                    {t({ th: "750 บาท / คืน", en: "THB 750 / night" })}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={extraBed}
                  onClick={() => setExtraBed((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    extraBed
                      ? "bg-[color:var(--color-forest-deep)]"
                      : "bg-[color:var(--color-ink)]/20"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-[color:var(--color-bone)] transition-all ${
                      extraBed ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </label>

              {/* Notes */}
              <Field label={t({ th: "หมายเหตุ (ถ้ามี)", en: "Notes (optional)" })}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder={t({ th: "เช่น มาถึงดึก, ต้องการห้องชั้นล่าง", en: "e.g. late arrival, ground floor" })}
                />
              </Field>

              {/* Price + availability */}
              <PriceSummary pricing={pricing} availability={availability} datesValid={datesValid} />

              {errorMsg && (
                <p className="text-[13px] text-red-700 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={authReady && !!user && !canSubmit}
                className="w-full inline-flex items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-6 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-forest-deep)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {submit === "submitting"
                  ? t({ th: "กำลังจอง…", en: "Booking…" })
                  : !user && authReady
                    ? t({ th: "เข้าสู่ระบบเพื่อจอง", en: "Sign in to book" })
                    : t({ th: "ยืนยันการจอง", en: "Confirm booking" })}
              </button>

              <p className="text-[11px] leading-relaxed text-[color:var(--color-ink)]/45 text-center">
                {t({
                  th: "ระบบจะล็อกห้องไว้ 15 นาทีเพื่อชำระเงิน",
                  en: "Your room is held for 15 minutes to complete payment.",
                })}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── payment step: QR + slip upload ────────── */
function PaymentStep({
  booking,
  payment,
  paymentError,
  slip,
  slipError,
  onUpload,
  onClose,
}: {
  booking: BookingCreated;
  payment: PaymentInfo | null;
  paymentError: string;
  slip: SlipState;
  slipError: string;
  onUpload: (file: File) => void;
  onClose: () => void;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-6 sm:px-8 py-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/55" style={{ fontFamily: "var(--font-ui)" }}>
          {t({ th: "รหัสการจอง", en: "Booking code" })} · {booking.bookingCode}
        </span>
        <h4 className="font-display text-2xl text-[color:var(--color-forest-deep)]">
          {t({ th: "สแกนเพื่อชำระเงิน", en: "Scan to pay" })}
        </h4>
      </div>

      {paymentError ? (
        <div className="rounded-[14px] bg-[color:var(--color-bone-soft)] px-5 py-6 text-center text-sm text-[color:var(--color-ink)]/75 leading-relaxed">
          {paymentError}
        </div>
      ) : !payment ? (
        <div className="rounded-[14px] bg-[color:var(--color-bone-soft)] px-5 py-10 text-center text-sm text-[color:var(--color-ink)]/55">
          {t({ th: "กำลังสร้าง QR…", en: "Generating QR…" })}
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR from EasySlip */}
            <img
              src={payment.qrDataUrl}
              alt={t({ th: "QR พร้อมเพย์", en: "PromptPay QR" })}
              className="h-56 w-56 rounded-[14px] bg-white p-3 shadow-[0_8px_24px_-12px_rgba(45,55,40,0.4)]"
            />
            <div className="text-center">
              <p className="font-display text-3xl text-[color:var(--color-forest-deep)]">
                {thb(payment.amount)} {t({ th: "บาท", en: "THB" })}
              </p>
              <p className="text-[12px] text-[color:var(--color-ink)]/55">
                {payment.kind === "deposit"
                  ? t({ th: `มัดจำ ${payment.depositPercent ?? ""}%`, en: `Deposit ${payment.depositPercent ?? ""}%` })
                  : t({ th: "ชำระเต็มจำนวน", en: "Full payment" })}
                {" · "}
                {payment.account.name} {payment.account.number}
              </p>
            </div>
          </div>

          <div className="h-px bg-[color:var(--color-ink)]/10" />

          <div className="flex flex-col gap-2">
            <p className="text-sm text-[color:var(--color-ink)]/70 text-center leading-relaxed">
              {t({
                th: "โอนแล้วอัปโหลดสลิปเพื่อยืนยันอัตโนมัติ",
                en: "After paying, upload your slip for instant verification.",
              })}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={slip === "verifying"}
              className="w-full inline-flex items-center justify-center rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] px-6 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-warm-clay)] transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {slip === "verifying"
                ? t({ th: "กำลังตรวจสลิป…", en: "Verifying slip…" })
                : t({ th: "อัปโหลดสลิป", en: "Upload slip" })}
            </button>
            {slipError && (
              <p className="text-[13px] text-red-700 bg-red-50 rounded-lg px-3 py-2">{slipError}</p>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="self-center text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/70 transition-colors"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {t({ th: "ชำระภายหลัง", en: "Pay later" })}
      </button>
    </div>
  );
}

/* ── confirmation screen ───────────────────── */
function Confirmation({
  booking,
  room,
  onClose,
}: {
  booking: BookingCreated;
  room: Room;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="px-6 sm:px-8 py-8 flex flex-col items-center text-center gap-4">
      <div className="h-14 w-14 rounded-full bg-[color:var(--color-forest-deep)]/10 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-[color:var(--color-forest-deep)]" aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h4 className="font-display text-2xl text-[color:var(--color-forest-deep)]">
        {t({ th: "ชำระเงินสำเร็จ!", en: "Payment confirmed!" })}
      </h4>
      <p className="text-sm text-[color:var(--color-ink)]/70 leading-relaxed">
        {t({
          th: `การจอง ${room.name.th} ของคุณได้รับการยืนยันแล้ว`,
          en: `Your booking for ${room.name.en} is confirmed.`,
        })}
      </p>
      <div className="w-full rounded-[14px] bg-[color:var(--color-bone-soft)] px-5 py-4 flex flex-col gap-2 text-sm">
        <Row label={t({ th: "รหัสการจอง", en: "Booking code" })} value={booking.bookingCode} mono />
        <Row label={t({ th: "จำนวนคืน", en: "Nights" })} value={String(booking.nights)} />
        <Row
          label={t({ th: "ยอดรวม", en: "Total" })}
          value={`${thb(booking.totalAmount)} ${t({ th: "บาท", en: "THB" })}`}
        />
      </div>
      <p className="text-[12px] text-[color:var(--color-ink)]/50 leading-relaxed">
        {t({
          th: "ดูรายละเอียดการจองได้ที่หน้าบัญชีของคุณ",
          en: "You can view this booking in your account.",
        })}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-1 inline-flex items-center justify-center rounded-full border border-[color:var(--color-ink)]/20 px-6 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-ink)]/5 transition-colors"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {t({ th: "เสร็จสิ้น", en: "Done" })}
      </button>
    </div>
  );
}

/* ── price + availability summary ──────────── */
function PriceSummary({
  pricing,
  availability,
  datesValid,
}: {
  pricing: ReturnType<typeof calculateBookingTotal> | null;
  availability: ReturnType<typeof useAvailability>;
  datesValid: boolean;
}) {
  const t = useT();
  if (!datesValid) {
    return (
      <p className="text-[13px] text-[color:var(--color-ink)]/45">
        {t({ th: "เลือกวันเข้าพักเพื่อดูราคา", en: "Pick your dates to see the price." })}
      </p>
    );
  }

  const unavailable = availability.status === "unavailable";

  return (
    <div className="rounded-[14px] bg-[color:var(--color-bone-soft)] px-5 py-4 flex flex-col gap-2 text-sm">
      {pricing && (
        <>
          <Row
            label={t({ th: `ค่าห้อง · ${pricing.nights} คืน`, en: `Room · ${pricing.nights} night(s)` })}
            value={`${thb(pricing.baseAmount)} ${t({ th: "บาท", en: "THB" })}`}
          />
          {pricing.extraBedAmount > 0 && (
            <Row
              label={t({ th: "เตียงเสริม", en: "Extra bed" })}
              value={`${thb(pricing.extraBedAmount)} ${t({ th: "บาท", en: "THB" })}`}
            />
          )}
          <div className="h-px bg-[color:var(--color-ink)]/10 my-1" />
          <Row
            label={t({ th: "ยอดรวม", en: "Total" })}
            value={`${thb(pricing.totalAmount)} ${t({ th: "บาท", en: "THB" })}`}
            strong
          />
        </>
      )}
      <p
        className={`text-[12px] ${
          unavailable ? "text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-ink)]/55"
        }`}
      >
        {availability.status === "loading" && t({ th: "กำลังตรวจสอบห้องว่าง…", en: "Checking availability…" })}
        {availability.status === "available" && t({ th: "✓ ห้องว่าง จองได้", en: "✓ Available" })}
        {unavailable && t({ th: "ช่วงวันที่นี้ไม่ว่าง กรุณาเลือกวันอื่น", en: "Not available for these dates." })}
        {availability.status === "error" && t({ th: "ตรวจสอบห้องว่างไม่สำเร็จ", en: "Couldn't check availability." })}
      </p>
    </div>
  );
}

/* ── small UI helpers ──────────────────────── */
const inputClass =
  "w-full rounded-xl border border-[color:var(--color-ink)]/15 bg-[color:var(--color-bone)] px-3.5 py-3 text-sm text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center justify-between rounded-xl border border-[color:var(--color-ink)]/15 bg-[color:var(--color-bone)] px-2 py-1.5">
        <StepBtn aria-label="decrease" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          −
        </StepBtn>
        <span className="text-sm font-medium text-[color:var(--color-forest-deep)] tabular-nums">{value}</span>
        <StepBtn aria-label="increase" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </StepBtn>
      </div>
    </Field>
  );
}

function StepBtn({
  children,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 rounded-lg flex items-center justify-center text-lg text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-forest-deep)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      {...rest}
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[color:var(--color-ink)]/60">{label}</span>
      <span
        className={`${strong ? "text-[color:var(--color-forest-deep)] font-semibold text-base" : "text-[color:var(--color-forest-deep)] font-medium"} ${
          mono ? "tracking-wider" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
