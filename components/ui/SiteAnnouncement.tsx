"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

type Announcement = {
  enabled: boolean;
  image?: string;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLink?: string;
  showOnce?: boolean;
  version?: string;
};

/**
 * Site-wide announcement pop-up. Content + on/off come from the admin
 * settings page (app_settings key "announcement") via /api/announcement.
 * Dismissal is remembered per content version — permanently when "showOnce"
 * is on (localStorage), otherwise only for the session (sessionStorage).
 */
export function SiteAnnouncement() {
  const [data, setData] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    fetch("/api/announcement")
      .then((r) => r.json())
      .then((d: Announcement) => {
        if (!alive || !d?.enabled) return;
        const key = `lc_announce:${d.version ?? ""}`;
        const store = d.showOnce === false ? window.sessionStorage : window.localStorage;
        if (store.getItem(key) === "1") return;
        setData(d);
        timer = window.setTimeout(() => {
          if (alive) setOpen(true);
        }, 600);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    if (data) {
      const key = `lc_announce:${data.version ?? ""}`;
      const store = data.showOnce === false ? window.sessionStorage : window.localStorage;
      try {
        store.setItem(key, "1");
      } catch {
        /* storage unavailable — just close */
      }
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasButton = Boolean(data?.buttonText && data?.buttonLink);

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <motion.button
            type="button"
            aria-label="ปิดประกาศ"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[color:var(--color-forest-night)]/80 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative w-full max-w-md overflow-hidden rounded-[20px] bg-[color:var(--color-bone)] text-[color:var(--color-ink)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={dismiss}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-bone)]/95 transition-colors hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)]"
            >
              <span aria-hidden className="relative block h-5 w-5">
                <span className="absolute inset-0 m-auto h-px w-4 rotate-45 bg-current" />
                <span className="absolute inset-0 m-auto h-px w-4 -rotate-45 bg-current" />
              </span>
            </button>

            {data.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.image}
                alt={data.title ?? "ประกาศ"}
                className="w-full object-cover"
                style={{ aspectRatio: "16/9" }}
              />
            )}

            <div className={`px-8 pb-8 ${data.image ? "pt-6" : "pt-8"}`}>
              <p
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                ประกาศ
              </p>
              {data.title && (
                <h2 className="mt-2 font-display text-3xl leading-tight text-[color:var(--color-forest-deep)]">
                  {data.title}
                </h2>
              )}
              {data.message && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[color:var(--color-ink)]/75">
                  {data.message}
                </p>
              )}
              {hasButton && (
                <a
                  href={data.buttonLink}
                  onClick={dismiss}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] px-6 py-2.5 text-sm font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-forest-deep)]"
                >
                  {data.buttonText}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
