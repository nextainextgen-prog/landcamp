"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/siteConfig";

/**
 * Floating LINE chat button, bottom-right. Hidden over the full-screen hero and
 * fades in once the guest scrolls past it (~85% of the first viewport), so it
 * never covers the hero CTA. Tapping opens the Official Account chat.
 */
export function FloatingLineButton() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShown(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <a
      href={siteConfig.contact.lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="แชทผ่าน LINE"
      className={
        "fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755] text-white shadow-[0_12px_28px_-8px_rgba(6,199,85,0.65)] ring-1 ring-black/5 transition-all duration-500 ease-out hover:scale-105 hover:shadow-[0_16px_34px_-8px_rgba(6,199,85,0.75)] sm:bottom-7 sm:right-7 " +
        (shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0")
      }
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-7 w-7">
        <path d="M12 2C6.5 2 2 5.65 2 10.13c0 4.02 3.56 7.39 8.37 8.02.33.07.77.22.88.5.1.26.07.65.03.92l-.14.85c-.04.26-.2 1 .88.55 1.07-.45 5.79-3.41 7.9-5.84C21.45 13.6 22 11.94 22 10.13 22 5.65 17.51 2 12 2zM8.32 12.85H6.4c-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.3h1.37c.3 0 .55.25.55.55s-.25.54-.55.54zm2.15-.55c0 .3-.24.55-.55.55-.3 0-.55-.25-.55-.55V8.46c0-.3.25-.54.55-.54.31 0 .55.24.55.54v3.84zm4.61 0c0 .24-.15.45-.38.52-.06.02-.12.03-.18.03-.17 0-.34-.08-.43-.22l-1.97-2.68v2.35c0 .3-.25.55-.55.55-.31 0-.55-.25-.55-.55V8.46c0-.24.15-.44.38-.52.06-.02.12-.03.18-.03.17 0 .33.09.43.22l1.97 2.68V8.46c0-.3.24-.54.55-.54.3 0 .55.24.55.54v3.84zm3.1-2.47c.3 0 .55.25.55.55 0 .3-.25.54-.55.54h-1.37v.83h1.37c.3 0 .55.24.55.55 0 .3-.25.54-.55.54H16.2c-.3 0-.54-.24-.54-.54V8.46c0-.3.24-.54.54-.54h1.93c.3 0 .55.24.55.54s-.25.55-.55.55h-1.37v.82h1.37z" />
      </svg>
    </a>
  );
}
