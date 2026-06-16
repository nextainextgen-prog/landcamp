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
import Image from "next/image";

const EASE = [0.22, 1, 0.36, 1] as const;

// 35 atmosphere photos
const ATMOSPHERE_IMAGES: { src: string; alt: string }[] = [
  { src: "/images/atmosphere/atmosphere-01.jpeg", alt: "Aerial view of Camper Van deck and stone garden" },
  { src: "/images/atmosphere/atmosphere-02.jpeg", alt: "Sunset deck at Camper Van" },
  { src: "/images/atmosphere/atmosphere-03.jpeg", alt: "Stone fire pit beside the Camper Van at dusk" },
  { src: "/images/atmosphere/atmosphere-04.png", alt: "Camper Van bedroom interior" },
  { src: "/images/atmosphere/atmosphere-05.png", alt: "Marshall speaker corner inside the Camper Van" },
  { src: "/images/atmosphere/atmosphere-06.png", alt: "Bathtub with garden window view" },
  { src: "/images/atmosphere/atmosphere-07.jpeg", alt: "Camper Train deck with lounge chairs" },
  { src: "/images/atmosphere/atmosphere-08.jpeg", alt: "Guest sitting on the Camper Van deck at sunset" },
  { src: "/images/atmosphere/atmosphere-09.jpeg", alt: "Outdoor bath with pine view" },
  { src: "/images/atmosphere/atmosphere-10.jpeg", alt: "Couple walking on stone path through the pines" },
  { src: "/images/atmosphere/atmosphere-11.jpeg", alt: "Aerial view of LandCamp gardens" },
  { src: "/images/atmosphere/atmosphere-12.png", alt: "Outdoor cedar soaking tub" },
  { src: "/images/atmosphere/atmosphere-13.jpeg", alt: "Camper Train at golden hour" },
  { src: "/images/atmosphere/atmosphere-14.jpeg", alt: "Outdoor tub beside the lake" },
  { src: "/images/atmosphere/atmosphere-15.jpeg", alt: "Glass villa bedroom with garden view" },
  { src: "/images/atmosphere/atmosphere-16.jpeg", alt: "Marshall speaker on bedside" },
  { src: "/images/atmosphere/atmosphere-17.jpeg", alt: "Marble bathroom with shower" },
  { src: "/images/atmosphere/atmosphere-18.jpeg", alt: "Glass villa bedroom" },
  { src: "/images/atmosphere/atmosphere-19.jpeg", alt: "Stone villa exterior with adirondack chairs" },
  { src: "/images/atmosphere/atmosphere-20.jpeg", alt: "Garden path through the property" },
  { src: "/images/atmosphere/atmosphere-21.jpeg", alt: "Cabana with shade sail" },
  { src: "/images/atmosphere/atmosphere-22.jpeg", alt: "Lawn and pine grove" },
  { src: "/images/atmosphere/atmosphere-23.jpeg", alt: "Aerial view of stone fire pit area" },
  { src: "/images/atmosphere/atmosphere-24.jpeg", alt: "Camper Van bedroom living space" },
  { src: "/images/atmosphere/atmosphere-25.jpeg", alt: "Wood-paneled bathroom with shower" },
  { src: "/images/atmosphere/atmosphere-26.jpeg", alt: "Master bedroom interior" },
  { src: "/images/atmosphere/atmosphere-27.png", alt: "Sofa with linen pillows in living area" },
  { src: "/images/atmosphere/atmosphere-28.jpeg", alt: "Linen sofa beside window" },
  { src: "/images/atmosphere/atmosphere-29.jpeg", alt: "Bathroom with freestanding tub and garden view" },
  { src: "/images/atmosphere/atmosphere-30.jpeg", alt: "Dining and living area" },
  { src: "/images/atmosphere/atmosphere-31.jpeg", alt: "Stone villa with stream" },
  { src: "/images/atmosphere/atmosphere-32.jpeg", alt: "Guest by adirondack chairs at golden hour" },
  { src: "/images/atmosphere/atmosphere-33.jpeg", alt: "Marshall speaker on side table" },
  { src: "/images/atmosphere/atmosphere-34.jpeg", alt: "Bathroom interior" },
  { src: "/images/atmosphere/atmosphere-35.jpeg", alt: "Camper Van interior in evening light" },
];

export function GallerySection() {
  const t = useT();
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const rowOne = useMemo(() => ATMOSPHERE_IMAGES.slice(0, 18), []);
  const rowTwo = useMemo(() => ATMOSPHERE_IMAGES.slice(18), []);

  // Hidden scroll-to-accelerate — page scroll velocity boosts marquee speed.
  // Springs decay smoothly back to base speed when the user stops scrolling.
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothed = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 280,
    mass: 0.3,
  });
  const [boost, setBoost] = useState(1);
  useMotionValueEvent(smoothed, "change", (v) => {
    // Map |velocity px/s| → playbackRate boost (1× idle, up to ~5×)
    const next = 1 + Math.min(Math.abs(v) / 600, 4);
    setBoost(next);
  });

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      id="atmosphere"
      aria-label={t({ th: "บรรยากาศของแลนด์แคมป์", en: "LandCamp Atmosphere" })}
      className="relative bg-[color:var(--color-bone)] py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* Marquee animation keyframes */}
      <style jsx global>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: marquee-left linear infinite;
        }
        @media (min-width: 640px) {
          .marquee-track { gap: 1.25rem; }
        }
        .marquee-track:hover { animation-play-state: paused; }
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
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span className="text-[color:var(--color-warm-clay)]">03</span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--color-forest-deep)]/40" />
            <span className="text-[color:var(--color-forest-deep)]/65">
              {t({ th: "บรรยากาศ", en: "Atmosphere" })}
            </span>
          </div>

          <h2
            className="font-display text-[26px] sm:text-[34px] lg:text-[42px] leading-[1.1] text-[color:var(--color-forest-deep)] max-w-xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t({
              th: "ทุกมุมที่นี่ออกแบบไว้ให้คุณเก็บลงในเฟรม",
              en: "Every corner here was designed to be photographed",
            })}
          </h2>
        </motion.div>
      </div>

      {/* Marquee rows — full bleed */}
      <div className="mt-10 sm:mt-14 flex flex-col gap-4 sm:gap-5">
        {/* Row 1 — scrolls left */}
        <MarqueeRow
          images={rowOne}
          duration={70}
          boost={boost}
          onClick={(img) => setLightbox(img)}
        />

        {/* Row 2 — scrolls left, slightly slower for parallax feel */}
        <MarqueeRow
          images={rowTwo}
          duration={90}
          boost={boost}
          onClick={(img) => setLightbox(img)}
        />
      </div>


      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10"
            onClick={() => setLightbox(null)}
          >
            <div className="absolute inset-0 bg-[color:var(--color-forest-night)]/92 backdrop-blur-xl" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close lightbox"
                className="absolute -top-12 right-0 h-10 w-10 rounded-full border border-[color:var(--color-bone)]/30 text-[color:var(--color-bone)] hover:bg-[color:var(--color-bone)]/10 transition-colors flex items-center justify-center"
              >
                <span aria-hidden className="relative block h-4 w-4">
                  <span className="absolute inset-0 m-auto h-px w-4 bg-current rotate-45" />
                  <span className="absolute inset-0 m-auto h-px w-4 bg-current -rotate-45" />
                </span>
              </button>

              <div className="relative w-full aspect-[4/3] rounded-[12px] overflow-hidden bg-[color:var(--color-forest-night)]">
                <Image
                  src={lightbox.src}
                  alt={lightbox.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MarqueeRow({
  images,
  duration,
  boost,
  onClick,
}: {
  images: { src: string; alt: string }[];
  duration: number;
  boost: number;
  onClick: (img: { src: string; alt: string }) => void;
}) {
  // Duplicate the list so the loop appears seamless
  const items = [...images, ...images];
  const trackRef = useRef<HTMLDivElement>(null);

  // Drive Web Animation playbackRate — buttery smooth, no animation-duration jumps
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const anims = el.getAnimations();
    if (anims.length === 0) return;
    anims[0].playbackRate = boost;
  }, [boost]);

  return (
    <div className="relative overflow-hidden">
      {/* Edge fade masks */}
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
        className="marquee-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            onClick={() => onClick(img)}
            className="relative flex-shrink-0 h-[200px] sm:h-[240px] lg:h-[280px] w-[260px] sm:w-[320px] lg:w-[380px] overflow-hidden rounded-[14px] bg-[color:var(--color-bone-soft)] group cursor-zoom-in"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 260px, (max-width: 1024px) 320px, 380px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
