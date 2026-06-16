"use client";

import type { SVGProps } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useT } from "@/app/providers";
import { StatCounter } from "@/components/ui/StatCounter";
import type { CarouselSlide } from "@/components/ui/StoryCarousel";
import { cn } from "@/lib/cn";

const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

function VillaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4.5 14.5 16 5l11.5 9.5" />
      <path d="M7 13.5V27h18V13.5" />
      <path d="M13 27v-6.5h6V27" />
      <path d="M20.5 17.5h2.5" />
    </svg>
  );
}

function StylesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <rect x="18" y="5" width="9" height="9" rx="1.5" />
      <rect x="5" y="18" width="9" height="9" rx="1.5" />
      <rect x="18" y="18" width="9" height="9" rx="1.5" />
    </svg>
  );
}

function MountainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 26 11 13l5 8 3-4.5 7.5 9.5Z" />
      <circle cx="22" cy="9" r="1.8" />
    </svg>
  );
}

function StarOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="m16 4 3.8 7.7 8.5 1.2-6.15 6 1.5 8.5L16 23.4 8.35 27.4l1.5-8.5-6.15-6 8.5-1.2L16 4Z" />
    </svg>
  );
}

function WifiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 13.5a17 17 0 0 1 24 0" />
      <path d="M8 18a11 11 0 0 1 16 0" />
      <path d="M12 22.5a5 5 0 0 1 8 0" />
      <circle cx="16" cy="27" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BreakfastIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M7.5 5v3.5" />
      <path d="M10 5v3.5" />
      <path d="M12.5 5v3.5" />
      <path d="M10 8.5V13" />
      <path d="M22.5 5c-1.6 1.5-1.6 5 0 6.5" />
      <path d="M22.5 11.5V13" />
      <circle cx="16" cy="20.5" r="8.5" />
      <circle cx="16" cy="20.5" r="5" />
    </svg>
  );
}

type Stat = {
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  label: { th: string; en: string };
  value?: number;
  decimals?: number;
  unit?: { th: string; en: string };
  badge?: { th: string; en: string };
};

const STATS: Stat[] = [
  {
    value: 6,
    label: { th: "ห้องพักไพรเวท", en: "Private villas" },
    Icon: VillaIcon,
  },
  {
    value: 4,
    label: { th: "รูปแบบที่พัก", en: "Stay styles" },
    Icon: StylesIcon,
  },
  {
    value: 12.6,
    decimals: 1,
    unit: { th: "กม.", en: "KM" },
    label: { th: "จากเขาใหญ่", en: "From Khao Yai gate" },
    Icon: MountainIcon,
  },
  {
    value: 4.8,
    decimals: 1,
    unit: { th: "/ 5", en: "/ 5" },
    label: { th: "Google Rating", en: "Google rating" },
    Icon: StarOutlineIcon,
  },
  {
    badge: { th: "ฟรี", en: "Free" },
    label: { th: "ไวไฟทุกห้อง", en: "Wi-Fi in every villa" },
    Icon: WifiIcon,
  },
  {
    badge: { th: "ฟรี", en: "Free" },
    label: { th: "อาหารเช้า", en: "Breakfast included" },
    Icon: BreakfastIcon,
  },
];

type StorySlide = CarouselSlide & { orientation: "landscape" | "portrait" };

const STORY_SLIDES: StorySlide[] = [
  {
    src: "/images/about/story/01-bathroom.jpg",
    alt: "Indoor freestanding bathtub with garden window view",
    title: { th: "อ่างแช่ริมสวน", en: "Tub by the Garden" },
    subtitle: { th: "Indoor Soaking · Wood Cabin", en: "Indoor Soaking · Wood Cabin" },
    rating: 5,
    orientation: "landscape",
  },
  {
    src: "/images/about/story/02-camper-dusk.jpg",
    alt: "Silver Camper Van and stone garden at dusk surrounded by pines",
    title: { th: "ค่ำคืนรอบกองไฟ", en: "Sunset Firepit" },
    subtitle: { th: "Camper Van · Pine Grove", en: "Camper Van · Pine Grove" },
    rating: 5,
    orientation: "landscape",
  },
  {
    src: "/images/about/story/03-bedroom.jpg",
    alt: "Glass villa bedroom with floor-to-ceiling windows facing the garden",
    title: { th: "วิลล่ากระจกริมสวน", en: "Glass Villa" },
    subtitle: { th: "Floor-to-Ceiling Glass", en: "Floor-to-Ceiling Glass" },
    rating: 5,
    orientation: "landscape",
  },
  {
    src: "/images/about/story/04-wedding.png",
    alt: "Outdoor wedding setup with long wooden table and white floral arches",
    title: { th: "งานแต่งกลางสวน", en: "Garden Weddings" },
    subtitle: { th: "Open-air · Long Table", en: "Open-air · Long Table" },
    rating: 5,
    orientation: "portrait",
  },
  {
    src: "/images/about/story/05-stone-villa.png",
    alt: "Stone-clad villa beside a natural stream with wooden bridge",
    title: { th: "วิลล่าหินกลางป่า", en: "Stone Villa" },
    subtitle: { th: "Stream-side · Stone Walls", en: "Stream-side · Stone Walls" },
    rating: 5,
    orientation: "landscape",
  },
  {
    src: "/images/about/story/06-garden-chairs.png",
    alt: "Wooden dining set under olive trees in front of stone villa at dusk",
    title: { th: "มื้อค่ำใต้ต้นไม้", en: "Dinner Under Trees" },
    subtitle: { th: "Garden Table · Lantern Light", en: "Garden Table · Lantern Light" },
    rating: 5,
    orientation: "portrait",
  },
  {
    src: "/images/about/story/07-outdoor-tub.png",
    alt: "Outdoor wooden bath with string lights overhead",
    title: { th: "อ่างแช่กลางแจ้ง", en: "Outdoor Soak" },
    subtitle: { th: "Cedar Walls · String Lights", en: "Cedar Walls · String Lights" },
    rating: 5,
    orientation: "landscape",
  },
];

export function AboutSection() {
  const t = useT();

  return (
    <section
      id="about"
      aria-label={t({ th: "เรื่องราวของแลนด์แคมป์", en: "About LandCamp" })}
      className="relative bg-[color:var(--color-bone)] pt-16 sm:pt-20 lg:pt-24 pb-24 sm:pb-32 lg:pb-40 overflow-hidden"
    >
      {/* Soft noise texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* ──────────────────────────────────────
            Header — eyebrow only
            ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.9, ease: EASE_SOFT }}
          className="flex items-center gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.42em]"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <span className="text-[color:var(--color-warm-clay)]">02</span>
          <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/40" />
          <span className="text-[color:var(--color-forest-deep)]/65">
            {t({ th: "เรื่องราวของเรา", en: "Brand Story" })}
          </span>
        </motion.div>

        {/* ──────────────────────────────────────
            Stats — icon row, replacing the headline
            ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-2% 0px" }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 0.1 }}
          className="mt-10 sm:mt-12 lg:mt-14 grid grid-cols-2 md:grid-cols-6 gap-y-12 md:gap-y-0 border-t border-b border-[color:var(--color-ink)]/12 py-10 sm:py-12"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-2% 0px" }}
                transition={{
                  duration: 0.7,
                  ease: EASE_SOFT,
                  delay: 0.15 + i * 0.07,
                }}
                className={cn(
                  "group flex flex-col items-center text-center px-3 sm:px-4",
                  i % 2 === 1
                    ? "border-l border-[color:var(--color-ink)]/12"
                    : "",
                  i > 0
                    ? "md:border-l md:border-[color:var(--color-ink)]/12"
                    : "md:border-l-0",
                )}
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-[color:var(--color-forest-deep)]/70 transition-colors duration-500 group-hover:text-[color:var(--color-warm-clay)]" />
                <div className="mt-4 flex items-baseline gap-1.5 text-[color:var(--color-forest-deep)]">
                  <span
                    className="font-display text-[36px] sm:text-[44px] lg:text-5xl leading-none"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {stat.value !== undefined ? (
                      <StatCounter value={stat.value} decimals={stat.decimals ?? 0} />
                    ) : stat.badge ? (
                      t(stat.badge)
                    ) : null}
                  </span>
                  {stat.unit && (
                    <span
                      className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-forest-deep)]/65"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {t(stat.unit)}
                    </span>
                  )}
                </div>
                <span
                  className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/55"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t(stat.label)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Description — sits between stats and image grid */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 0.1 }}
          className="mt-10 sm:mt-12 max-w-2xl text-[15px] sm:text-base leading-relaxed text-[color:var(--color-ink)]/70"
        >
          {t({
            th: "วิลล่าสไตล์ Glamping 6 หลัง ใจกลางขุนเขาเขาใหญ่ ทุกหลังคัดสรรอย่างพิถีพิถัน เพื่อให้คุณได้พักผ่อนอย่างเป็นส่วนตัวที่สุด พร้อมประสบการณ์ที่เหนือกว่าโรงแรมทั่วไป",
            en: "Six glamping villas tucked into the forests of Khao Yai — each thoughtfully crafted to deliver privacy, calm, and an experience that goes beyond an ordinary stay.",
          })}
        </motion.p>

        {/* ──────────────────────────────────────
            Story grid — images sized to fit their natural orientation,
            staggered pop-in reveal as the user scrolls into view.
            Portrait cards span 2 rows; landscape cards auto-fill the
            remaining slots via grid-auto-flow: dense.
            ────────────────────────────────────── */}
        <div className="mt-12 sm:mt-14 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 lg:[grid-auto-flow:dense]">
          {STORY_SLIDES.map((slide, i) => (
            <motion.figure
              key={slide.src}
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 16,
                mass: 0.9,
                delay: 0.08 + i * 0.1,
              }}
              className={cn(
                "group",
                slide.orientation === "portrait" && "lg:row-span-2",
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-[1.25rem] bg-[color:var(--color-bone-soft)] shadow-[0_24px_55px_-26px_rgba(0,0,0,0.35)]",
                  slide.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[3/2]",
                )}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <figcaption className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl text-[color:var(--color-forest-deep)] leading-tight">
                    {t(slide.title)}
                  </h3>
                  <p
                    className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/55"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t(slide.subtitle)}
                  </p>
                </div>
                {slide.rating && (
                  <span
                    className="shrink-0 text-[#F5B400] text-sm tracking-widest drop-shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                    aria-label={`${slide.rating} stars`}
                  >
                    {"★".repeat(slide.rating)}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>

      </div>
    </section>
  );
}
