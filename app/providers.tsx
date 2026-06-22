"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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
const DEFAULT_LOCALE: Locale = "th";

// ── Locale persisted in localStorage, exposed as an external store so React
// can read it without a setState-in-effect (SSR-safe via getServerSnapshot). ──
const localeListeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "th" || saved === "en" ? saved : DEFAULT_LOCALE;
}

function subscribeLocale(callback: () => void) {
  localeListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    localeListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeStoredLocale(l: Locale) {
  window.localStorage.setItem(STORAGE_KEY, l);
  document.documentElement.lang = l;
  // `storage` events don't fire in the originating tab, so notify locally.
  localeListeners.forEach((listener) => listener());
}

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
  const locale = useSyncExternalStore(
    subscribeLocale,
    readStoredLocale,
    () => DEFAULT_LOCALE,
  );

  const setLocale = useCallback((l: Locale) => {
    writeStoredLocale(l);
  }, []);

  const toggle = useCallback(() => {
    writeStoredLocale(readStoredLocale() === "th" ? "en" : "th");
  }, []);

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
