"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

/**
 * Sign-in choices — LINE emphasised as primary, Google as a secondary option.
 * Used in the navbar and the booking modal. `onBeforeRedirect` lets callers
 * persist state (e.g. a pending booking intent) before we leave the page.
 */
export function AuthOptions({
  next = "/",
  onBeforeRedirect,
  className,
}: {
  next?: string;
  onBeforeRedirect?: () => void;
  className?: string;
}) {
  const [pending, setPending] = useState<null | "line" | "google">(null);
  const lineHref = `/api/auth/line/login?next=${encodeURIComponent(next)}`;

  async function google() {
    if (pending) return;
    setPending("google");
    onBeforeRedirect?.();
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setPending(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <a
        href={lineHref}
        onClick={() => onBeforeRedirect?.()}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#06C755] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
          <path d="M12 2C6.5 2 2 5.65 2 10.13c0 4.02 3.56 7.39 8.37 8.02.33.07.77.22.88.5.1.26.07.65.03.92l-.14.85c-.04.26-.2 1 .88.55 1.07-.45 5.79-3.41 7.9-5.84C21.45 13.6 22 11.94 22 10.13 22 5.65 17.51 2 12 2zM8.32 12.85H6.4c-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.3h1.37c.3 0 .55.25.55.55s-.25.54-.55.54zm2.15-.55c0 .3-.24.55-.55.55-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.84zm4.61 0c0 .24-.15.45-.38.52-.06.02-.12.03-.18.03-.17 0-.34-.08-.43-.22l-1.97-2.68v2.35c0 .3-.25.55-.55.55-.31 0-.55-.25-.55-.55V8.46c0-.24.15-.44.38-.52.06-.02.12-.03.18-.03.17 0 .33.09.43.22l1.97 2.68V8.46c0-.3.24-.54.55-.54.3 0 .55.24.55.54v3.84zm3.1-2.47c.3 0 .55.25.55.55 0 .3-.25.54-.55.54h-1.37v.83h1.37c.3 0 .55.24.55.55 0 .3-.25.54-.55.54H16.2c-.3 0-.54-.24-.54-.54V8.46c0-.3.24-.54.54-.54h1.93c.3 0 .55.24.55.54s-.25.55-.55.55h-1.37v.82h1.37z" />
        </svg>
        {pending === "line" ? "กำลังเปิด LINE…" : "เข้าสู่ระบบด้วย LINE"}
      </a>
      <button
        type="button"
        onClick={google}
        disabled={pending !== null}
        className="inline-flex items-center justify-center gap-2.5 rounded-full border border-current/20 bg-white px-5 py-2.5 text-sm font-medium text-[color:var(--color-ink)] transition-colors hover:bg-black/[0.03] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
          <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.21-4.74 3.21-8.33z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.86 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.68-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.68 2.84C6.72 7.3 9.14 5.38 12 5.38z" />
        </svg>
        {pending === "google" ? "กำลังเปิด Google…" : "เข้าสู่ระบบด้วย Google"}
      </button>
    </div>
  );
}
