"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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
  className?: string;
}

// Layout constants — referenced by both the slide widths (via Tailwind
// arbitrary values) and the JS-computed transform so they stay in sync.
const DESKTOP = { cardPct: 31, gapPx: 24, centerPct: 3.5 } as const;
const MOBILE = { cardPct: 78, gapPx: 16, centerPct: 11 } as const;

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

/**
 * Horizontal story carousel.
 *
 * • Mobile  (<768px) — one card centered, peeks of prev/next on the
 *   edges.
 * • Desktop (≥768px) — three cards in a row, the centered one is the
 *   active highlight.
 *
 * The track transform is computed in JS rather than via CSS custom
 * properties because Chrome doesn't re-evaluate `calc()` inside
 * `transform` when only a custom property changes — the value gets
 * stuck on the initial computed result.
 */
export function StoryCarousel({ slides, className }: StoryCarouselProps) {
  const t = useT();
  const isMobile = useIsMobile();
  const total = slides.length;
  const [active, setActive] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const lastOffsetRef = useRef(0);
  const dragStartXRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [dragDx, setDragDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  // Track the live viewport width so the transform can be resolved to
  // plain pixels — Chrome refuses to interpolate `calc()` expressions
  // containing percentages across transitions, so we do the math
  // ourselves and feed the transition pure px values.
  //
  // useLayoutEffect runs before the browser paints so the first frame
  // already has the correct width baked in.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      setTrackWidth((curr) => (curr === w ? curr : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const next = useCallback(
    () => setActive((i) => Math.min(i + 1, total - 1)),
    [total],
  );
  const prev = useCallback(() => setActive((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Auto-advance every ~5.5s. Timer resets whenever `active` changes,
  // so manual nav gets a fresh interval. Wraps back to slide 0 at the
  // end (manual prev/next still clamp — autoplay loops, manual doesn't).
  useEffect(() => {
    if (total <= 1) return;
    const id = window.setTimeout(() => {
      setActive((i) => (i + 1) % total);
    }, 5500);
    return () => window.clearTimeout(id);
  }, [active, total]);

  const toggleFav = (i: number) => {
    setFavorites((curr) => {
      const s = new Set(curr);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      return s;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    draggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    setDragDx(e.clientX - dragStartXRef.current);
  };

  const finishDrag = () => {
    if (!draggingRef.current) return;
    const trackWidth = trackRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(trackWidth * 0.15, 60);
    if (dragDx < -threshold) next();
    else if (dragDx > threshold) prev();
    draggingRef.current = false;
    setIsDragging(false);
    setDragDx(0);
  };

  // Pre-resolve percentages to px against the actual track width. SSR
  // and the first paint render with translate(0) because trackWidth is
  // 0 until the ResizeObserver fires.
  const layout = isMobile ? MOBILE : DESKTOP;
  const cardWidthPx = (layout.cardPct / 100) * trackWidth;
  const centerPx = (layout.centerPct / 100) * trackWidth;
  const offsetPx = centerPx - active * (cardWidthPx + layout.gapPx) + dragDx;

  // Snap the rail to the new offset via the Web Animations API. We
  // gate through requestAnimationFrame so React Strict Mode's
  // double-invoked effect collapses into a single animation call (the
  // first frame request is cancelled by the second). Skipping inline
  // transform on the rail keeps the imperatively-set value
  // authoritative.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const fromPx = lastOffsetRef.current;
      const toPx = offsetPx;
      lastOffsetRef.current = toPx;
      el.getAnimations().forEach((a) => a.cancel());
      // During a drag, follow the finger instantly.
      if (isDragging) {
        el.style.transform = `translate3d(${toPx}px, 0, 0)`;
        return;
      }
      // On first paint there's nothing to interpolate from.
      if (fromPx === toPx || fromPx === 0) {
        el.style.transform = `translate3d(${toPx}px, 0, 0)`;
        return;
      }
      const anim = el.animate(
        [
          { transform: `translate3d(${fromPx}px, 0, 0)` },
          { transform: `translate3d(${toPx}px, 0, 0)` },
        ],
        {
          duration: 500,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      // Commit the final value to inline style so the next animation
      // has a stable starting point and the value survives after the
      // animation is GC'd by the browser.
      anim.onfinish = () => {
        el.style.transform = `translate3d(${toPx}px, 0, 0)`;
        anim.cancel();
      };
    });
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [offsetPx, isDragging]);


  // Tailwind arbitrary values can't reference `layout.cardPct` at build
  // time, so the slide width is encoded as a responsive class instead.
  return (
    <div
      className={cn("relative w-full select-none", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t({
        th: "ภาพเรื่องราวของแลนด์แคมป์",
        en: "LandCamp story carousel",
      })}
    >
      <div
        ref={trackRef}
        className="overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{ touchAction: "pan-y" }}
      >
        <div
          ref={railRef}
          className="flex items-stretch will-change-transform"
          style={{ gap: `${layout.gapPx}px` }}
        >
          {slides.map((slide, i) => {
            const isActive = i === active;
            return (
              <div
                key={slide.src}
                className={cn(
                  "relative shrink-0 aspect-[3/4] rounded-[24px] overflow-hidden",
                  "basis-[78%] md:basis-[31%]",
                  "shadow-[0_28px_60px_-30px_rgba(20,30,20,0.45)] ring-1 ring-white/10",
                  "transition-[opacity,transform] duration-500 ease-out",
                  isActive ? "opacity-100 scale-100" : "opacity-55 scale-[0.94]",
                )}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 767px) 78vw, 31vw"
                  className="object-cover pointer-events-none"
                  priority={i === 0}
                  draggable={false}
                />

                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-50",
                  )}
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(i);
                  }}
                  aria-label={t({
                    th: favorites.has(i) ? "ยกเลิกชื่นชอบ" : "บันทึกเป็นชื่นชอบ",
                    en: favorites.has(i) ? "Remove from favorites" : "Save to favorites",
                  })}
                  aria-pressed={favorites.has(i)}
                  tabIndex={isActive ? 0 : -1}
                  className="absolute top-4 right-4 grid place-items-center h-10 w-10 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/15 transition-all duration-300 hover:bg-black/55 hover:scale-105 active:scale-95"
                >
                  <HeartIcon filled={favorites.has(i)} />
                </button>

                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 px-5 sm:px-6 pb-5 sm:pb-6 text-left text-white pointer-events-none transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                >
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
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {t(slide.subtitle)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls — prev / counter / next */}
      <div className="mt-8 sm:mt-10 flex items-center justify-center gap-5 sm:gap-7">
        <button
          type="button"
          onClick={prev}
          disabled={active === 0}
          aria-label={t({ th: "ก่อนหน้า", en: "Previous" })}
          className="grid place-items-center h-10 w-10 rounded-full border border-[color:var(--color-forest-deep)]/25 text-[color:var(--color-forest-deep)] transition-all duration-300 hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] hover:border-transparent disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
        >
          <ChevronIcon direction="left" />
        </button>

        <span
          aria-live="polite"
          className="text-[12px] sm:text-[13px] tracking-[0.3em] text-[color:var(--color-forest-deep)]/75 tabular-nums"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          <span className="text-[color:var(--color-forest-deep)] font-medium">
            {String(active + 1).padStart(2, "0")}
          </span>
          <span aria-hidden className="mx-2 opacity-50">
            /
          </span>
          <span>{String(total).padStart(2, "0")}</span>
        </span>

        <button
          type="button"
          onClick={next}
          disabled={active === total - 1}
          aria-label={t({ th: "ถัดไป", en: "Next" })}
          className="grid place-items-center h-10 w-10 rounded-full border border-[color:var(--color-forest-deep)]/25 text-[color:var(--color-forest-deep)] transition-all duration-300 hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] hover:border-transparent disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  );
}
