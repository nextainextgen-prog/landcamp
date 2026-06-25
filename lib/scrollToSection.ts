// Smooth-scroll to an in-page section, accounting for the fixed 84px header
// so the section heading isn't tucked underneath the navbar. Respects the
// user's reduced-motion preference.
const HEADER_OFFSET = 84;

export function scrollToSection(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
}
