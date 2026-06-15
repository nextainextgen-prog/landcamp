"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { rooms } from "@/data/rooms";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Room } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

export function RoomsSection() {
  const t = useT();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = activeRoom ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeRoom]);

  return (
    <section
      id="rooms"
      aria-label={t({ th: "ห้องพักทั้งหมด", en: "All Rooms" })}
      className="relative bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      {/* Subtle texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Eyebrow + Thai section intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <div
            className="flex items-center gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.42em]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span className="text-[color:var(--color-warm-clay)]">04</span>
            <span aria-hidden className="h-px w-10 bg-[color:var(--color-bone)]/40" />
            <span className="text-[color:var(--color-bone)]/65">
              {t({ th: "ห้องพัก", en: "Rooms" })}
            </span>
          </div>

          <h2 className="font-display text-[32px] sm:text-[42px] lg:text-[52px] leading-[1.05] text-[color:var(--color-bone)] max-w-3xl">
            {t({
              th: "เลือกห้องพักของคุณ",
              en: "Choose your stay",
            })}
          </h2>
          <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[color:var(--color-bone)]/70">
            {t({
              th: "4 รูปแบบที่พัก พร้อมจองออนไลน์ — เลือกห้องที่ใช่สำหรับคุณ ดูภาพเพิ่มเติม หรือจองทันทีผ่าน Line",
              en: "Four stay styles — explore photos, pick the one that fits, and book instantly via Line.",
            })}
          </p>
        </motion.div>

        {/* ──────────────────────────────────
            2x2 grid of room cards — stacked layers, big image
            ────────────────────────────────── */}
        <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 lg:gap-10">
          {rooms.map((room, i) => (
            <motion.article
              key={room.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className="relative bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-[22px] overflow-hidden group flex flex-col shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]"
            >
              {/* Layer 1 — auto-cycling image carousel */}
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <RoomCardCarousel
                  images={room.images}
                  alt={(img) => t(img.alt)}
                  intervalMs={4000}
                />

                {/* Number badge */}
                <span
                  className="absolute top-4 right-4 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-[color:var(--color-bone)]/95 backdrop-blur-md text-[color:var(--color-forest-deep)] font-display text-xl shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)]"
                  aria-hidden
                >
                  {i + 1}
                </span>

                {/* Sleeps pill */}
                <span
                  className="absolute top-4 left-4 z-10 bg-[color:var(--color-forest-deep)]/85 backdrop-blur-md text-[color:var(--color-bone)] px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({
                    th: `พักได้ ${room.maxGuests}`,
                    en: `Sleeps ${room.maxGuests}`,
                  })}
                </span>
              </div>

              {/* Layer 2 — content body */}
              <div className="flex flex-col gap-4 p-6 sm:p-7 lg:p-8">
                <header className="flex items-baseline justify-between gap-4 border-b border-[color:var(--color-ink)]/10 pb-4">
                  <h3 className="font-display text-[26px] sm:text-[28px] lg:text-[32px] text-[color:var(--color-forest-deep)] leading-tight">
                    {t(room.name)}
                  </h3>
                  <span
                    className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-warm-clay)] whitespace-nowrap"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({
                      th: `${room.priceWeekday.toLocaleString()} ฿ / คืน`,
                      en: `THB ${room.priceWeekday.toLocaleString()} / nt`,
                    })}
                  </span>
                </header>

                <p className="text-sm sm:text-[15px] leading-[1.65] text-[color:var(--color-ink)]/75 line-clamp-3">
                  {t(room.description)}
                </p>

                {/* Layer 3 — clear, prominent action buttons */}
                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRoom(room)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-[color:var(--color-forest-deep)] text-[color:var(--color-forest-deep)] px-5 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({ th: "ดูรายละเอียด", en: "View Details" })}
                  </button>
                  <a
                    href={siteConfig.contact.lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-5 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-forest-deep)] transition-colors duration-300 shadow-[0_8px_20px_-8px_rgba(178,108,80,0.6)]"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {t({ th: "จองเลย", en: "Book Now" })}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────
          Detail modal — opens straight to gallery
          ────────────────────────────────── */}
      <AnimatePresence>
        {activeRoom && <RoomModal room={activeRoom} onClose={() => setActiveRoom(null)} />}
      </AnimatePresence>
    </section>
  );
}

/* ──────────────────────────────────────────
   Auto-rotating image carousel for room cards.
   Crossfades through all images on a fixed
   interval; pauses while hovered.
   ────────────────────────────────────────── */
function RoomCardCarousel({
  images,
  alt,
  intervalMs,
}: {
  images: Room["images"];
  alt: (img: Room["images"][number]) => string;
  intervalMs: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, images.length, intervalMs]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="absolute inset-0"
        >
          <Image
            src={images[index].src}
            alt={alt(images[index])}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 45vw"
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === index
                  ? "w-5 bg-[color:var(--color-bone)]"
                  : "w-1 bg-[color:var(--color-bone)]/55",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Room Detail Modal — gallery-first
   ────────────────────────────────────────── */
function RoomModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const t = useT();
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox !== null) setLightbox(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, lightbox]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[color:var(--color-forest-night)]/80 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative w-full sm:max-w-5xl max-h-[92vh] bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-t-[20px] sm:rounded-[20px] overflow-hidden flex flex-col"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-[color:var(--color-bone)]/95 backdrop-blur-md flex items-center justify-center hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]"
        >
          <span aria-hidden className="relative block h-5 w-5">
            <span className="absolute inset-0 m-auto h-px w-4 bg-current rotate-45" />
            <span className="absolute inset-0 m-auto h-px w-4 bg-current -rotate-45" />
          </span>
        </button>

        <div className="overflow-y-auto">
          {/* Title bar */}
          <header className="px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 pb-4 border-b border-[color:var(--color-ink)]/10">
            <span
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              LandCamp · {room.type.replace("-", " ")}
            </span>
            <h3
              id="room-modal-title"
              className="mt-2 font-display text-3xl sm:text-4xl text-[color:var(--color-forest-deep)] leading-tight"
            >
              {t(room.name)}
            </h3>
            <p
              className="mt-2 text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/55"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "พักได้", en: "Sleeps" })} {room.maxGuests} ·{" "}
              {t({ th: "เริ่มต้น", en: "From" })}{" "}
              {room.priceWeekday.toLocaleString()}{" "}
              {t({ th: "บาท / คืน", en: "THB / night" })}
            </p>
          </header>

          {/* Gallery — additional images shown immediately */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {room.images.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setLightbox(i)}
                  className={cn(
                    "relative overflow-hidden rounded-[14px] bg-[color:var(--color-bone-soft)] group/img",
                    i === 0 ? "col-span-2 sm:col-span-2 row-span-2 aspect-[4/3]" : "aspect-square",
                  )}
                >
                  <Image
                    src={img.src}
                    alt={t(img.alt)}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-[1.04]"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <footer className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 flex flex-col sm:flex-row gap-3">
            <a
              href={siteConfig.contact.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-warm-clay)] transition-colors duration-500"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "จองห้องนี้ผ่าน Line", en: "Reserve this room" })}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-ink)]/20 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-ink)]/5 transition-colors"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "ปิดหน้าต่าง", en: "Close" })}
            </button>
          </footer>
        </div>
      </motion.div>

      {/* Lightbox for full-size image */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <div className="absolute inset-0 bg-black/90" />
            <button
              type="button"
              aria-label="Close image"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/95 flex items-center justify-center hover:bg-[color:var(--color-warm-clay)] transition-colors"
            >
              <span aria-hidden className="relative block h-5 w-5">
                <span className="absolute inset-0 m-auto h-px w-4 bg-current rotate-45" />
                <span className="absolute inset-0 m-auto h-px w-4 bg-current -rotate-45" />
              </span>
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="relative w-full max-w-5xl aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={room.images[lightbox].src}
                alt={t(room.images[lightbox].alt)}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
