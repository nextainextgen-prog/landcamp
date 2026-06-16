"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { featuredReviews } from "@/data/reviews";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { StatCounter } from "@/components/ui/StatCounter";
import { cn } from "@/lib/cn";
import type { Review } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

const GOOGLE_MAPS_REVIEWS_URL =
  "https://www.google.com/maps/place/LandCamp+Villa+Khao+Yai/@14.6042662,101.4386857,17z/data=!3m1!4b1!4m6!3m5!1s0x311c2fa1d1a6dd03:0x200fb4eac8430519!8m2!3d14.6042662!4d101.4386857!16s%2Fg%2F11l5srt2_w?hl=th-TH";

const PLATFORM_LABEL: Record<Review["platform"], string> = {
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
};

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "block",
            size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5",
            i < value
              ? "text-[color:var(--color-warm-clay)]"
              : "text-[color:var(--color-ink)]/15",
          )}
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            backgroundColor: "currentColor",
          }}
        />
      ))}
    </span>
  );
}

export function ReviewsSection() {
  const t = useT();

  return (
    <section
      id="reviews"
      aria-label={t({ th: "รีวิวจากผู้เข้าพัก", en: "Guest reviews" })}
      className="relative bg-[color:var(--color-bone)] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-14">
        {/* ────────────────────────────────────
            Header — compact eyebrow + headline + rating
            ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex flex-col gap-4"
          >
            <div
              className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.4em]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <span className="text-[color:var(--color-warm-clay)]">08</span>
              <span aria-hidden className="h-px w-8 bg-[color:var(--color-forest-deep)]/40" />
              <span className="text-[color:var(--color-forest-deep)]/65">
                {t({ th: "เสียงจากผู้เข้าพัก", en: "Guest Voices" })}
              </span>
            </div>

            <h2
              className="font-display text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] text-[color:var(--color-forest-deep)] max-w-xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t({
                th: "เก้าในสิบของผู้เข้าพักกลับมาอีกครั้ง",
                en: "Nine in ten guests come back again",
              })}
            </h2>
          </motion.div>

          {/* Aggregate rating */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="flex items-center gap-4 lg:self-end"
          >
            <div className="text-[color:var(--color-forest-deep)]">
              <span
                className="font-display text-5xl sm:text-6xl leading-none"
                style={{ letterSpacing: "-0.02em" }}
              >
                <StatCounter value={siteConfig.rating.value} decimals={1} />
              </span>
              <span
                className="ml-1 text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                / 5
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Stars value={5} />
              <span
                className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-ink)]/60"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                <StatCounter value={siteConfig.rating.count} />+ Google reviews
              </span>
            </div>
          </motion.div>
        </div>

        {/* ────────────────────────────────────
            Reviews — compact 3-column grid
            ──────────────────────────────────── */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {featuredReviews.map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5% 0px" }}
              transition={{
                duration: 0.7,
                ease: EASE,
                delay: 0.05 + (i % 3) * 0.06,
              }}
              className="relative rounded-[14px] p-5 sm:p-6 flex flex-col gap-3 bg-[color:var(--color-bone-soft)]/60 border border-[color:var(--color-ink)]/8 hover:bg-[color:var(--color-bone-soft)] hover:border-[color:var(--color-ink)]/15 transition-colors duration-500"
            >
              <header className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-[color:var(--color-bone)]">
                  {r.photoUrl ? (
                    <Image
                      src={r.photoUrl}
                      alt={r.reviewerName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] font-display text-base"
                    >
                      {r.reviewerName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[13px] text-[color:var(--color-forest-deep)] font-medium truncate"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {r.reviewerName}
                  </span>
                  <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/55">
                    <Stars value={r.rating} size="xs" />
                    <span style={{ fontFamily: "var(--font-inter)" }}>
                      {PLATFORM_LABEL[r.platform]}
                    </span>
                  </span>
                </div>
                <time
                  dateTime={r.date}
                  className="ml-auto text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/45 self-start whitespace-nowrap"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {new Date(r.date).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </header>

              <blockquote className="text-[13px] sm:text-sm leading-[1.6] text-[color:var(--color-ink)]/80">
                <span aria-hidden className="text-[color:var(--color-warm-clay)]">“</span>
                {t(r.text)}
                <span aria-hidden className="text-[color:var(--color-warm-clay)]">”</span>
              </blockquote>

              {r.photos && r.photos.length > 0 && (
                <div className="mt-1 grid grid-cols-4 gap-1.5">
                  {r.photos.slice(0, 4).map((p, pi) => (
                    <a
                      key={pi}
                      href={GOOGLE_MAPS_REVIEWS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-md bg-[color:var(--color-bone)]"
                    >
                      <Image
                        src={p.src}
                        alt={p.alt}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </a>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>

        {/* ────────────────────────────────────
            CTA — single "More Reviews" button
            ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-10 flex justify-center"
        >
          <a
            href={GOOGLE_MAPS_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] px-7 py-3.5 text-[11px] uppercase tracking-[0.32em] hover:bg-[color:var(--color-forest-deep)] transition-colors duration-500"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {t({ th: "รีวิวเพิ่มเติม", en: "More reviews" })}
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
