"use client";

import { useMemo, useState, type FormEvent } from "react";

/**
 * Collects real name + phone once after the first LINE sign-in. OAuth gives us
 * a LINE display name, but that is often a nickname — so we DO NOT prefill it.
 * The customer must type their real first name + surname (separate fields), and
 * a Thai 10-digit mobile.
 *
 * Phone entry is numeric-only with live auto-formatting (08x-xxx-xxxx), a digit
 * counter, and the submit button stays locked until every field is valid.
 *
 * Used inline inside the booking modal and on the standalone /profile/complete
 * page. On success it calls onDone() with the saved values.
 */

/** Pretty 3-3-4 grouping for display only — state always holds raw digits. */
function formatPhone(digits: string): string {
  const d = digits.slice(0, 10);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  return [a, b, c].filter(Boolean).join("-");
}

export function CompleteProfileForm({
  onDone,
  submitLabel = "บันทึกและไปต่อ",
}: {
  onDone?: (profile: { fullName: string; phone: string }) => void;
  submitLabel?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); // raw digits only
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstValid = firstName.trim().length >= 1;
  const lastValid = lastName.trim().length >= 1;
  const phoneValid = phone.length === 10 && phone.startsWith("0");
  // Email is optional: blank is fine, but a typed value must look like an email.
  const emailTrimmed = email.trim();
  const emailValid = emailTrimmed === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const canSubmit = firstValid && lastValid && phoneValid && emailValid && !busy;

  const phoneHint = useMemo(() => {
    if (phone.length === 0) return null;
    if (!phone.startsWith("0")) return "เบอร์ต้องขึ้นต้นด้วย 0";
    return null;
  }, [phone]);

  function onPhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (error) setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email: emailTrimmed || undefined }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        profile?: { fullName: string; phone: string };
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      }
      onDone?.({ fullName: data.profile?.fullName ?? fullName, phone: data.profile?.phone ?? phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {/* Real name — first + surname, never prefilled from LINE */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>ชื่อจริง</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
              <IconUser />
            </span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="เช่น สมชาย"
              autoComplete="given-name"
              className={inputClass}
            />
            {firstValid && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                <IconCheck />
              </span>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldLabel>นามสกุล</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
              <IconUser />
            </span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="เช่น ใจดี"
              autoComplete="family-name"
              className={inputClass}
            />
            {lastValid && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                <IconCheck />
              </span>
            )}
          </div>
        </label>
      </div>
      <p className="-mt-3 text-[11px] text-[color:var(--color-ink)]/45">
        กรุณากรอกชื่อ–นามสกุลจริง เพื่อใช้ออกใบยืนยันการจอง
      </p>

      {/* Phone */}
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
          <span
            className={
              "text-[11px] tabular-nums " +
              (phoneValid ? "text-emerald-600" : "text-[color:var(--color-ink)]/40")
            }
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {phone.length}/10
          </span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
            <IconPhone />
          </span>
          <input
            value={formatPhone(phone)}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="08x-xxx-xxxx"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={12}
            className={inputClass}
            aria-invalid={phone.length > 0 && !phoneValid}
          />
          {phoneValid && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
              <IconCheck />
            </span>
          )}
        </div>
        <span className="text-[11px] text-[color:var(--color-ink)]/45">
          {phoneHint ?? "ใช้สำหรับยืนยันการจองและติดต่อกลับ — เบอร์มือถือ 10 หลัก"}
        </span>
      </label>

      {/* Email — optional */}
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>อีเมล</FieldLabel>
          <span className="text-[11px] text-[color:var(--color-ink)]/40" style={{ fontFamily: "var(--font-ui)" }}>
            ไม่บังคับ
          </span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
            <IconMail />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="เช่น you@email.com"
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            aria-invalid={emailTrimmed.length > 0 && !emailValid}
          />
          {emailTrimmed.length > 0 && emailValid && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
              <IconCheck />
            </span>
          )}
        </div>
        <span className="text-[11px] text-[color:var(--color-ink)]/45">
          {emailTrimmed.length > 0 && !emailValid
            ? "รูปแบบอีเมลไม่ถูกต้อง"
            : "ถ้ากรอก จะใช้ส่งใบยืนยัน/ติดต่อสำรองนอกเหนือจาก LINE"}
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-warm-clay)] px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-warm-clay)]/40"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {busy ? (
          "กำลังบันทึก…"
        ) : (
          <>
            {submitLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-[color:var(--color-ink)]/15 bg-[color:var(--color-bone)] py-3.5 pl-11 pr-10 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30 aria-[invalid=true]:border-red-300";

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="h-[18px] w-[18px]">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="h-[18px] w-[18px]">
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="h-[18px] w-[18px]">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden className="h-[18px] w-[18px]">
      <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
