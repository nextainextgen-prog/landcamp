"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { Wordmark } from "@/components/ui/Wordmark";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] pt-8 sm:pt-10 pb-10 sm:pb-12 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Top oversize wordmark */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE }}
          className="font-serif leading-[0.88] text-[22vw] sm:text-[18vw] lg:text-[15vw] xl:text-[220px] text-[color:var(--color-bone)] tracking-[-0.01em] mb-12 sm:mb-16"
        >
          LandCamp
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 border-t border-[color:var(--color-bone)]/15 pt-12">
          {/* Brand block */}
          <div className="md:col-span-5 flex flex-col gap-5">
            <Wordmark size="md" color="bone" />
            <p className="text-sm leading-relaxed text-[color:var(--color-bone)]/65 max-w-sm">
              {t({
                th: "วิลล่าหรูสไตล์ Glamping ใจกลางขุนเขาเขาใหญ่ — 6 หลัง แยกพื้นที่ส่วนตัว ไม่ใช่โรงแรม ไม่ใช่รีสอร์ต",
                en: "Luxury glamping villas at the heart of Khao Yai — six private retreats, each in its own pine-forest plot.",
              })}
            </p>
            <p className="text-sm leading-relaxed text-[color:var(--color-bone)]/55 max-w-sm">
              {t(siteConfig.address.full)}
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "เมนูหลัก", en: "Explore" })}
            </h4>
            <ul className="flex flex-col gap-3">
              {siteConfig.nav.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-bone)] transition-colors text-sm"
                  >
                    {t({ th: item.labelTh, en: item.labelEn })}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t({ th: "ติดต่อ", en: "Contact" })}
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={siteConfig.contact.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors"
                >
                  Line {siteConfig.contact.line}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors tabular-nums"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex gap-5 pt-2">
                <a
                  href={siteConfig.contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Facebook
                </a>
                <a
                  href={siteConfig.contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Instagram
                </a>
                <a
                  href={siteConfig.contact.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Maps
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-[color:var(--color-bone)]/12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p
            className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/45"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            © {year} LandCamp Villa Khao Yai. {t({ th: "สงวนลิขสิทธิ์", en: "All rights reserved." })}
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/40"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {t({
              th: "ออกแบบและพัฒนาด้วยใจ ที่ปากช่อง",
              en: "Designed and built with care · Pak Chong",
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
