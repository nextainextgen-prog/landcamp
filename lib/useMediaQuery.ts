"use client";

import { useEffect, useState } from "react";

/**
 * Media-query hook that hydrates correctly on the server.
 *
 * Returns `false` on first render to match server output,
 * then updates after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
