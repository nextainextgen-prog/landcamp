"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  number?: string;
  title: ReactNode;
  align?: "left" | "center";
  tone?: "ink" | "bone";
  className?: string;
};

/**
 * Reusable editorial section heading with eyebrow + numbered tag + display title.
 *
 * Used by every section to maintain typographic rhythm across the page.
 */
export function SectionHeading({
  eyebrow,
  number,
  title,
  align = "left",
  tone = "ink",
  className,
}: SectionHeadingProps) {
  const isInk = tone === "ink";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.42em]",
          isInk
            ? "text-[color:var(--color-forest-deep)]/65"
            : "text-[color:var(--color-bone)]/65",
        )}
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {number && (
          <span className={cn("opacity-80", isInk ? "text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-warm-clay)]")}>
            {number}
          </span>
        )}
        <span aria-hidden className="h-px w-8 bg-current opacity-60" />
        {eyebrow}
      </span>

      <h2
        className={cn(
          "font-display leading-[1.05]",
          "text-[28px] sm:text-[36px] lg:text-[44px]",
          isInk
            ? "text-[color:var(--color-forest-deep)]"
            : "text-[color:var(--color-bone)]",
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
    </motion.div>
  );
}
