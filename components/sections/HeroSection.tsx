"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { siteConfig } from "@/data/siteConfig";
import { useLocale, useT } from "@/app/providers";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/cn";

const HEADLINE_TH = ["LandCamp", "Villa khaoyai"];

const HEADLINE_EN = ["LandCamp", "Villa khaoyai"];

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
      className="relative min-h-[100svh] w-full overflow-hidden bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)]"
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

      {/* Top darken — keeps navbar legible */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[260px] pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,25,18,0.55) 0%, rgba(20,25,18,0.22) 55%, rgba(20,25,18,0) 100%)",
        }}
      />

      {/* Left-side dark scrim — keeps the headline + body crisp on photo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(100deg, rgba(20,25,18,0.62) 0%, rgba(20,25,18,0.38) 32%, rgba(20,25,18,0.08) 58%, rgba(20,25,18,0) 75%)",
        }}
      />

      {/* Bottom darken — for scroll cue + brand strip */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to top, rgba(20,25,18,0.72) 0%, rgba(20,25,18,0.35) 45%, rgba(20,25,18,0) 100%)",
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
          CONTENT — left-aligned over the image
          ────────────────────────────────────── */}
      <motion.div
        style={{ y: yContent, opacity: opacityContent }}
        className="relative z-10 mx-auto flex flex-col min-h-[100svh] max-w-[1440px] px-6 sm:px-10 lg:px-14"
      >
        <div className="h-[84px] flex-shrink-0" />

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_SOFT, delay: 0.05 }}
          className="mt-12 sm:mt-16 lg:mt-20 flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-[color:var(--color-bone)]/85"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <span aria-hidden className="h-px w-8 sm:w-12 bg-current opacity-70" />
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
            "mt-4 sm:mt-6 font-serif font-medium text-[color:var(--color-bone)]",
            "sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]",
            "drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]",
            "leading-[0.95] text-[40px] sm:text-[58px] md:text-[74px] lg:text-[96px] xl:text-[116px]",
          )}
          style={{ letterSpacing: "-0.01em" }}
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
          className="mt-7 sm:mt-8 max-w-md text-sm sm:text-[15px] leading-relaxed text-[color:var(--color-bone)]/82"
        >
          {t({
            th: "วิลล่าสไตล์ Glamping 6 หลัง ใจกลางขุนเขาเขาใหญ่ ทุกมุมมองสงวนไว้ให้คุณคนเดียว",
            en: "Six glamping villas tucked into the forests of Khao Yai — every vista, reserved for you alone.",
          })}
        </motion.p>

        {/* CTA cluster */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 1.3 }}
          className="mt-8 sm:mt-9 flex flex-row items-center gap-4 sm:gap-5"
        >
          <MagneticButton
            href={siteConfig.contact.lineUrl}
            ariaLabel="Book via Line"
            strength={0.25}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-[11px] uppercase tracking-[0.32em]",
                "bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)]",
                "hover:bg-[color:var(--color-forest-deep)]",
                "transition-colors duration-500 ease-out",
              )}
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "จองที่พัก", en: "Reserve" })}
              <span aria-hidden className="inline-block h-px w-5 bg-current opacity-70" />
            </span>
          </MagneticButton>

          <a
            href="#rooms"
            className="inline-flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/90 hover:text-[color:var(--color-warm-clay)] transition-colors px-2 sm:px-0"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {t({ th: "สำรวจห้องพัก", en: "Explore Rooms" })}
            <span aria-hidden className="inline-block h-px w-6 bg-current opacity-60" />
          </a>
        </motion.div>

        {/* Push the bottom row down */}
        <div className="flex-1 min-h-[40px]" />

        {/* Bottom row — scroll indicator + brand strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_SOFT, delay: 1.7 }}
          className="pb-8 sm:pb-10 lg:pb-12 flex items-end justify-between gap-6"
        >
          <ScrollIndicator href="#about" tone="bone" />

          <div
            className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-[0.38em] text-[color:var(--color-bone)]/80"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span>
              {t({
                th: "ปากช่อง · นครราชสีมา",
                en: "Pak Chong · Nakhon Ratchasima",
              })}
            </span>
            <span aria-hidden className="h-px w-8 bg-current opacity-50" />
            <span>
              {t({
                th: `เริ่มต้นที่ ${siteConfig.inventory.priceFromTHB.toLocaleString()} บาท`,
                en: `From THB ${siteConfig.inventory.priceFromTHB.toLocaleString()}`,
              })}
            </span>
            <span aria-hidden className="h-px w-8 bg-current opacity-50" />
            <span>
              {siteConfig.rating.value} / 5 · {siteConfig.rating.count}{" "}
              {t({ th: "รีวิว", en: "reviews" })}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
