"use client";

import { useEffect, useRef, useState } from "react";
import { AuthOptions } from "@/components/auth/AuthOptions";
import { cn } from "@/lib/cn";

type Variant = "desktop" | "mobile";

/**
 * Sign-in entry point. Mobile shows the LINE/Google options inline; desktop
 * shows a compact button that opens a small popover with the same options.
 */
export function SignInButton({ variant = "desktop" }: { variant?: Variant }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (variant === "mobile") {
    return <AuthOptions className="w-full" />;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.28em]",
          "border border-[color:var(--color-bone)]/30 text-[color:var(--color-bone)]/90",
          "hover:bg-[color:var(--color-bone)]/10 hover:text-[color:var(--color-bone)]",
          "transition-colors duration-500 ease-out",
        )}
        style={{ fontFamily: "var(--font-ui)" }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        เข้าสู่ระบบ
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)]">
          <AuthOptions />
        </div>
      )}
    </div>
  );
}
