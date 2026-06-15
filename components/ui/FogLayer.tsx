"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type FogLayerProps = {
  intensity?: "subtle" | "medium" | "heavy";
  className?: string;
};

/**
 * Three drifting mist layers that float across the viewport at different
 * speeds. Pure CSS + SVG — no images, no canvas.
 *
 * Layered behind hero content for cinematic depth.
 */
export function FogLayer({ intensity = "medium", className }: FogLayerProps) {
  const opacities =
    intensity === "subtle"
      ? { l1: 0.12, l2: 0.08, l3: 0.06 }
      : intensity === "heavy"
        ? { l1: 0.38, l2: 0.28, l3: 0.2 }
        : { l1: 0.22, l2: 0.16, l3: 0.12 };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Slow drift, broadest cloud */}
      <motion.div
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%]"
        style={{
          opacity: opacities.l1,
          background:
            "radial-gradient(ellipse 60% 40% at 30% 50%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 70%), radial-gradient(ellipse 50% 35% at 70% 60%, rgba(162,170,161,1) 0%, rgba(162,170,161,0) 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 80,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Medium drift, secondary tone */}
      <motion.div
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%]"
        style={{
          opacity: opacities.l2,
          background:
            "radial-gradient(ellipse 40% 30% at 60% 30%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 60%), radial-gradient(ellipse 35% 25% at 25% 70%, rgba(212,184,134,1) 0%, rgba(212,184,134,0) 70%)",
          filter: "blur(30px)",
        }}
        animate={{ x: ["-50%", "0%"] }}
        transition={{
          duration: 110,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Fast drift, fine highlight */}
      <motion.div
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%]"
        style={{
          opacity: opacities.l3,
          background:
            "radial-gradient(ellipse 25% 18% at 50% 50%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 65%)",
          filter: "blur(20px)",
        }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
