"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { siteConfig } from "@/data/siteConfig";
import { useLocale, useT } from "@/app/providers";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/cn";

const HEADLINE_TH = ["LandCamp", "Villa Khao Yai"];
const HEADLINE_EN = ["LandCamp", "Villa Khao Yai"];

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
  const { locale } = useLocale();
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

  const headline = locale === "th" ? HEADLINE_TH : HEADLINE_EN;

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
        <Image
          src="/images/hero/landcamp-glamping.jpg"
          alt="LandCamp Villa Khao Yai — Camper Van, stone villa and glass cabin at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover"
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
        className="relative z-10 mx-auto w-full max-w-[880px] px-6 pt-[120px] sm:pt-[140px] flex flex-col items-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_SOFT, delay: 0.05 }}
          className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.32em] font-medium text-[color:var(--color-warm-clay)]/90"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {t({
            th: "เขาใหญ่ · ที่พักไพรเวท",
            en: "Khao Yai · Private Sanctuary",
          })}
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
          {t({
            th: "วิลล่าสไตล์ Glamping 6 หลัง ใจกลางขุนเขาเขาใหญ่ ทุกมุมมองสงวนไว้ให้คุณคนเดียว",
            en: "Six glamping villas tucked into the forests of Khao Yai — every vista, reserved for you alone.",
          })}
        </motion.p>

        {/* CTA cluster — centered, primary + ghost */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 1.3 }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
        >
          <MagneticButton
            href={siteConfig.contact.lineUrl}
            ariaLabel="Book via Line"
            strength={0.25}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-9 sm:px-10 py-[15px] text-[15px] font-semibold",
                "bg-[#a68459] text-white",
                "hover:bg-[#b8966c] hover:-translate-y-[2px]",
                "transition-all duration-300 ease-out",
              )}
              style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}
            >
              {t({ th: "จองที่พัก", en: "Reserve" })}
            </span>
          </MagneticButton>

          <a
            href="#rooms"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-9 sm:px-10 py-[15px] text-[15px]",
              "border border-[color:var(--color-bone)]/40 bg-[color:var(--color-bone)]/[0.05] text-[color:var(--color-bone)]",
              "hover:bg-[color:var(--color-bone)]/[0.14] hover:border-[color:var(--color-bone)]",
              "transition-all duration-300",
            )}
            style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}
          >
            {t({ th: "สำรวจห้องพัก", en: "Explore Rooms" })}
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
        className="absolute bottom-8 sm:bottom-9 left-1/2 -translate-x-1/2 z-[4] flex flex-col items-center gap-2.5 text-[color:var(--color-bone)]/40"
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
