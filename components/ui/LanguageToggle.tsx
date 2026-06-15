"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/app/providers";
import { cn } from "@/lib/cn";

type LanguageToggleProps = {
  variant?: "light" | "dark";
  className?: string;
};

/**
 * Pill segmented toggle between Thai and English.
 *
 * A subtle slider tracks the active locale with spring motion.
 * Used in both the desktop navbar and the mobile drawer.
 */
export function LanguageToggle({
  variant = "light",
  className,
}: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  const tone =
    variant === "light"
      ? "border-[color:var(--color-bone)]/25 text-[color:var(--color-bone)]"
      : "border-[color:var(--color-ink)]/15 text-[color:var(--color-ink)]";

  const sliderTone =
    variant === "light"
      ? "bg-[color:var(--color-bone)]/15"
      : "bg-[color:var(--color-ink)]/10";

  return (
    <div
      role="group"
      aria-label="Language switch"
      className={cn(
        "relative inline-flex items-center rounded-full border px-1 py-1 text-[11px] uppercase tracking-[0.22em]",
        tone,
        className,
      )}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      <motion.span
        aria-hidden
        layout
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className={cn(
          "absolute inset-y-1 w-1/2 rounded-full",
          sliderTone,
        )}
        style={{
          left: locale === "th" ? "4px" : "calc(50% + 0px)",
          right: locale === "th" ? "calc(50% + 0px)" : "4px",
        }}
      />
      <button
        type="button"
        onClick={() => setLocale("th")}
        aria-pressed={locale === "th"}
        className={cn(
          "relative z-10 px-3 py-1 rounded-full transition-opacity",
          locale === "th" ? "opacity-100" : "opacity-55 hover:opacity-80",
        )}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "relative z-10 px-3 py-1 rounded-full transition-opacity",
          locale === "en" ? "opacity-100" : "opacity-55 hover:opacity-80",
        )}
      >
        EN
      </button>
    </div>
  );
}
