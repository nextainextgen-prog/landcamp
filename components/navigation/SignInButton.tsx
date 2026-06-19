"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Variant = "desktop" | "mobile";

export function SignInButton({ variant = "desktop" }: { variant?: Variant }) {
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error("sign-in failed:", error.message);
        setPending(false);
      }
    } catch (err) {
      console.error("sign-in error:", err);
      setPending(false);
    }
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        className="block w-full text-center rounded-full border border-[color:var(--color-bone)]/30 text-[color:var(--color-bone)] px-6 py-4 text-[12px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-bone)]/10 transition-colors duration-500 disabled:opacity-60"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {pending ? "กำลังเปิดหน้าล็อกอิน..." : "เข้าสู่ระบบ"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.28em]",
        "border border-[color:var(--color-bone)]/30 text-[color:var(--color-bone)]/90",
        "hover:bg-[color:var(--color-bone)]/10 hover:text-[color:var(--color-bone)]",
        "transition-colors duration-500 ease-out",
        "disabled:opacity-60",
      )}
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {pending ? "..." : "เข้าสู่ระบบ"}
    </button>
  );
}
