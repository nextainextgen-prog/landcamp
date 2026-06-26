"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

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
    <main className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-5 py-16">
      {/* Soft branded backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[color:var(--color-bone-soft)]/40" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[color:var(--color-sage-light)]/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--color-warm-clay)]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-[24px] border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone)] shadow-[0_30px_80px_-50px_rgba(45,55,40,0.6)]">
          {/* Header band */}
          <div className="relative bg-[color:var(--color-forest-deep)] px-7 pb-8 pt-7 text-[color:var(--color-bone)]">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-bone)]/70"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                LANDCAMP · ลงทะเบียน
              </span>
              {/* Connected-with-LINE badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-2.5 py-1 text-[10px] font-semibold text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-3 w-3">
                  <path d="M12 2C6.5 2 2 5.65 2 10.13c0 4.02 3.56 7.39 8.37 8.02.33.07.77.22.88.5.1.26.07.65.03.92l-.14.85c-.04.26-.2 1 .88.55 1.07-.45 5.79-3.41 7.9-5.84C21.45 13.6 22 11.94 22 10.13 22 5.65 17.51 2 12 2z" />
                </svg>
                เชื่อมต่อ LINE แล้ว
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3.5">
              <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-bone)]/15 ring-2 ring-[color:var(--color-bone)]/25">
                {user?.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- LINE avatar host isn't allowlisted for next/image; matches UserMenu
                  <img src={user.pictureUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className="h-7 w-7 text-[color:var(--color-bone)]/80">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    <path d="M4 20a8 8 0 0 1 16 0" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-[color:var(--color-bone)]/60" style={{ fontFamily: "var(--font-ui)" }}>
                  สวัสดี
                </p>
                <p className="truncate font-display text-xl leading-tight">
                  {firstName || "ยินดีต้อนรับ"}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 pb-7 pt-6">
            <h1 className="font-display text-2xl leading-tight text-[color:var(--color-forest-deep)]">
              อีกขั้นเดียวก่อนเริ่มจอง
            </h1>
            <p className="mt-1.5 mb-6 text-sm leading-relaxed text-[color:var(--color-ink)]/60">
              บอกชื่อและเบอร์โทรของคุณ เพื่อให้เราติดต่อและส่งใบยืนยันการจองให้คุณได้อย่างถูกต้อง
            </p>

            {user === undefined ? (
              <div className="py-10 text-center text-sm text-[color:var(--color-ink)]/45">กำลังโหลด…</div>
            ) : user === null ? (
              <div className="rounded-xl bg-[color:var(--color-bone-soft)] px-5 py-6 text-center text-sm text-[color:var(--color-ink)]/70">
                กรุณาเข้าสู่ระบบก่อน แล้วกลับมาที่หน้านี้
              </div>
            ) : (
              <CompleteProfileForm
                initialName={user.displayName ?? ""}
                onDone={() => router.replace(safeNext)}
              />
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
