"use client";

import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/cn";

const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * Split a string into grapheme clusters — keeps Thai consonant + vowel
 * + tone marks together so the reveal never breaks a syllable apart.
 *
 * Uses Intl.Segmenter when available, falls back to a code-point split.
 */
function splitGraphemes(input: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new (Intl as typeof Intl & { Segmenter: typeof Intl.Segmenter }).Segmenter(
      "th",
      { granularity: "grapheme" },
    );
    return Array.from(seg.segment(input), (s) => s.segment);
  }
  return Array.from(input);
}

type CharRevealProps = {
  text: string;
  /** delay before this line's first character starts (s) */
  delay?: number;
  /** per-character stagger (s) — Lovable-slow default 0.05s */
  charDelay?: number;
  className?: string;
  /** Trigger once and stay visible — default true */
  once?: boolean;
};

/**
 * Reveal text one grapheme cluster at a time on scroll-into-view.
 * Each cluster fades + slides up + un-blurs.
 */
export function CharReveal({
  text,
  delay = 0,
  charDelay = 0.05,
  className,
  once = true,
}: CharRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-20% 0px -20% 0px" });

  const clusters = useMemo(() => splitGraphemes(text), [text]);

  return (
    <span
      ref={ref}
      className={cn("inline-block leading-[inherit]", className)}
      aria-label={text}
    >
      {clusters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          aria-hidden
          initial={{ opacity: 0, y: "65%", filter: "blur(6px)" }}
          animate={
            inView
              ? { opacity: 1, y: "0%", filter: "blur(0px)" }
              : { opacity: 0, y: "65%", filter: "blur(6px)" }
          }
          transition={{
            duration: 0.85,
            ease: EASE_SOFT,
            delay: delay + i * charDelay,
          }}
          className="inline-block align-baseline"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}
