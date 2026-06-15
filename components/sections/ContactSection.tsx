"use client";

import { motion } from "framer-motion";
import type { SVGProps } from "react";
import { useState } from "react";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINE_QR = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
  siteConfig.contact.lineUrl,
)}&bgcolor=4D584B&color=F5F1EA&margin=10&format=svg`;

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/LandCamp+Villa+Khao+Yai/@14.6042662,101.4386857,17z/data=!4m8!3m7!1s0x311c2fa1d1a6dd03:0x200fb4eac8430519!8m2!3d14.6042662!4d101.4386857!9m1!1b1!16s%2Fg%2F11l5srt2_w?hl=th-TH";

/* ──────────────────────────────────────────
   Brand icons (inline SVG)
   ────────────────────────────────────────── */
function LineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2C6.5 2 2 5.65 2 10.13c0 4.02 3.56 7.39 8.37 8.02.33.07.77.22.88.5.1.26.07.65.03.92l-.14.85c-.04.26-.2 1 .88.55 1.07-.45 5.79-3.41 7.9-5.84C21.45 13.6 22 11.94 22 10.13 22 5.65 17.51 2 12 2zM8.32 12.85H6.4c-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.3h1.37c.3 0 .55.25.55.55s-.25.54-.55.54zm2.15-.55c0 .3-.24.55-.55.55-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.84zm4.61 0c0 .24-.15.45-.38.52-.06.02-.12.03-.18.03-.17 0-.34-.08-.43-.22l-1.97-2.68v2.35c0 .3-.25.55-.55.55-.31 0-.55-.25-.55-.55V8.46c0-.24.15-.44.38-.52.06-.02.12-.03.18-.03.17 0 .33.09.43.22l1.97 2.68V8.46c0-.3.24-.54.55-.54.3 0 .55.24.55.54v3.84zm3.1-2.47c.3 0 .55.25.55.55 0 .3-.25.54-.55.54h-1.37v.83h1.37c.3 0 .55.24.55.55 0 .3-.25.54-.55.54H16.2c-.3 0-.54-.24-.54-.54V8.46c0-.3.24-.54.54-.54h1.93c.3 0 .55.24.55.54s-.25.55-.55.55h-1.37v.82h1.37z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.43-4.92 8.43-9.94z" />
    </svg>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function StarIcon({ filled, ...props }: SVGProps<SVGSVGElement> & { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden {...props}>
      <path d="m12 2 3 7 7.5.6-5.7 5 1.8 7.4L12 18l-6.6 4 1.8-7.4L1.5 9.6 9 9z" />
    </svg>
  );
}

export function ContactSection() {
  const t = useT();
  const [hoverStar, setHoverStar] = useState(5);

  const openGoogleReview = () => {
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="contact"
      aria-label={t({ th: "ติดต่อและคำถามที่พบบ่อย", en: "Contact and FAQ" })}
      className="relative bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* ────────────────────────────────────────
            FAQ — AEO critical
            ──────────────────────────────────────── */}
        <SectionHeading
          number="09"
          tone="bone"
          eyebrow={t({ th: "คำถามที่พบบ่อย", en: "Frequently Asked" })}
          title={
            <>
              <span className="block">
                {t({ th: "เรื่องที่คน", en: "What guests" })}
              </span>
              <span className="block opacity-70">
                {t({ th: "อยากรู้ก่อนเดินทาง", en: "ask before booking" })}
              </span>
            </>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="mt-12 sm:mt-16 max-w-4xl"
        >
          <FAQAccordion tone="bone" />
        </motion.div>

        {/* ────────────────────────────────────────
            Contact + Line + Form
            ──────────────────────────────────────── */}
        <div className="mt-28 sm:mt-32 lg:mt-40 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Heading + Line CTA + QR */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Smaller, compact heading */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, ease: EASE }}
              className="flex flex-col gap-4"
            >
              <div
                className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.4em]"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                <span className="text-[color:var(--color-warm-clay)]">10</span>
                <span aria-hidden className="h-px w-8 bg-[color:var(--color-bone)]/40" />
                <span className="text-[color:var(--color-bone)]/65">
                  {t({ th: "จองและสอบถาม", en: "Book & Inquire" })}
                </span>
              </div>

              <h2
                className="font-display text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.1] text-[color:var(--color-bone)]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t({
                  th: "พูดคุยกับเราโดยตรง ผ่าน Line @landcamp",
                  en: "Talk to us directly via Line @landcamp",
                })}
              </h2>
            </motion.div>

            <p className="text-sm sm:text-base leading-[1.65] text-[color:var(--color-bone)]/75 max-w-md">
              {t({
                th: "ทีมงานตอบทุกข้อความใน 3 ชั่วโมง ไม่ผ่านเอเจนซี่ ไม่มีค่าธรรมเนียมแอบแฝง — แอด Line แล้วจองได้เลย",
                en: "Our team responds within 3 hours. No agency, no hidden fees — add us on Line and book directly.",
              })}
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
              className="flex items-center gap-6 p-6 sm:p-7 rounded-[18px] bg-[color:var(--color-bone)]/5 border border-[color:var(--color-bone)]/15"
            >
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-[10px] overflow-hidden bg-[color:var(--color-forest-deep)] flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LINE_QR}
                  alt={`Line QR code for ${siteConfig.contact.line}`}
                  width={120}
                  height={120}
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "สแกนเพื่อแอด Line", en: "Scan to add on Line" })}
                </span>
                <p className="font-display text-2xl sm:text-3xl text-[color:var(--color-bone)]">
                  {siteConfig.contact.line}
                </p>
                <a
                  href={siteConfig.contact.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/80 hover:text-[color:var(--color-warm-clay)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "หรือคลิกที่นี่", en: "Or tap here" })}
                  <span aria-hidden className="inline-block h-px w-5 bg-current opacity-60" />
                </a>
              </div>
            </motion.div>

            {/* Social channels with icons */}
            <div className="flex flex-col gap-4">
              <span
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-bone)]/55"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {t({ th: "ติดตามเราได้ที่", en: "Follow us on" })}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  {
                    label: "Line",
                    href: siteConfig.contact.lineUrl,
                    Icon: LineIcon,
                    color: "hover:bg-[#06C755] hover:text-white hover:border-[#06C755]",
                  },
                  {
                    label: "Instagram",
                    href: siteConfig.contact.instagram,
                    Icon: InstagramIcon,
                    color: "hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:border-transparent",
                  },
                  {
                    label: "Facebook",
                    href: siteConfig.contact.facebook,
                    Icon: FacebookIcon,
                    color: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
                  },
                  {
                    label: "Phone",
                    href: `tel:${siteConfig.contact.phoneE164}`,
                    Icon: PhoneIcon,
                    color: "hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] hover:border-[color:var(--color-warm-clay)]",
                  },
                  {
                    label: "Email",
                    href: `mailto:${siteConfig.contact.email}`,
                    Icon: MailIcon,
                    color: "hover:bg-[color:var(--color-bone)] hover:text-[color:var(--color-forest-night)] hover:border-[color:var(--color-bone)]",
                  },
                ].map((c, i) => {
                  const Icon = c.Icon;
                  const external = c.href.startsWith("http");
                  return (
                    <motion.a
                      key={c.label}
                      href={c.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      aria-label={c.label}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10% 0px" }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.05 * i }}
                      className={cn(
                        "h-12 w-12 rounded-full border border-[color:var(--color-bone)]/30 text-[color:var(--color-bone)]/90 flex items-center justify-center transition-all duration-300",
                        c.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fake review form — any interaction opens Google Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            className="lg:col-span-7 rounded-[18px] bg-[color:var(--color-bone)]/5 border border-[color:var(--color-bone)]/12 p-6 sm:p-8 lg:p-10"
          >
            <span
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "เขียนรีวิวให้เรา", en: "Leave us a review" })}
            </span>
            <h3 className="mt-3 font-display text-2xl sm:text-3xl leading-tight max-w-lg">
              {t({
                th: "ประสบการณ์ของคุณมีค่า แชร์รีวิวให้คนอื่นได้รู้จักเรา",
                en: "Your experience matters — share a review and help others find us.",
              })}
            </h3>

            <div
              onClick={openGoogleReview}
              onMouseLeave={() => setHoverStar(5)}
              className="mt-8 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openGoogleReview();
                }
              }}
            >
              {/* Star rating row */}
              <div className="flex flex-col gap-3 mb-7">
                <label
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/65"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "ให้คะแนน", en: "Your rating" })}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Rate ${n} of 5`}
                      onMouseEnter={() => setHoverStar(n)}
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleReview();
                      }}
                      className={cn(
                        "h-9 w-9 transition-colors duration-200",
                        n <= hoverStar
                          ? "text-[color:var(--color-warm-clay)]"
                          : "text-[color:var(--color-bone)]/30 hover:text-[color:var(--color-bone)]/50",
                      )}
                    >
                      <StarIcon filled={n <= hoverStar} className="h-full w-full" />
                    </button>
                  ))}
                  <span
                    className="ml-3 text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-warm-clay)]"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({ th: "5 / 5 · ยอดเยี่ยม", en: "5 / 5 · Excellent" })}
                  </span>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <label className="flex flex-col gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/65"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({ th: "ชื่อของคุณ", en: "Your name" })}
                  </span>
                  <input
                    readOnly
                    onFocus={openGoogleReview}
                    onClick={openGoogleReview}
                    placeholder={t({ th: "เช่น สมชาย ใจดี", en: "e.g. John Doe" })}
                    className="bg-[color:var(--color-bone)]/8 border border-[color:var(--color-bone)]/20 rounded-lg px-4 py-3 text-sm text-[color:var(--color-bone)] placeholder:text-[color:var(--color-bone)]/35 focus:outline-none focus:border-[color:var(--color-warm-clay)] transition-colors cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/65"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({ th: "ห้องที่เข้าพัก", en: "Room stayed" })}
                  </span>
                  <input
                    readOnly
                    onFocus={openGoogleReview}
                    onClick={openGoogleReview}
                    placeholder={t({ th: "เช่น วิลล่า 1 ห้องนอน", en: "e.g. 1-bedroom villa" })}
                    className="bg-[color:var(--color-bone)]/8 border border-[color:var(--color-bone)]/20 rounded-lg px-4 py-3 text-sm text-[color:var(--color-bone)] placeholder:text-[color:var(--color-bone)]/35 focus:outline-none focus:border-[color:var(--color-warm-clay)] transition-colors cursor-pointer"
                  />
                </label>
              </div>

              {/* Review text */}
              <label className="flex flex-col gap-2 mb-7">
                <span
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/65"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "เล่าประสบการณ์ของคุณ", en: "Share your experience" })}
                </span>
                <textarea
                  readOnly
                  onFocus={openGoogleReview}
                  onClick={openGoogleReview}
                  rows={4}
                  placeholder={t({
                    th: "บอกเราว่าทริปของคุณเป็นอย่างไร...",
                    en: "Tell us how your stay was...",
                  })}
                  className="bg-[color:var(--color-bone)]/8 border border-[color:var(--color-bone)]/20 rounded-lg px-4 py-3 text-sm text-[color:var(--color-bone)] placeholder:text-[color:var(--color-bone)]/35 focus:outline-none focus:border-[color:var(--color-warm-clay)] transition-colors resize-none cursor-pointer"
                />
              </label>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleReview();
                }}
                className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-7 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-[color:var(--color-bone)] hover:text-[color:var(--color-forest-night)] transition-colors duration-500 shadow-[0_12px_28px_-12px_rgba(178,108,80,0.6)]"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {t({ th: "ส่งรีวิวผ่าน Google", en: "Submit via Google" })}
                <span aria-hidden>→</span>
              </button>

              <p
                className="mt-4 text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/45 text-center"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {t({
                  th: "* รีวิวจะถูกส่งไปที่ Google Maps · LandCamp Villa Khao Yai",
                  en: "* Your review will be posted to Google Maps · LandCamp Villa Khao Yai",
                })}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
