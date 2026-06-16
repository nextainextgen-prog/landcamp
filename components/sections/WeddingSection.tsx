"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { weddingContent } from "@/data/wedding";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;
const COVER_DURATION_MS = 5000;
const SLIDE_DURATION_MS = 4000;

export function WeddingSection() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  return (
    <section
      ref={sectionRef}
      id="wedding"
      aria-label={t({ th: "งานแต่งงานและงานเลี้ยง", en: "Weddings and Private Events" })}
      className="relative bg-[color:var(--color-bone)] text-[color:var(--color-ink)] py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* ───── Copy column ───── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5% 0px" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            <div
              className="flex items-center gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.42em]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <span className="text-[color:var(--color-warm-clay)]">05</span>
              <span aria-hidden className="h-px w-10 bg-[color:var(--color-ink)]/30" />
              <span className="text-[color:var(--color-ink)]/65">{t(weddingContent.eyebrow)}</span>
            </div>

            <h2 className="font-display text-[26px] sm:text-[34px] lg:text-[40px] leading-[1.15] text-[color:var(--color-forest-deep)] max-w-xl">
              {t(weddingContent.heading)}
            </h2>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[color:var(--color-ink)]/75">
              {t(weddingContent.description)}
            </p>

            <ul className="mt-2 flex flex-col gap-3 text-sm sm:text-[15px] leading-relaxed">
              {weddingContent.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-[color:var(--color-ink)]/85">
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-warm-clay)] shrink-0"
                  />
                  <span>{t(h)}</span>
                </li>
              ))}
            </ul>

            <a
              href={siteConfig.contact.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-3 self-start rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-7 py-4 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-forest-deep)] transition-colors duration-500 shadow-[0_10px_24px_-10px_rgba(178,108,80,0.6)]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t(weddingContent.ctaLabel)}
              <span aria-hidden>→</span>
            </a>
          </motion.div>

          {/* ───── Carousel column ───── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-[22px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]">
              <WeddingCarousel started={inView} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WeddingCarousel({ started }: { started: boolean }) {
  const t = useT();
  const images = weddingContent.images;
  const [index, setIndex] = useState(0);
  const initialCoverDoneRef = useRef(false);

  useEffect(() => {
    if (!started || images.length <= 1) return;
    const isInitialCover = index === 0 && !initialCoverDoneRef.current;
    const duration = isInitialCover ? COVER_DURATION_MS : SLIDE_DURATION_MS;
    const id = window.setTimeout(() => {
      if (isInitialCover) initialCoverDoneRef.current = true;
      setIndex((i) => (i + 1) % images.length);
    }, duration);
    return () => window.clearTimeout(id);
  }, [started, index, images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={index}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.85, ease: EASE }}
          className="absolute inset-0"
        >
          <Image
            src={images[index].src}
            alt={t(images[index].alt)}
            fill
            sizes="(max-width: 1024px) 92vw, 58vw"
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === index ? "w-6 bg-[color:var(--color-bone)]" : "w-1 bg-[color:var(--color-bone)]/55",
            )}
          />
        ))}
      </div>
    </div>
  );
}
