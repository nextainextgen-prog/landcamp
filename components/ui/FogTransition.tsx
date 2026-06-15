"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Cream-mist veil rendered between Hero and About.
 *
 * As the user scrolls past the Hero, three drifting fog layers fade in,
 * peak around 50% progress, then dissipate — creating a "stepping
 * through mist" transition. Slow editorial pacing per the Lovable ref.
 */
export function FogTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Veil opacity: build-up → peak → dissipate
  const opacity = useTransform(scrollYProgress, [0, 0.45, 0.55, 1], [0, 0.95, 0.95, 0]);
  const grainOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.12, 0]);

  // Layer drift transforms — each at a different speed/direction
  const layer1X = useTransform(scrollYProgress, [0, 1], ["-8%", "10%"]);
  const layer2X = useTransform(scrollYProgress, [0, 1], ["12%", "-10%"]);
  const layer3Y = useTransform(scrollYProgress, [0, 1], ["18%", "-16%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.0, 1.06, 1.12]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative w-full h-[55vh] sm:h-[60vh] overflow-hidden bg-[color:var(--color-bone)] pointer-events-none"
    >
      {/* Layer 1 — slow broad warm cream */}
      <motion.div
        style={{
          opacity,
          x: layer1X,
          scale,
          background:
            "radial-gradient(ellipse 70% 50% at 30% 50%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 70%), radial-gradient(ellipse 60% 40% at 70% 60%, rgba(212,184,134,0.45) 0%, rgba(212,184,134,0) 70%)",
          filter: "blur(40px)",
        }}
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%] mix-blend-screen"
      />

      {/* Layer 2 — medium sage cool */}
      <motion.div
        style={{
          opacity,
          x: layer2X,
          background:
            "radial-gradient(ellipse 45% 35% at 60% 30%, rgba(162,170,161,0.85) 0%, rgba(162,170,161,0) 65%), radial-gradient(ellipse 40% 30% at 30% 70%, rgba(119,132,117,0.55) 0%, rgba(119,132,117,0) 70%)",
          filter: "blur(30px)",
        }}
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%] mix-blend-multiply"
      />

      {/* Layer 3 — fine highlight wisps */}
      <motion.div
        style={{
          opacity,
          y: layer3Y,
          background:
            "radial-gradient(ellipse 30% 25% at 45% 40%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 65%), radial-gradient(ellipse 20% 18% at 75% 55%, rgba(245,241,234,1) 0%, rgba(245,241,234,0) 60%)",
          filter: "blur(20px)",
        }}
        className="absolute -inset-y-1/4 -inset-x-1/2 w-[200%]"
      />

      {/* Editorial grain — fades in with the mist */}
      <motion.div
        style={{ opacity: grainOpacity }}
        className="absolute inset-0 mix-blend-overlay"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>
    </div>
  );
}
