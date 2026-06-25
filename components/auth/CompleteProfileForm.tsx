"use client";

import { useState, type FormEvent } from "react";

/**
 * Collects name + phone once after the first LINE/Google sign-in. OAuth gives
 * us a display name + avatar but never a phone number, so the booking flow (and
 * the backoffice) has no way to reach the customer until this is filled in.
 *
 * Used inline inside the booking modal and on the standalone /profile/complete
 * page. On success it calls onDone() with the saved values.
 */
export function CompleteProfileForm({
  initialName = "",
  onDone,
  submitLabel = "บันทึกและไปต่อ",
}: {
  initialName?: string;
  onDone?: (profile: { fullName: string; phone: string }) => void;
  submitLabel?: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          ชื่อ–นามสกุล
        </span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="เช่น สมชาย ใจดี"
          autoComplete="name"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          เบอร์โทรศัพท์
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08x-xxx-xxxx"
          inputMode="tel"
          autoComplete="tel"
          className={inputClass}
        />
        <span className="text-[11px] text-[color:var(--color-ink)]/45">
          ใช้สำหรับยืนยันการจองและติดต่อกลับ
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || fullName.trim().length < 2 || phone.trim().length < 9}
        className="w-full inline-flex items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {busy ? "กำลังบันทึก…" : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-[color:var(--color-ink)]/15 bg-[color:var(--color-bone)] px-3.5 py-3 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30";
