"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { useT } from "@/app/providers";
import { useContent } from "@/lib/content/provider";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { scrollToSection } from "@/lib/scrollToSection";
import { cn } from "@/lib/cn";

const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

const lineVariants: Variants = {
  hidden: { opacity: 0, y: "80%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: 1.05, ease: EASE_SOFT },
  },
};

export function HeroSection() {
  const t = useT();
  const { hero } = useContent();
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yImage = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "18%"],
  );
  // Push-through zoom: image scales up as the user scrolls,
  // giving the sense of stepping INTO the photograph.
  const scaleImage = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduce ? 1 : 1.22],
  );
  const yContent = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "-10%"],
  );
  const opacityContent = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const headline = hero.headline;

  return (
    <section
      ref={ref}
      id="hero"
      aria-label={t({ th: "หน้าหลัก", en: "Hero" })}
      className="relative min-h-[100svh] w-full overflow-hidden bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] flex items-center justify-center text-center"
    >
      {/* ──────────────────────────────────────
          Full-bleed image with parallax + zoom
          ────────────────────────────────────── */}
      <motion.div
        style={{ y: yImage, scale: scaleImage }}
        className="absolute inset-0 -top-[4%] h-[108%] origin-center will-change-transform z-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.image}
          alt="LandCamp Villa Khao Yai — Camper Van, stone villa and glass cabin at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </motion.div>

      {/* Radial vignette + soft top/bottom darken — copies the index.html
          spec so the centered headline reads with the same balance. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 55%, rgba(16,18,12,0.15) 0%, rgba(16,18,12,0.55) 60%, rgba(16,18,12,0.82) 100%), linear-gradient(180deg, rgba(16,18,12,0.55) 0%, rgba(16,18,12,0) 28%, rgba(16,18,12,0.35) 70%, rgba(16,18,12,0.92) 100%)",
        }}
      />

      {/* Soft paper noise on top */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none z-[3] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ──────────────────────────────────────
          CONTENT — centered over the image
          ────────────────────────────────────── */}
      <motion.div
        style={{ y: yContent, opacity: opacityContent }}
        className="relative z-10 mx-auto w-full max-w-[880px] px-6 py-[112px] sm:py-[132px] flex flex-col items-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_SOFT, delay: 0.05 }}
          className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.32em] font-medium text-[color:var(--color-bone)]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {t(hero.eyebrow)}
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.22, delayChildren: 0.2 },
            },
          }}
          className={cn(
            "mt-7 font-serif font-medium text-[color:var(--color-bone)]",
            "drop-shadow-[0_2px_30px_rgba(0,0,0,0.4)]",
            "leading-[1.08] text-[42px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[104px]",
          )}
          style={{ letterSpacing: "-0.005em" }}
        >
          {headline.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-1">
              <motion.span variants={lineVariants} className="block">
                {line}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_SOFT, delay: 1.0 }}
          className="mt-6 max-w-[620px] mx-auto text-[15px] sm:text-base lg:text-[18px] leading-relaxed font-light text-[color:var(--color-bone)]/90"
        >
          {t(hero.subheadLine1)}
          <br />
          {t(hero.subheadLine2)}
        </motion.p>

        {/* CTA cluster — centered, primary + ghost matched on width
            (min-w) and height (transparent border on primary mirrors
            ghost's 1px outline) so they sit as a balanced pair. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 1.3 }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
        >
          <MagneticButton
            onClick={() => scrollToSection("rooms")}
            ariaLabel={t({ th: "เลื่อนไปดูห้องพัก", en: "Jump to rooms" })}
            strength={0.25}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-6 py-[15px] min-w-[200px] text-[15px] font-semibold",
                "border border-transparent",
                "bg-[#a68459] text-white",
                "hover:bg-[#b8966c] hover:-translate-y-[2px]",
                "transition-all duration-300 ease-out",
              )}
              style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}
            >
              {t(hero.ctaReserve)}
            </span>
          </MagneticButton>

          <a
            href="#rooms"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-6 py-[15px] min-w-[200px] text-[15px]",
              "border border-[color:var(--color-bone)]/40 bg-[color:var(--color-bone)]/[0.05] text-[color:var(--color-bone)]",
              "hover:bg-[color:var(--color-bone)]/[0.14] hover:border-[color:var(--color-bone)]",
              "transition-all duration-300",
            )}
            style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}
          >
            {t(hero.ctaExplore)}
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator — centered at bottom, SCROLL text + thin
          animated line. Inlined here so the structure matches the
          index.html reference exactly. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_SOFT, delay: 1.7 }}
        className="absolute bottom-8 sm:bottom-9 left-1/2 -translate-x-1/2 z-[4] hidden [@media(min-height:760px)]:flex flex-col items-center gap-2.5 text-[color:var(--color-bone)]/40"
        aria-hidden
      >
        <span
          className="text-[10px] font-medium"
          style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.4em" }}
        >
          SCROLL
        </span>
        <span className="relative block w-px h-[34px] overflow-hidden bg-gradient-to-b from-[#b5835a] to-transparent">
          <span className="absolute top-0 left-0 w-full h-3 bg-[color:var(--color-bone)] hero-scroll-dot" />
        </span>
        <style jsx>{`
          @keyframes hero-scroll-dot {
            0% {
              transform: translateY(-14px);
            }
            100% {
              transform: translateY(40px);
            }
          }
          .hero-scroll-dot {
            animation: hero-scroll-dot 1.8s infinite;
          }
        `}</style>
      </motion.div>
    </section>
  );
}
