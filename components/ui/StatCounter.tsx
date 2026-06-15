"use client";

import { animate, useInView, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type StatCounterProps = {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
};

/**
 * Number that counts from 0 to `value` the moment it scrolls into view.
 *
 * Honours prefers-reduced-motion: when reduced, jumps straight to the
 * target so the page still reads correctly.
 */
export function StatCounter({
  value,
  suffix = "",
  decimals = 0,
  duration = 2,
  className,
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const unsub = mv.on("change", (v) => {
      setDisplay(v.toFixed(decimals));
    });
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, decimals, duration, mv]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
