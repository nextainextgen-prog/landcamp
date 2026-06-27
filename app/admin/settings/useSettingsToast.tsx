"use client";

import { useCallback, useRef, useState } from "react";

type ToastKind = "ok" | "err";
type ToastState = { kind: ToastKind; text: string } | null;

/**
 * Tiny toast used across the settings area. Mirrors the floating pill used in
 * the housekeeping / customers screens so save feedback looks identical
 * everywhere. Returns a `show()` and a ready-to-render `toastNode`.
 */
export function useSettingsToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((kind: ToastKind, text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ kind, text });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const toastNode = toast ? (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
        toast.kind === "ok" ? "bg-[color:var(--color-forest-deep)]" : "bg-red-600"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
        {toast.kind === "ok" ? <path d="M20 6 9 17l-5-5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
      </svg>
      {toast.text}
    </div>
  ) : null;

  return { show, toastNode };
}
