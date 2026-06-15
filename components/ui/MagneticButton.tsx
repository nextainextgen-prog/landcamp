"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  strength?: number;
  ariaLabel?: string;
};

/**
 * Cursor-pull magnetic button — when the cursor enters its bounding box,
 * the button drifts toward the cursor by `strength` factor.
 *
 * Used for primary CTAs (e.g. "จองเลย" Line booking).
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  strength = 0.35,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const x = useSpring(mvX, { stiffness: 160, damping: 14, mass: 0.6 });
  const y = useSpring(mvY, { stiffness: 160, damping: 14, mass: 0.6 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    mvX.set(dx * strength);
    mvY.set(dy * strength);
  };

  const handleLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={cn("inline-flex", className)}
    >
      <motion.span
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        {children}
      </motion.span>
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="inline-flex"
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex bg-transparent border-0 p-0 m-0 cursor-pointer"
    >
      {inner}
    </button>
  );
}
