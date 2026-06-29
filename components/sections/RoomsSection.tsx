"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { rooms as staticRooms } from "@/data/rooms";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { BookingModal } from "@/components/booking/BookingModal";
import { loadBookingIntent, type BookingIntent } from "@/lib/booking/intent";
import { PUBLIC_BOOKING_ENABLED } from "@/lib/features";
import type { RoomBooking } from "@/lib/rooms/booked";
import type { Room } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const COVER_DURATION_MS = 5000;
const SLIDE_DURATION_MS = 4000;

export function RoomsSection({
  rooms = staticRooms,
  booking,
}: {
  rooms?: Room[];
  /** Per-slug roomId + occupied nights, prefetched server-side so the booking
   *  calendar shows blocked dates instantly (no open-then-flicker-to-full). */
  booking?: Record<string, RoomBooking>;
}) {
  const t = useT();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingIntent, setBookingIntent] = useState<BookingIntent | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Carousel timers only start once the section enters the viewport.
  const inView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    document.body.style.overflow = activeRoom ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeRoom]);

  // After a Google OAuth round-trip we land back here; reopen the booking
  // modal for the room the guest was mid-way through, pre-filled. Deferred to
  // a macrotask so state isn't set synchronously in the effect and the open
  // happens after hydration settles (no SSR mismatch).
  useEffect(() => {
    if (!PUBLIC_BOOKING_ENABLED) return;
    const intent = loadBookingIntent();
    if (!intent) return;
    const room = rooms.find((r) => r.id === intent.slug);
    if (!room) return;
    const id = window.setTimeout(() => {
      setBookingIntent(intent);
      setBookingRoom(room);
    }, 0);
    return () => window.clearTimeout(id);
  }, [rooms]);

  function openBooking(room: Room) {
    setBookingIntent(null);
    setBookingRoom(room);
  }

  function closeBooking() {
    setBookingRoom(null);
    setBookingIntent(null);
  }

  return (
    <section
      ref={sectionRef}
      id="rooms"
      aria-label={t({ th: "ห้องพักทั้งหมด", en: "All Rooms" })}
      className="relative bg-[color:var(--color-bone)] text-[color:var(--color-ink)] py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <div
            className="flex items-center gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.42em]"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <span className="text-[color:var(--color-warm-clay)]">04</span>
            <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/35" />
            <span className="text-[color:var(--color-forest-deep)]/65">
              {t({ th: "ห้องพัก", en: "Rooms" })}
            </span>
          </div>

          <h2 className="font-display text-[32px] sm:text-[42px] lg:text-[52px] leading-[1.05] text-[color:var(--color-forest-deep)] max-w-3xl">
            {t({
              th: "เลือกห้องพักของคุณ",
              en: "Choose your stay",
            })}
          </h2>
          <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[color:var(--color-ink)]/70">
            {t({
              th: "6 หลังให้เลือก — ดูภาพห้องเลื่อนอัตโนมัติ กดเข้าไปดูรายละเอียดทั้งหมด หรือจองออนไลน์ได้ทันที",
              en: "Six villas to choose from — photos auto-slide on each card, tap any to see the full details or book online instantly.",
            })}
          </p>
        </motion.div>

        <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 lg:gap-10">
          {rooms.map((room, i) => (
            <motion.article
              key={room.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className="relative bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-[22px] overflow-hidden group flex flex-col ring-1 ring-[color:var(--color-forest-deep)]/8 shadow-[0_20px_45px_-22px_rgba(45,55,40,0.28)]"
            >
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <RoomCardCarousel
                  images={room.images}
                  alt={(img) => t(img.alt)}
                  started={inView}
                  cardIndex={i}
                />

                <span
                  className="absolute top-4 right-4 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-[color:var(--color-bone)]/95 backdrop-blur-md text-[color:var(--color-forest-deep)] font-display text-xl shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)]"
                  aria-hidden
                >
                  {i + 1}
                </span>

                <span
                  className="absolute top-4 left-4 z-10 bg-[color:var(--color-forest-deep)]/85 backdrop-blur-md text-[color:var(--color-bone)] px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {t({
                    th: `พักได้ ${room.maxGuests} ท่าน`,
                    en: `Sleeps ${room.maxGuests}`,
                  })}
                </span>

                {room.badge && t(room.badge).trim() && (
                  <span
                    className="absolute bottom-4 left-4 z-10 rounded-full bg-[color:var(--color-warm-clay)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.4)]"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {t(room.badge)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 p-6 sm:p-7 lg:p-8">
                <header className="flex items-baseline justify-between gap-4 border-b border-[color:var(--color-ink)]/10 pb-4">
                  <h3 className="font-display text-[26px] sm:text-[28px] lg:text-[32px] text-[color:var(--color-forest-deep)] leading-tight">
                    {t(room.name)}
                  </h3>
                  <span
                    className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-warm-clay)] whitespace-nowrap"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {t({
                      th: `${room.priceWeekday.toLocaleString("en-US")} ฿ / คืน`,
                      en: `THB ${room.priceWeekday.toLocaleString("en-US")} / nt`,
                    })}
                  </span>
                </header>

                <p className="text-sm sm:text-[15px] leading-[1.65] text-[color:var(--color-ink)]/75 line-clamp-3">
                  {t(room.description)}
                </p>

                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRoom(room)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-[color:var(--color-forest-deep)] text-[color:var(--color-forest-deep)] px-5 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-forest-deep)] hover:text-[color:var(--color-bone)] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {t({ th: "ดูรายละเอียด", en: "View Details" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => openBooking(room)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-5 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[color:var(--color-forest-deep)] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {t({ th: "จองเลย", en: "Book Now" })}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeRoom && (
          <RoomModal
            room={activeRoom}
            onClose={() => setActiveRoom(null)}
            onBook={() => {
              const r = activeRoom;
              setActiveRoom(null);
              openBooking(r);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingRoom && (
          <BookingModal
            room={bookingRoom}
            initialIntent={bookingIntent}
            initialBooking={booking?.[bookingRoom.id]}
            onClose={closeBooking}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ──────────────────────────────────────────
   Auto-sliding carousel.
   Cover image holds for COVER_DURATION_MS (5s)
   from the moment the section enters the viewport;
   each subsequent image holds for SLIDE_DURATION_MS (4s).
   New images slide in from the right.
   ────────────────────────────────────────── */
function RoomCardCarousel({
  images,
  alt,
  started,
  cardIndex,
}: {
  images: Room["images"];
  alt: (img: Room["images"][number]) => string;
  started: boolean;
  cardIndex: number;
}) {
  const [index, setIndex] = useState(0);
  // The 5s cover hold only applies to the first viewing of the cover —
  // after the carousel leaves index 0, all subsequent slides (including
  // wrap-around back to index 0) follow the standard 4s cadence.
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
            alt={alt(images[index])}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 45vw"
            className="object-cover"
            priority={index === 0 && cardIndex < 2}
          />
        </motion.div>
      </AnimatePresence>

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
   Room Detail Modal — comprehensive spec view
   ────────────────────────────────────────── */
function RoomModal({
  room,
  onClose,
  onBook,
}: {
  room: Room;
  onClose: () => void;
  onBook: () => void;
}) {
  const t = useT();
  const [lightbox, setLightbox] = useState<number | null>(null);

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
          <header className="px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 pb-5 border-b border-[color:var(--color-ink)]/10">
            <span
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              LandCamp · {t({ th: "รายละเอียดห้องพัก", en: "Room details" })}
            </span>
            <h3
              id="room-modal-title"
              className="mt-2 font-display text-3xl sm:text-4xl text-[color:var(--color-forest-deep)] leading-tight"
            >
              {t(room.name)}
            </h3>
            <p
              className="mt-2 text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/55"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "เริ่มต้นที่", en: "From" })}{" "}
              <span className="text-[color:var(--color-warm-clay)] font-medium">
                {room.startingPrice.toLocaleString("en-US")}
              </span>{" "}
              {t({ th: "บาท / คืน", en: "THB / night" })}
            </p>
          </header>

          {/* ── Spec block ─────────────────────────── */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 border-b border-[color:var(--color-ink)]/10">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "ข้อมูลห้องพัก", en: "Room information" })}
            </h4>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm leading-relaxed">
              <SpecRow
                label={t({ th: "เช็คอิน", en: "Check-in" })}
                value={`${room.checkIn} ${t({ th: "น.", en: "" })}`.trim()}
              />
              <SpecRow
                label={t({ th: "เช็คเอาท์", en: "Check-out" })}
                value={`${room.checkOut} ${t({ th: "น.", en: "" })}`.trim()}
              />
              <SpecRow
                label={t({ th: "จำนวนผู้เข้าพัก", en: "Guests" })}
                value={t({
                  th: `${room.maxGuests} ท่าน`,
                  en: `${room.maxGuests} guests`,
                })}
              />
              <SpecRow label={t({ th: "ขนาดเตียง", en: "Bed size" })} value={t(room.bedSize)} />
              <SpecRow label={t({ th: "ขนาดห้อง", en: "Room size" })} value={t(room.roomSize)} />
              {room.layout && (
                <SpecRow
                  label={t({ th: "พื้นที่ห้อง", en: "Layout" })}
                  value={t(room.layout)}
                />
              )}
              <SpecRow
                label={t({ th: "อาหารเช้า", en: "Breakfast" })}
                value={t(room.breakfastIncluded)}
              />
              <SpecRow
                label={t({ th: "ราคาวันธรรมดา", en: "Weekday rate" })}
                value={t({
                  th: `${room.priceWeekday.toLocaleString("en-US")} บาท / คืน`,
                  en: `THB ${room.priceWeekday.toLocaleString("en-US")} / night`,
                })}
              />
              <SpecRow
                label={t({ th: "ราคาวันหยุด", en: "Weekend rate" })}
                value={t({
                  th: `${room.priceWeekend.toLocaleString("en-US")} บาท / คืน`,
                  en: `THB ${room.priceWeekend.toLocaleString("en-US")} / night`,
                })}
              />
            </dl>
          </div>

          {/* ── Services block ──────────────────────── */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 border-b border-[color:var(--color-ink)]/10">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "บริการ", en: "Services" })}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm leading-relaxed">
              {room.services.map((s, i) => (
                <li key={i} className="flex items-center gap-3.5 text-[color:var(--color-ink)]/85">
                  <ServiceIcon index={i} />
                  <span>{t(s)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Extra bed ──────────────────────────── */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 border-b border-[color:var(--color-ink)]/10">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-3"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "ค่าเตียงเสริม", en: "Extra bed" })}
            </h4>
            <p className="text-sm leading-relaxed text-[color:var(--color-ink)]/85">
              {t(room.extraBed)}
            </p>
          </div>

          {/* ── House rules ────────────────────────── */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 border-b border-[color:var(--color-ink)]/10">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "เงื่อนไขการเข้าพัก", en: "House rules" })}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm leading-relaxed">
              <li className="flex items-start gap-3.5 text-[color:var(--color-ink)]/85">
                <RuleIcon name="noPets" />
                <span>
                  {t({
                    th: `ไม่อนุญาตให้นำสัตว์เลี้ยงทุกชนิดเข้าพัก ฝ่าฝืนปรับ ${siteConfig.policy.petFine.toLocaleString("en-US")} บาท`,
                    en: `No pets of any kind — ${siteConfig.policy.petFine.toLocaleString("en-US")} THB fine for violations.`,
                  })}
                </span>
              </li>
              <li className="flex items-start gap-3.5 text-[color:var(--color-ink)]/85">
                <RuleIcon name="noSmoking" />
                <span>
                  {t({
                    th: "งดสูบบุหรี่ภายในห้องพักโดยเด็ดขาด",
                    en: "Strictly no smoking inside the room.",
                  })}
                </span>
              </li>
            </ul>
          </div>

          {/* ── Photo gallery ──────────────────────── */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "ภาพห้องพัก", en: "Gallery" })}
            </h4>
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

          <footer className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBook}
              className="flex-1 inline-flex items-center justify-center rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-warm-clay)] transition-colors duration-500"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "จองห้องนี้", en: "Reserve this room" })}
            </button>
            <a
              href={siteConfig.contact.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-ink)]/20 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-ink)]/5 transition-colors"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "สอบถามผ่าน Line", en: "Ask via Line" })}
            </a>
          </footer>
        </div>
      </motion.div>

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

/* Thin-line service icons matching the site's warm-clay accent.
   Order is fixed: 0 = room service, 1 = breakfast, 2 = wifi. */
function ServiceIcon({ index }: { index: number }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-5 w-5 shrink-0 text-[color:var(--color-warm-clay)]",
  };

  if (index === 0) {
    // Room service — cloche / serving dome
    return (
      <svg {...common}>
        <path d="M4 18h16" />
        <path d="M5.5 18a6.5 6.5 0 0 1 13 0" />
        <path d="M12 5.5V4" />
        <circle cx="12" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (index === 1) {
    // Breakfast — coffee cup with steam
    return (
      <svg {...common}>
        <path d="M5 10h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-5Z" />
        <path d="M16 12h1.5a2 2 0 0 1 0 4H16" />
        <path d="M8 4c0 1 1 1.4 1 2.5S8 8 8 8" />
        <path d="M11.5 4c0 1 1 1.4 1 2.5S11.5 8 11.5 8" />
      </svg>
    );
  }

  // Wi-Fi — concentric arcs
  return (
    <svg {...common}>
      <path d="M4.5 11.5a11 11 0 0 1 15 0" />
      <path d="M7.5 14.5a7 7 0 0 1 9 0" />
      <path d="M10.5 17.5a3 3 0 0 1 3 0" />
      <circle cx="12" cy="19.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RuleIcon({ name }: { name: "noPets" | "noSmoking" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-5 w-5 shrink-0 text-[color:var(--color-warm-clay)]",
  };
  if (name === "noPets") {
    // Paw print with a ban slash
    return (
      <svg {...common}>
        <ellipse cx="12" cy="15" rx="3.6" ry="2.8" />
        <circle cx="6.8" cy="10.5" r="1.3" />
        <circle cx="10.5" cy="8" r="1.3" />
        <circle cx="14.5" cy="8.2" r="1.3" />
        <path d="M4 4l16 16" />
      </svg>
    );
  }
  // No smoking — cigarette with a ban slash
  return (
    <svg {...common}>
      <rect x="3" y="13.5" width="13" height="3" rx="0.6" />
      <path d="M18.5 13.5v3M21 13.5v3" />
      <path d="M15 6c1.4 1 1.4 2.4 0 3.4" />
      <path d="M3.5 5l17 14" />
    </svg>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[color:var(--color-ink)]/8 pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <dt
        className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/50"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
      </dt>
      <dd className="text-[color:var(--color-forest-deep)] font-medium">{value}</dd>
    </div>
  );
}
