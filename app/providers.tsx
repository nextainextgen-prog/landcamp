"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/types";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "landcamp:locale";

export function useLocale() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLocale must be used inside <Providers>");
  return ctx;
}

/**
 * Pick a bilingual string by current locale.
 * Usage: const text = useT()({ th: "...", en: "..." })
 */
export function useT() {
  const { locale } = useLocale();
  return useCallback(
    <T extends { th: string; en: string }>(value: T) =>
      locale === "th" ? value.th : value.en,
    [locale],
  );
}

/**
 * Root client providers.
 *
 * HeroUI v3 is fully styled via Tailwind v4 CSS variables — no React
 * provider is required. We only need the language context here.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "th" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === "th" ? "en" : "th");
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggle }),
    [locale, setLocale, toggle],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
