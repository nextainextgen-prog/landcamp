"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/data/siteConfig";

/**
 * Floating contact button, bottom-right. A call-centre FAB that opens a small
 * menu to choose LINE chat or phone. Picking phone reveals the number with a
 * tap-to-call link. Hidden over the hero, fades in after the guest scrolls past
 * ~85% of the first viewport so it never covers the hero CTA.
 */
export function FloatingLineButton() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "phone">("menu");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Always reopen on the menu view.
  const toggle = () => {
    if (!open) setView("menu");
    setOpen((v) => !v);
  };

  return (
    <div
      ref={rootRef}
      className={
        "fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-all duration-500 ease-out sm:bottom-7 sm:right-7 " +
        (shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")
      }
    >
      {/* popover */}
      {open && (
        <div className="w-[260px] overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_24px_50px_-20px_rgba(45,55,40,0.45)] motion-safe:animate-[fadeIn_.15s_ease-out]">
          {view === "menu" ? (
            <>
              <div className="border-b border-[color:var(--color-forest-deep)]/8 px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--color-forest-deep)]">ติดต่อสอบถาม</p>
                <p className="text-[11px] text-[color:var(--color-ink)]/50">เลือกช่องทางที่สะดวก</p>
              </div>
              <a
                href={siteConfig.contact.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--color-bone-soft)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06C755] text-white">
                  <LineGlyph />
                </span>
                <span className="text-sm">
                  <span className="block font-medium text-[color:var(--color-forest-deep)]">แชทผ่าน LINE</span>
                  <span className="block text-[11px] text-[color:var(--color-ink)]/50">ตอบเร็วทุกวัน</span>
                </span>
              </a>
              <button
                type="button"
                onClick={() => setView("phone")}
                className="flex w-full items-center gap-3 border-t border-[color:var(--color-forest-deep)]/8 px-4 py-3 text-left transition-colors hover:bg-[color:var(--color-bone-soft)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] text-white">
                  <Glyph name="phone" />
                </span>
                <span className="text-sm">
                  <span className="block font-medium text-[color:var(--color-forest-deep)]">โทรศัพท์</span>
                  <span className="block text-[11px] text-[color:var(--color-ink)]/50">โทรหาเราโดยตรง</span>
                </span>
              </button>
            </>
          ) : (
            <div className="px-4 py-4">
              <button
                type="button"
                onClick={() => setView("menu")}
                className="mb-2 inline-flex items-center gap-1 text-[12px] text-[color:var(--color-ink)]/55 transition-colors hover:text-[color:var(--color-forest-deep)]"
              >
                <Glyph name="back" className="h-4 w-4" /> ย้อนกลับ
              </button>
              <p className="text-sm text-[color:var(--color-ink)]/65">ติดต่อสอบถามเพิ่มเติมได้ที่</p>
              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                className="mt-2 flex items-center gap-2.5 rounded-xl bg-[color:var(--color-warm-clay)]/10 px-3.5 py-3 text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-warm-clay)]/18"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] text-white">
                  <Glyph name="phone" />
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45" style={{ fontFamily: "var(--font-ui)" }}>
                    โทร
                  </span>
                  <span className="block font-display text-lg leading-tight">{siteConfig.contact.phone}</span>
                </span>
              </a>
              {siteConfig.contact.phoneAlt && (
                <a
                  href={`tel:${siteConfig.contact.phoneAlt.replace(/[^0-9]/g, "")}`}
                  className="mt-2 block text-center text-[12px] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-warm-clay)]"
                >
                  หรือ {siteConfig.contact.phoneAlt}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={toggle}
        aria-label="ติดต่อสอบถาม"
        aria-expanded={open}
        className="inline-flex h-14 w-14 items-center justify-center self-end rounded-full bg-[color:var(--color-warm-clay)] text-white shadow-[0_12px_28px_-8px_rgba(176,122,84,0.65)] ring-1 ring-black/5 transition-transform duration-300 ease-out hover:scale-105"
      >
        {open ? <Glyph name="close" className="h-6 w-6" /> : <Glyph name="headset" className="h-7 w-7" />}
      </button>
    </div>
  );
}

function Glyph({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const p: Record<string, React.ReactNode> = {
    headset: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="2.5" y="13.5" width="4" height="6.5" rx="1.6" />
        <rect x="17.5" y="13.5" width="4" height="6.5" rx="1.6" />
        <path d="M19.5 20v.4a3 3 0 0 1-3 3H13" />
      </>
    ),
    phone: (
      <path d="M5 4h3.4l1.6 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.6V19a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    back: <path d="M15 18l-6-6 6-6" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name] ?? null}
    </svg>
  );
}

function LineGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
      <path d="M12 2C6.5 2 2 5.65 2 10.13c0 4.02 3.56 7.39 8.37 8.02.33.07.77.22.88.5.1.26.07.65.03.92l-.14.85c-.04.26-.2 1 .88.55 1.07-.45 5.79-3.41 7.9-5.84C21.45 13.6 22 11.94 22 10.13 22 5.65 17.51 2 12 2zM8.32 12.85H6.4c-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.3h1.37c.3 0 .55.25.55.55s-.25.54-.55.54zm2.15-.55c0 .3-.24.55-.55.55-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.84zm4.61 0c0 .24-.15.45-.38.52-.06.02-.12.03-.18.03-.17 0-.34-.08-.43-.22l-1.97-2.68v2.35c0 .3-.25.55-.55.55-.31 0-.55-.25-.55-.55V8.46c0-.24.15-.44.38-.52.06-.02.12-.03.18-.03.17 0 .33.09.43.22l1.97 2.68V8.46c0-.3.24-.54.55-.54.3 0 .55.24.55.54v3.84zm3.1-2.47c.3 0 .55.25.55.55 0 .3-.25.54-.55.54h-1.37v.83h1.37c.3 0 .55.24.55.55 0 .3-.25.54-.55.54H16.2c-.3 0-.54-.24-.54-.54V8.46c0-.3.24-.54.54-.54h1.93c.3 0 .55.24.55.54s-.25.55-.55.55h-1.37v.82h1.37z" />
    </svg>
  );
}
