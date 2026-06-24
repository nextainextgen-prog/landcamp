"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { useContent } from "@/lib/content/provider";
import { Wordmark } from "@/components/ui/Wordmark";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Footer() {
  const t = useT();
  const { contact, footer } = useContent();
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] pt-8 sm:pt-10 pb-10 sm:pb-12 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Top oversize wordmark — clamp size so it always sits inside
            the container padding on mobile, where 22vw used to overflow. */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE }}
          className="font-serif leading-[0.88] text-[color:var(--color-bone)] tracking-[-0.02em] mb-12 sm:mb-16"
          style={{ fontSize: "clamp(60px, 17vw, 220px)" }}
        >
          LandCamp
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 border-t border-[color:var(--color-bone)]/15 pt-12">
          {/* Brand block */}
          <div className="md:col-span-5 flex flex-col gap-5">
            <Wordmark size="md" color="bone" />
            <p className="text-sm leading-relaxed text-[color:var(--color-bone)]/65 max-w-sm">
              {t(footer.brandDescription)}
            </p>
            <p className="text-sm leading-relaxed text-[color:var(--color-bone)]/55 max-w-sm">
              {t(siteConfig.address.full)}
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] mb-5"
              style={{ fontFamily: "var(--font-ui)" }}
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
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {t({ th: "ติดต่อ", en: "Contact" })}
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={contact.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors"
                >
                  Line {contact.line}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phoneE164}`}
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors tabular-nums"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-[color:var(--color-bone)]/75 hover:text-[color:var(--color-warm-clay)] transition-colors"
                >
                  {contact.email}
                </a>
              </li>
              <li className="flex gap-5 pt-2">
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Facebook
                </a>
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Instagram
                </a>
                <a
                  href={contact.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60 hover:text-[color:var(--color-bone)] transition-colors"
                  style={{ fontFamily: "var(--font-ui)" }}
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
            style={{ fontFamily: "var(--font-ui)" }}
          >
            © {year} LandCamp Villa Khao Yai. {t({ th: "สงวนลิขสิทธิ์", en: "All rights reserved." })}
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/40"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {t(footer.copyrightTagline)}
          </p>
        </div>
      </div>
    </footer>
  );
}
