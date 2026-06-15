"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import { useT } from "@/app/providers";
import { useIsMobile } from "@/lib/useMediaQuery";
import { cn } from "@/lib/cn";

export type CarouselSlide = {
  src: string;
  alt: string;
  title: { th: string; en: string };
  subtitle: { th: string; en: string };
  rating?: number;
};

interface StoryCarouselProps {
  slides: CarouselSlide[];
  autoPlayMs?: number;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "h-[18px] w-[18px] transition-colors duration-300",
        filled
          ? "fill-[color:var(--color-warm-clay)] stroke-[color:var(--color-warm-clay)]"
          : "fill-transparent stroke-white",
      )}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7.5-4.6-7.5-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 6.4-7.5 11-7.5 11Z" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-[13px] w-[13px]", filled ? "fill-[#FFCB66]" : "fill-white/25")}
      aria-hidden
    >
      <path d="M12 2 14.85 8.63 22 9.27l-5.46 4.79 1.64 6.97L12 17.77 5.82 21.03l1.64-6.97L2 9.27l7.15-.64L12 2Z" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? <path d="m14 6-6 6 6 6" /> : <path d="m10 6 6 6-6 6" />}
    </svg>
  );
}

export function StoryCarousel({
  slides,
  autoPlayMs = 4000,
  className,
}: StoryCarouselProps) {
  const t = useT();
  const isMobile = useIsMobile();
  const total = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const next = useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const prev = useCallback(
    () => setActive((i) => (i - 1 + total) % total),
    [total],
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(next, autoPlayMs);
    return () => window.clearInterval(id);
  }, [next, autoPlayMs, paused, total]);

  const toggleFav = (i: number) => {
    setFavorites((prev) => {
      const s = new Set(prev);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      return s;
    });
  };

  const getOffset = (i: number) => {
    let d = i - active;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  // Responsive layout values
  const spacing = isMobile ? 64 : 130;
  const maxVisible = isMobile ? 1 : 2;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 60;
    if (info.offset.x < -threshold) next();
    else if (info.offset.x > threshold) prev();
  };

  return (
    <div
      className={cn("relative w-full select-none", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t({ th: "ภาพเรื่องราวของแลนด์แคมป์", en: "LandCamp story carousel" })}
    >
      <motion.div
        className="relative mx-auto h-[400px] sm:h-[480px] lg:h-[540px] flex items-center justify-center [perspective:1400px] touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
        onDragStart={() => setPaused(true)}
      >
        {slides.map((slide, i) => {
          const offset = getOffset(i);
          const abs = Math.abs(offset);
          const visible = abs <= maxVisible;
          const isActive = offset === 0;

          const x = offset * spacing;
          const scale = isActive ? 1 : 1 - abs * (isMobile ? 0.14 : 0.11);
          const rotate = offset * (isMobile ? 6 : 5);
          const opacity = visible ? (isActive ? 1 : abs === 1 ? 0.7 : 0.4) : 0;

          return (
            <motion.button
              key={slide.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t({
                th: `เลือกรูปที่ ${i + 1} จาก ${total}`,
                en: `Show slide ${i + 1} of ${total}`,
              })}
              aria-current={isActive}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              animate={{
                x: `${x}px`,
                scale,
                rotateZ: rotate,
                opacity,
                zIndex: 20 - abs,
              }}
              transition={{ duration: 0.75, ease: EASE }}
              style={{ transformOrigin: "center bottom" }}
              className="absolute h-full aspect-[3/4] max-h-[500px] rounded-[28px] overflow-hidden shadow-[0_36px_80px_-24px_rgba(20,30,20,0.55)] ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bone)] pointer-events-auto"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 380px"
                className="object-cover pointer-events-none"
                priority={i === 0}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none"
              />
              <span
                role="button"
                tabIndex={isActive ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleFav(i);
                  }
                }}
                aria-label={t({
                  th: favorites.has(i) ? "ยกเลิกชื่นชอบ" : "บันทึกเป็นชื่นชอบ",
                  en: favorites.has(i) ? "Remove from favorites" : "Save to favorites",
                })}
                aria-pressed={favorites.has(i)}
                className="absolute top-4 right-4 grid place-items-center h-10 w-10 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/15 transition-all duration-300 hover:bg-black/55 hover:scale-105 active:scale-95"
              >
                <HeartIcon filled={favorites.has(i)} />
              </span>
              <div className="absolute inset-x-0 bottom-0 px-5 sm:px-6 pb-5 sm:pb-6 text-left text-white pointer-events-none">
                {typeof slide.rating === "number" && (
                  <div className="flex items-center gap-[3px] mb-2.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <StarIcon key={k} filled={k < (slide.rating ?? 0)} />
                    ))}
                  </div>
                )}
                <h4
                  className="font-display font-medium text-[22px] sm:text-2xl leading-[1.15]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {t(slide.title)}
                </h4>
                <p
                  className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/75"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t(slide.subtitle)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={prev}
          aria-label={t({ th: "ก่อนหน้า", en: "Previous" })}
          className="grid place-items-center h-11 w-11 rounded-full border border-[color:var(--color-forest-deep)]/25 text-[color:var(--color-forest-deep)] transition-all duration-300 hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] hover:border-transparent hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
        >
          <ChevronIcon direction="left" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t({ th: `ไปยังรูปที่ ${i + 1}`, en: `Go to slide ${i + 1}` })}
              aria-current={i === active}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bone)]",
                i === active
                  ? "w-8 bg-[color:var(--color-forest-deep)]"
                  : "w-1.5 bg-[color:var(--color-forest-deep)]/25 hover:bg-[color:var(--color-forest-deep)]/50",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label={t({ th: "ถัดไป", en: "Next" })}
          className="grid place-items-center h-11 w-11 rounded-full border border-[color:var(--color-forest-deep)]/25 text-[color:var(--color-forest-deep)] transition-all duration-300 hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] hover:border-transparent hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  );
}
