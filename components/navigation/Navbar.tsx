"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { siteConfig } from "@/data/siteConfig";
import { useT } from "@/app/providers";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/cn";

const SCROLL_THRESHOLD = 60;

export function Navbar() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  // Continuous border opacity rather than discrete switch
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 0.08]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={false}
        animate={scrolled ? "scrolled" : "top"}
        variants={{
          top: {
            backgroundColor: "rgba(44, 51, 39, 0)",
            backdropFilter: "blur(0px)",
          },
          scrolled: {
            backgroundColor: "rgba(44, 51, 39, 0.78)",
            backdropFilter: "blur(20px)",
          },
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50"
        style={{
          // @ts-expect-error CSS var pass-through
          "--header-h": "84px",
        }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-[color:var(--color-bone)]"
          style={{ opacity: borderOpacity }}
        />

        <div className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          {/* Wordmark */}
          <Wordmark size="md" color="bone" />

          {/* Center nav — desktop only */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-9"
          >
            {siteConfig.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group relative text-[12px] uppercase tracking-[0.28em] text-[color:var(--color-bone)]/85 hover:text-[color:var(--color-bone)] transition-colors"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                <span>{t({ th: item.labelTh, en: item.labelEn })}</span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-[color:var(--color-warm-clay)] transition-all duration-500 ease-out group-hover:w-full"
                />
              </a>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3 lg:gap-5">
            <div className="hidden md:block">
              <LanguageToggle variant="light" />
            </div>

            <div className="hidden md:block">
              <MagneticButton
                href={siteConfig.contact.lineUrl}
                ariaLabel="Book via Line"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[11px] uppercase tracking-[0.28em]",
                    "bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)]",
                    "hover:bg-[color:var(--color-forest-deep)]",
                    "transition-colors duration-500 ease-out",
                  )}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {t({ th: "จองเลย", en: "Book Now" })}
                  <span aria-hidden className="inline-block h-px w-5 bg-current opacity-60" />
                </span>
              </MagneticButton>
            </div>

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="lg:hidden inline-flex flex-col items-end justify-center gap-[6px] p-2 text-[color:var(--color-bone)]"
            >
              <span className="block h-px w-7 bg-current" />
              <span className="block h-px w-5 bg-current opacity-80" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60]"
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-[color:var(--color-forest-night)]/70 backdrop-blur-md"
            />

            {/* Panel */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 h-full w-[88%] max-w-[420px] bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-6">
                <Wordmark size="sm" color="bone" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="relative h-9 w-9 inline-flex items-center justify-center"
                >
                  <span
                    aria-hidden
                    className="absolute h-px w-6 bg-current rotate-45"
                  />
                  <span
                    aria-hidden
                    className="absolute h-px w-6 bg-current -rotate-45"
                  />
                </button>
              </div>

              <div className="mt-2 mx-6 h-px bg-[color:var(--color-bone)]/12" />

              <nav
                aria-label="Mobile primary"
                className="flex flex-col gap-1 px-6 py-8"
              >
                {siteConfig.nav.map((item, idx) => (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.15 + idx * 0.07,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group flex items-baseline justify-between border-b border-[color:var(--color-bone)]/10 py-5"
                  >
                    <span className="font-display text-3xl">
                      {t({ th: item.labelTh, en: item.labelEn })}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--color-bone)]/45 group-hover:text-[color:var(--color-warm-clay)] transition-colors"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      0{idx + 1}
                    </span>
                  </motion.a>
                ))}
              </nav>

              <div className="mt-auto px-6 pb-10 space-y-6">
                <LanguageToggle variant="light" />

                <a
                  href={siteConfig.contact.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center rounded-full bg-[color:var(--color-bone)] text-[color:var(--color-forest-night)] px-6 py-4 text-[12px] uppercase tracking-[0.3em] hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors duration-500"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {t({ th: "จองผ่าน Line @landcamp", en: "Book via Line @landcamp" })}
                </a>

                <div
                  className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/60"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  <a href={`tel:${siteConfig.contact.phoneE164}`}>
                    {siteConfig.contact.phone}
                  </a>
                  <span aria-hidden className="rule-line opacity-40" />
                  <a
                    href={siteConfig.contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
