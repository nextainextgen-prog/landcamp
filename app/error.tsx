"use client";

// Public error boundary — catches render/data errors in the marketing + customer
// pages so a failed query shows a friendly retry screen instead of a raw crash.

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)]/12">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-[color:var(--color-warm-clay)]" aria-hidden>
          <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl text-[color:var(--color-forest-deep)] sm:text-3xl">
          เกิดข้อผิดพลาดบางอย่าง
        </h1>
        <p className="text-sm text-[color:var(--color-ink)]/65">
          ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-forest-deep)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          ลองใหม่อีกครั้ง
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-forest-deep)]/20 px-6 py-2.5 text-sm font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]/60"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
