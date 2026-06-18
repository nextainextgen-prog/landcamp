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
      {/* Marquee animation keyframes */}
      <style jsx global>{`
        @keyframes menu-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .menu-marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: menu-marquee-left linear infinite;
        }
        @media (min-width: 640px) {
          .menu-marquee-track { gap: 1.25rem; }
        }
        .menu-marquee-track:hover { animation-play-state: paused; }
      `}</style>

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
            <span className="text-[color:var(--color-forest-deep)]/65">
              {t({ th: "อาหาร & เครื่องดื่ม", en: "Food & Drinks" })}
            </span>
          </div>

          <h2
            className="font-display text-[22px] sm:text-[30px] lg:text-[38px] leading-[1.15] text-[color:var(--color-forest-deep)] lg:whitespace-nowrap"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t({
              th: "ครัว คาเฟ่ และมื้อค่ำริมลำธาร",
              en: "Kitchen, cafe and dinner by the stream",
            })}
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
          {t({
            th: "อาหารเช้ารวมในแพ็กเกจ · อาหารตามสั่ง คาเฟ่ และหมูกระทะ สั่งเพิ่มได้ทาง Line @landcamp",
            en: "Breakfast included with every stay · Thai à la carte, cafe and moo krata available on order via Line @landcamp.",
          })}
        </motion.p>
      </div>

      <AnimatePresence>
        {menuOpen && <FullMenuModal onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}

function MarqueeRow({
  images,
  duration,
  boost,
}: {
  images: MenuImage[];
  duration: number;
  boost: number;
}) {
  // Duplicate so loop is seamless
  const items = useMemo(() => [...images, ...images], [images]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const anims = el.getAnimations();
    if (anims.length === 0) return;
    anims[0].playbackRate = boost;
  }, [boost]);

  // Seek the running marquee animation by ~1/8 of the loop per click.
  // The animation is set to iterate infinitely with duration in ms — modulo it
  // back into range so the loop never jumps to a hard edge.
  const nudge = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const anim = el.getAnimations()[0];
    if (!anim) return;
    const timing = anim.effect?.getComputedTiming();
    const durMs = typeof timing?.duration === "number" ? timing.duration : duration * 1000;
    const step = durMs / 8;
    const cur = typeof anim.currentTime === "number" ? anim.currentTime : 0;
    const next = ((cur + direction * step) % durMs + durMs) % durMs;
    anim.currentTime = next;
  };

  return (
    <div className="relative overflow-hidden group/row">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 z-10 bg-gradient-to-r from-[color:var(--color-bone)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 z-10 bg-gradient-to-l from-[color:var(--color-bone)] to-transparent"
      />

      {/* Nav buttons */}
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Scroll left"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[color:var(--color-forest-deep)]/85 backdrop-blur-md text-[color:var(--color-bone)] flex items-center justify-center shadow-[0_8px_22px_-8px_rgba(0,0,0,0.4)] opacity-70 sm:opacity-0 group-hover/row:opacity-100 hover:bg-[color:var(--color-warm-clay)] transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Scroll right"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[color:var(--color-forest-deep)]/85 backdrop-blur-md text-[color:var(--color-bone)] flex items-center justify-center shadow-[0_8px_22px_-8px_rgba(0,0,0,0.4)] opacity-70 sm:opacity-0 group-hover/row:opacity-100 hover:bg-[color:var(--color-warm-clay)] transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div
        ref={trackRef}
        className="menu-marquee-track"
        style={{ animationDuration: `${duration}s` }}
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
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
