"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = { pictureUrl: string | null } | null;

/**
 * Compact sign-in control for the mobile top bar (sits left of the hamburger).
 * Glassy/translucent so it reads on the dark hero. Tapping goes straight to
 * LINE login (the only customer method); once signed in it shows the avatar
 * linking to the account area. Hidden on md+ where the desktop NavAuth shows.
 */
export function MobileAuthButton() {
  const [user, setUser] = useState<Me | undefined>(undefined); // undefined = loading

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: Me }) => {
        if (active) setUser(d.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (user === undefined) {
    // Reserve space so the bar doesn't jump once /api/auth/me resolves.
    return <span aria-hidden className="h-8 w-[88px]" />;
  }

  if (user) {
    return (
      <Link
        href="/account/bookings"
        aria-label="บัญชีของฉัน"
        className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[color:var(--color-bone)]/35 bg-[color:var(--color-bone)]/10 text-[color:var(--color-bone)] backdrop-blur-sm"
      >
        {user.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- LINE avatar host isn't allowlisted for next/image
          <img src={user.pictureUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
          </svg>
        )}
      </Link>
    );
  }

  return (
    <a
      href="/api/auth/line/login?next=/account/bookings"
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-bone)]/35 bg-[color:var(--color-bone)]/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-bone)] backdrop-blur-sm transition-colors hover:bg-[color:var(--color-bone)]/20"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      เข้าสู่ระบบ
    </a>
  );
}
