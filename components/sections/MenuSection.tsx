"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useVelocity,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/app/providers";
import { useContent } from "@/lib/content/provider";
import { FullMenuModal } from "@/components/sections/FullMenuModal";

const EASE = [0.22, 1, 0.36, 1] as const;

type MenuImage = { src: string; alt: string };

export function MenuSection() {
  const t = useT();
  const { menu } = useContent();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Hidden scroll-to-accelerate
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothed = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 280,
    mass: 0.3,
  });
  const [boost, setBoost] = useState(1);
  useMotionValueEvent(smoothed, "change", (v) => {
    const next = 1 + Math.min(Math.abs(v) / 600, 4);
    setBoost(next);
  });

  return (
    <section
      id="menu"
      aria-label={t({ th: "อาหารและเครื่องดื่ม", en: "Food and drinks" })}
      className="relative bg-[color:var(--color-bone)] py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div
            className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.4em]"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <span className="text-[color:var(--color-warm-clay)]">06</span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--color-forest-deep)]/40" />
            <span className="text-[color:var(--color-forest-deep)]/65">{t(menu.eyebrow)}</span>
          </div>

          <h2
            className="font-display text-[22px] sm:text-[30px] lg:text-[38px] leading-[1.15] text-[color:var(--color-forest-deep)] lg:whitespace-nowrap"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t(menu.heading)}
          </h2>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="mt-3 inline-flex items-center gap-3 rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-6 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-forest-deep)] transition-colors duration-300"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {t({ th: "ดูเมนูทั้งหมด", en: "View Full Menu" })}
            <span aria-hidden>→</span>
          </button>
        </motion.div>
      </div>

      {/* Three marquee rows */}
      <div className="mt-12 sm:mt-16 flex flex-col gap-8 sm:gap-10">
        {menu.rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-3">
            <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
              <span
                className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/70"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                <span aria-hidden className="h-px w-6 bg-[color:var(--color-warm-clay)]" />
                {t(row.label)}
              </span>
            </div>
            {row.images.length > 0 && <MarqueeRow images={row.images} duration={90} boost={boost} />}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-12 sm:mt-16 text-center text-sm text-[color:var(--color-ink)]/55 max-w-2xl mx-auto"
        >
          {t(menu.lead)}
        </motion.p>
      </div>

      <AnimatePresence>
        {menuOpen && <FullMenuModal onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}

/**
 * Auto-scrolling marquee row with drag / swipe support.
 *
 * The track is rendered twice end-to-end so we can wrap modulo
 * `halfWidth` without ever exposing a seam. An rAF loop pushes the
 * track left at a constant px/s rate (derived from `duration` so the
 * speed matches the old CSS marquee) and pauses while the user is
 * dragging or hovering. On release the loop simply resumes from the
 * current offset, so the auto-scroll continues from wherever the
 * finger let go.
 */
function MarqueeRow({
  images,
  duration,
  boost,
}: {
  images: MenuImage[];
  duration: number;
  boost: number;
}) {
  const items = useMemo(() => [...images, ...images], [images]);
  const trackRef = useRef<HTMLDivElement>(null);

  // Live values held in refs so the rAF loop can read fresh state
  // without re-subscribing every frame.
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);
  const boostRef = useRef(boost);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  useEffect(() => {
    boostRef.current = boost;
  }, [boost]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      // The track is rendered twice — half the scroll width is exactly
      // one cycle. Wrapping modulo that distance hides the seam.
      halfWidthRef.current = el.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let raf = 0;
    let lastT: number | null = null;

    const tick = (t: number) => {
      if (lastT === null) lastT = t;
      const dt = (t - lastT) / 1000;
      lastT = t;

      if (!draggingRef.current && !hoveringRef.current && halfWidthRef.current > 0) {
        // Match the original CSS marquee: one halfWidth-wide cycle per
        // `duration` seconds. boost scales with scroll velocity.
        const speed = (halfWidthRef.current / duration) * boostRef.current;
        let nextOffset = offsetRef.current - speed * dt;
        if (nextOffset <= -halfWidthRef.current) {
          nextOffset += halfWidthRef.current;
        }
        offsetRef.current = nextOffset;
        el.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [duration]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const half = halfWidthRef.current;
    if (half <= 0) return;
    const dx = e.clientX - dragStartXRef.current;
    // Normalize into (-half, 0] so the visible content never jumps.
    let next = (dragStartOffsetRef.current + dx) % half;
    if (next > 0) next -= half;
    offsetRef.current = next;
    el.style.transform = `translate3d(${next}px, 0, 0)`;
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // On touch the synthetic mouseenter can stick after release — clear
    // it explicitly so the rAF loop resumes auto-scrolling.
    if (e.pointerType !== "mouse") hoveringRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 z-10 bg-gradient-to-r from-[color:var(--color-bone)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 z-10 bg-gradient-to-l from-[color:var(--color-bone)] to-transparent"
      />

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") hoveringRef.current = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") hoveringRef.current = false;
        }}
        className="flex gap-4 sm:gap-5 w-max will-change-transform cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "pan-y" }}
      >
        {items.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="relative flex-shrink-0 h-[200px] sm:h-[240px] lg:h-[280px] w-[260px] sm:w-[320px] lg:w-[380px] overflow-hidden rounded-[14px] bg-[color:var(--color-bone-soft)] group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] pointer-events-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
