"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EASE = [0.22, 1, 0.36, 1] as const;

const MAP_EMBED_URL = `https://maps.google.com/maps?q=${siteConfig.address.coordinates.lat},${siteConfig.address.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

const DIRECTIONS = [
  {
    no: "01",
    th: "ออกจากกรุงเทพใช้ทางหลวงหมายเลข 1 (พหลโยธิน) มุ่งสู่ อ.ปากช่อง",
    en: "From Bangkok, take Highway 1 (Phahonyothin) north toward Pak Chong.",
    distance: { th: "ประมาณ 2 ชั่วโมง", en: "≈ 2 hours" },
  },
  {
    no: "02",
    th: "เลี้ยวเข้าถนนธนะรัชต์ (เส้นทางสู่อุทยานแห่งชาติเขาใหญ่)",
    en: "Turn onto Thanarat Road toward Khao Yai National Park.",
    distance: { th: "12 กม.", en: "12 km" },
  },
  {
    no: "03",
    th: "ตำบลขนงพระ เลี้ยวขวาตรงป้าย LandCamp",
    en: "In Khanong Phra, follow the LandCamp signage to the right.",
    distance: { th: "ตรงเข้าที่พักอีก 600 ม.", en: "600 m to entrance" },
  },
] as const;

export function MapSection() {
  const t = useT();

  return (
    <section
      id="location"
      aria-label={t({ th: "ที่ตั้งและการเดินทาง", en: "Location and directions" })}
      className="relative bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <SectionHeading
          number="07"
          tone="bone"
          eyebrow={t({ th: "ที่ตั้ง & การเดินทาง", en: "Location & Directions" })}
          title={
            <>
              <span className="block">
                {t({ th: "ปากช่อง · นครราชสีมา", en: "Pak Chong · Nakhon Ratchasima" })}
              </span>
              <span className="block opacity-70">
                {t({ th: "ห่างจากเขาใหญ่ 12.6 กม.", en: "12.6 km from Khao Yai" })}
              </span>
            </>
          }
        />

        <div className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            className="lg:col-span-7 relative rounded-[18px] overflow-hidden bg-[color:var(--color-forest-night)] border border-[color:var(--color-bone)]/10 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[560px]"
          >
            <iframe
              title="LandCamp Villa Khao Yai map"
              src={MAP_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0, filter: "saturate(0.85) brightness(0.95)" }}
            />
            <a
              href={siteConfig.contact.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-bone)] text-[color:var(--color-forest-night)] px-5 py-2.5 text-[10px] uppercase tracking-[0.32em] hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors duration-500"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "เปิดใน Google Maps", en: "Open in Maps" })}
              <span aria-hidden className="inline-block h-px w-4 bg-current opacity-70" />
            </a>
          </motion.div>

          {/* NAP card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            className="lg:col-span-5 bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-[18px] p-7 sm:p-9 lg:p-10 flex flex-col gap-7"
          >
            <header>
              <span
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {t({ th: "ติดต่อโดยตรง", en: "Direct contact" })}
              </span>
              <h3 className="mt-3 font-display text-3xl sm:text-4xl text-[color:var(--color-forest-deep)] leading-tight">
                {siteConfig.brand.nameThai}
                <br />
                <span className="opacity-65">{siteConfig.brand.nameFull}</span>
              </h3>
            </header>

            <dl className="grid grid-cols-1 gap-5 text-sm">
              <div>
                <dt
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55 mb-1.5"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "ที่อยู่", en: "Address" })}
                </dt>
                <dd className="leading-relaxed text-[color:var(--color-ink)]/85">
                  {t(siteConfig.address.full)}
                </dd>
              </div>
              <div>
                <dt
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55 mb-1.5"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "พิกัด", en: "Coordinates" })}
                </dt>
                <dd className="leading-relaxed text-[color:var(--color-ink)]/85 tabular-nums">
                  {siteConfig.address.coordinates.lat}°N,{" "}
                  {siteConfig.address.coordinates.lng}°E
                </dd>
              </div>
              <div>
                <dt
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55 mb-1.5"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "Line / โทร", en: "Line / Phone" })}
                </dt>
                <dd className="leading-relaxed">
                  <a
                    href={siteConfig.contact.lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--color-forest-deep)] hover:text-[color:var(--color-warm-clay)] transition-colors block"
                  >
                    Line {siteConfig.contact.line}
                  </a>
                  <a
                    href={`tel:${siteConfig.contact.phoneE164}`}
                    className="text-[color:var(--color-forest-deep)] hover:text-[color:var(--color-warm-clay)] transition-colors block tabular-nums"
                  >
                    {siteConfig.contact.phone}
                  </a>
                </dd>
              </div>
            </dl>

            <div className="border-t border-[color:var(--color-ink)]/10 pt-6 grid grid-cols-2 gap-4 text-sm text-[color:var(--color-ink)]/70">
              <div>
                <span
                  className="block text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55 mb-1"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "เช็คอิน", en: "Check-in" })}
                </span>
                {siteConfig.policy.checkIn}
              </div>
              <div>
                <span
                  className="block text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55 mb-1"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t({ th: "เช็คเอาท์", en: "Check-out" })}
                </span>
                {siteConfig.policy.checkOut}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Directions */}
        <div className="mt-16 sm:mt-20">
          <p
            className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-bone)]/65 flex items-center gap-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span aria-hidden className="h-px w-10 bg-current opacity-60" />
            {t({ th: "เส้นทางจากกรุงเทพ", en: "From Bangkok" })}
          </p>

          <ol className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIRECTIONS.map((d, i) => (
              <motion.li
                key={d.no}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.08 }}
                className="rounded-[14px] border border-[color:var(--color-bone)]/15 p-6 flex flex-col gap-3"
              >
                <span
                  className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {d.no}
                </span>
                <p className="text-[color:var(--color-bone)]/90 leading-relaxed text-[15px]">
                  {t({ th: d.th, en: d.en })}
                </p>
                <span
                  className="mt-auto text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/55"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t(d.distance)}
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
