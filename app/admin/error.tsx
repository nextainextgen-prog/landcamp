"use client";

// Admin error boundary — catches render/data errors in any /admin sub-page so an
// intermittent Supabase failure shows a retry card (with the sidebar/topbar still
// interactive) instead of a raw 500.

import { useEffect } from "react";

export default function AdminError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-10 text-center shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)]/12">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[color:var(--color-warm-clay)]" aria-hidden>
          <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-[color:var(--color-forest-deep)]">
          โหลดหน้านี้ไม่สำเร็จ
        </h2>
        <p className="text-sm text-[color:var(--color-ink)]/60">
          เกิดข้อผิดพลาดชั่วคราว ลองโหลดใหม่อีกครั้ง — หากยังเป็นอยู่ ให้แจ้งผู้ดูแลระบบ
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-forest-deep)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path d="M3 12a9 9 0 1 1 2.64 6.36M3 12V7m0 5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
