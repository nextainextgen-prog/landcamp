"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

type MeUser = {
  displayName: string | null;
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

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-[20px] border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone)] p-7 shadow-[0_24px_60px_-40px_rgba(45,55,40,0.5)]">
        <span
          className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          LANDCAMP · ลงทะเบียน
        </span>
        <h1 className="mt-2 font-display text-3xl leading-tight text-[color:var(--color-forest-deep)]">
          กรอกข้อมูลของคุณ
        </h1>
        <p className="mt-1.5 mb-6 text-sm leading-relaxed text-[color:var(--color-ink)]/60">
          อีกขั้นเดียวก่อนเริ่มจอง — บอกชื่อและเบอร์โทรเพื่อให้เราติดต่อและส่งใบยืนยันการจองให้คุณได้
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
