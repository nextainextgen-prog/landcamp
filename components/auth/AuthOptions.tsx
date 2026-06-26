"use client";

import { cn } from "@/lib/cn";

/**
 * Sign-in choice — LINE is the only customer login method. Used in the navbar
 * and the booking modal. `onBeforeRedirect` lets callers persist state (e.g. a
 * pending booking intent) before we leave the page for LINE's OAuth screen.
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
  const lineHref = `/api/auth/line/login?next=${encodeURIComponent(next)}`;

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
        เข้าสู่ระบบด้วย LINE
      </a>
    </div>
  );
}
