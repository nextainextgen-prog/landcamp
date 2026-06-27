"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

const HERO_IMAGE = "/images/hero/landcamp-glamping.jpg";

type MeUser = {
  displayName: string | null;
  pictureUrl: string | null;
  profileComplete: boolean;
} | null;

function ProfileCompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/account/bookings";

  const [user, setUser] = useState<MeUser | undefined>(undefined); // undefined = loading

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: MeUser }) => {
        if (!active) return;
        setUser(d.user);
        if (d.user?.profileComplete) router.replace(safeNext);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [router, safeNext]);

  const firstName = (user?.displayName ?? "").trim().split(/\s+/)[0] ?? "";

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      {/* Soft branded backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[color:var(--color-bone-soft)]/50" />
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[color:var(--color-sage-light)]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[color:var(--color-warm-clay)]/10 blur-3xl" />
      </div>

      <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone)] shadow-[0_40px_100px_-55px_rgba(45,55,40,0.65)] md:grid-cols-2">
        {/* ── Hero panel (image + identity) ── */}
        <div className="relative min-h-[230px] overflow-hidden md:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative resort hero; static asset */}
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* legibility + brand tint */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-forest-deep)] via-[color:var(--color-forest-deep)]/55 to-[color:var(--color-forest-deep)]/25"
          />
          <div className="relative flex h-full flex-col justify-between p-6 text-[color:var(--color-bone)] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <span
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-bone)]/80"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                LANDCAMP · ลงทะเบียน
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-bone)]/15 ring-2 ring-[color:var(--color-bone)]/40">
                {user?.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- LINE avatar host isn't allowlisted for next/image; matches UserMenu
                  <img src={user.pictureUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="h-8 w-8 text-[color:var(--color-bone)]/85">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20a8 8 0 0 1 16 0" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-[color:var(--color-bone)]/70" style={{ fontFamily: "var(--font-ui)" }}>
                  สวัสดี
                </p>
                <p className="truncate font-display text-2xl leading-tight">
                  {firstName || "ยินดีต้อนรับ"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <h1 className="font-display text-[26px] leading-tight text-[color:var(--color-forest-deep)] sm:text-3xl">
            อีกขั้นเดียวก่อนเริ่มจอง
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-[color:var(--color-ink)]/60">
            บอกชื่อและเบอร์โทรของคุณ เพื่อให้เราติดต่อและส่งใบยืนยันการจองให้คุณได้อย่างถูกต้อง
          </p>

          {user === undefined ? (
            <div className="py-10 text-center text-sm text-[color:var(--color-ink)]/45">กำลังโหลด…</div>
          ) : user === null ? (
            <div className="rounded-xl bg-[color:var(--color-bone-soft)] px-5 py-6 text-center text-sm text-[color:var(--color-ink)]/70">
              กรุณาเข้าสู่ระบบก่อน แล้วกลับมาที่หน้านี้
            </div>
          ) : (
            <CompleteProfileForm onDone={() => router.replace(safeNext)} />
          )}

          {/* Privacy reassurance */}
          <div className="mt-6 flex items-start gap-2 border-t border-[color:var(--color-forest-deep)]/8 pt-4 text-[11px] leading-relaxed text-[color:var(--color-ink)]/45">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="mt-px h-3.5 w-3.5 shrink-0">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" strokeLinecap="round" />
            </svg>
            <span>ข้อมูลของคุณถูกเก็บเป็นความลับ ใช้สำหรับการจองและติดต่อกลับเท่านั้น</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfileCompletePage() {
  return (
    <Suspense fallback={null}>
      <ProfileCompleteInner />
    </Suspense>
  );
}
