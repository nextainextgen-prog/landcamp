"use client";

import { motion } from "framer-motion";
import { useT } from "@/app/providers";
import { cn } from "@/lib/cn";

type ScrollIndicatorProps = {
  href?: string;
  className?: string;
  tone?: "bone" | "ink";
};

/**
 * Vertical "scroll" affordance with a slow descending line glyph.
 *
 * Renders as a button when no href is supplied — clicking smooth-scrolls
 * past the hero. When `href` is provided it routes as an anchor.
 */
export function ScrollIndicator({
  href = "#about",
  className,
  tone = "bone",
}: ScrollIndicatorProps) {
  const t = useT();
  const isInk = tone === "ink";

  return (
    <a
      href={href}
      aria-label="Scroll to next section"
      className={cn(
        "group inline-flex flex-col items-center gap-3 transition-colors",
        isInk
          ? "text-[color:var(--color-forest-deep)]/75 hover:text-[color:var(--color-forest-deep)]"
          : "text-[color:var(--color-bone)]/85 hover:text-[color:var(--color-bone)]",
        className,
      )}
    >
      <span
        className="text-[10px] uppercase tracking-[0.42em] opacity-75"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {t({ th: "เลื่อนลง", en: "Scroll" })}
      </span>
      <span
        className={cn(
          "relative block h-12 w-px overflow-hidden",
          isInk
            ? "bg-[color:var(--color-forest-deep)]/25"
            : "bg-[color:var(--color-bone)]/25",
        )}
      >
        <motion.span
          className={cn(
            "absolute inset-x-0 top-0 h-1/3",
            isInk
              ? "bg-[color:var(--color-forest-deep)]"
              : "bg-[color:var(--color-bone)]",
          )}
          animate={{ y: ["-100%", "300%"] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: [0.65, 0, 0.35, 1],
          }}
        />
      </span>
    </a>
  );
}
