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
import Image from "next/image";
import { useT } from "@/app/providers";
import { useContent } from "@/lib/content/provider";
import { FullMenuModal } from "@/components/sections/FullMenuModal";

const EASE = [0.22, 1, 0.36, 1] as const;

type MenuImage = { src: string; alt: string };

// Row 1 — คาเฟ่ (ขนม + เครื่องดื่ม)
const CAFE_IMAGES: MenuImage[] = [
  { src: "/images/menu/cafe/dessert-01.jpg", alt: "Honey toast brick, caramel croissant and blueberry cheesecake at Try Cafe" },
  { src: "/images/menu/cafe/dessert-02.jpg", alt: "Honey being poured onto toast brick at Try Cafe" },
  { src: "/images/menu/cafe/dessert-03.jpg", alt: "Pastry spread — toast brick, caramel croissant, blueberry cheesecake, banana cake" },
  { src: "/images/menu/cafe/dessert-04.jpg", alt: "Blueberry cheesecake on wooden tray, Try Cafe" },
  { src: "/images/menu/cafe/dessert-05.jpg", alt: "Plain and caramel cashew croissants with banana cake" },
  { src: "/images/menu/cafe/dessert-06.jpg", alt: "Caramel cashew croissant alongside almond banana cake" },
  { src: "/images/menu/cafe/drink-01.jpg", alt: "Iced Americano with orange slices on Try Cafe board" },
  { src: "/images/menu/cafe/drink-02.jpg", alt: "Iced latte in Try Cafe cup" },
  { src: "/images/menu/cafe/drink-03.jpg", alt: "Iced latte and orange Americano on Try Cafe board" },
  { src: "/images/menu/cafe/drink-04.jpg", alt: "Iced caramel macchiato in Try Cafe cup" },
  { src: "/images/menu/cafe/drink-05.jpg", alt: "Iced caramel latte with art on top" },
  { src: "/images/menu/cafe/drink-06.jpg", alt: "Strawberry matcha with strawberry topping at Try Cafe" },
  { src: "/images/menu/cafe/drink-07.jpg", alt: "Iced orange Americano in Try Cafe cup" },
  { src: "/images/menu/cafe/drink-08.jpg", alt: "Matcha latte in hand at Try Cafe" },
  { src: "/images/menu/cafe/drink-09.jpg", alt: "Fresh orange juice at Try Cafe" },
  { src: "/images/menu/cafe/drink-10.jpg", alt: "Iced latte in hand at Try Cafe" },
  { src: "/images/menu/cafe/drink-11.jpg", alt: "Try Cafe signature drinks lineup" },
  { src: "/images/menu/cafe/drink-12.jpg", alt: "Strawberry chocolate frappe at Try Cafe" },
  { src: "/images/menu/cafe/drink-13.jpg", alt: "Strawberry chocolate frappe in hand by the stream" },
  { src: "/images/menu/cafe/drink-14.jpg", alt: "Berry soda with mixed berries at Try Cafe" },
  { src: "/images/menu/cafe/drink-15.jpg", alt: "Thai tea in Try Cafe cup" },
];

// Row 2 — อาหารตามสั่ง (Thai a la carte / rice plates)
const DISHES_IMAGES: MenuImage[] = [
  { src: "/images/menu/dishes/dish-01.jpg", alt: "Crispy pork belly, fried chicken wings and rice with crispy pork" },
  { src: "/images/menu/dishes/dish-02.jpg", alt: "Crispy pork rice, deep-fried pork belly and fried wings on banana leaf" },
  { src: "/images/menu/dishes/dish-03.jpg", alt: "Stir-fried basil beef and basil chicken with rice" },
  { src: "/images/menu/dishes/dish-04.jpg", alt: "Top-down spread of Thai stir-fry rice dishes" },
  { src: "/images/menu/dishes/dish-05.jpg", alt: "Basil rice, basil shrimp, basil squid spread" },
  { src: "/images/menu/dishes/dish-06.jpg", alt: "Crispy pork belly, fried chicken wings, basil shrimp rice" },
  { src: "/images/menu/dishes/dish-07.jpg", alt: "Mixed Thai stir-fry plates with rice and chili dipping sauce" },
];

// Row 3 — อาหารเช้า + หมูกระทะ
const BREAKFAST_KRATA_IMAGES: MenuImage[] = [
  { src: "/images/menu/breakfast-krata/bf-01.jpg", alt: "Pan breakfast with eggs, ham, sausage, salad and fresh juice" },
  { src: "/images/menu/breakfast-krata/bf-04.jpg", alt: "Skillet eggs with toast, sausage, orange juice and fresh salad" },
  { src: "/images/menu/breakfast-krata/bf-02.jpg", alt: "Close-up of pan breakfast with eggs, bacon and toast" },
  { src: "/images/menu/breakfast-krata/bf-05.jpg", alt: "Rattan breakfast basket — skillet eggs, rice soup, fruits and fresh juice" },
  { src: "/images/menu/breakfast-krata/bf-06.jpg", alt: "Top-down skillet eggs with sausage and ground pork on wooden deck" },
  { src: "/images/menu/breakfast-krata/bf-03.jpg", alt: "Full breakfast spread — pan eggs, salad, soup and orange juice" },
  { src: "/images/menu/breakfast-krata/bf-07.jpg", alt: "Full Thai breakfast spread — rice soup, skillet eggs, juice and fruits" },
  { src: "/images/menu/breakfast-krata/krata-01.jpg", alt: "Moo krata clay pot set with raw meats and vegetables" },
  { src: "/images/menu/breakfast-krata/krata-02.jpg", alt: "Charcoal clay-pot moo krata being cooked outdoors" },
  { src: "/images/menu/breakfast-krata/krata-03.jpg", alt: "Moo krata outdoor setup with vegetables and dipping sauces" },
];

const ROWS: {
  id: string;
  label: { th: string; en: string };
  images: MenuImage[];
  duration: number;
}[] = [
  {
    id: "cafe",
    label: { th: "คาเฟ่ · ขนม & เครื่องดื่ม", en: "Cafe · Sweets & Drinks" },
    images: CAFE_IMAGES,
    duration: 90,
  },
  {
    id: "dishes",
    label: { th: "อาหารตามสั่ง", en: "Thai à la carte" },
    images: DISHES_IMAGES,
    duration: 90,
  },
  {
    id: "breakfast-krata",
    label: { th: "อาหารเช้า & หมูกระทะ", en: "Breakfast & Moo Krata" },
    images: BREAKFAST_KRATA_IMAGES,
    duration: 90,
  },
];

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
        {ROWS.map((row) => (
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
            <MarqueeRow images={row.images} duration={row.duration} boost={boost} />
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
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 260px, (max-width: 1024px) 320px, 380px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
