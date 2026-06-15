import type { Variants, Transition } from "framer-motion";

/**
 * Editorial easing — drawn from luxury hospitality motion design.
 * Slow, intentional, never bouncy.
 */
export const EDITORIAL_EASE: Transition["ease"] = [0.25, 0.46, 0.45, 0.94];
export const SOFT_EASE: Transition["ease"] = [0.22, 1, 0.36, 1];

/**
 * Page-level fade up for sections entering the viewport.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EDITORIAL_EASE },
  },
};

/**
 * Stagger container — apply to a parent to ripple children entrance.
 */
export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

/**
 * Word-by-word reveal for serif display headings.
 */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "80%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: SOFT_EASE },
  },
};

/**
 * Navbar background reveal on scroll.
 */
export const navbarReveal: Variants = {
  top: {
    backgroundColor: "rgba(77, 88, 75, 0)",
    backdropFilter: "blur(0px)",
    borderColor: "rgba(245, 241, 234, 0)",
  },
  scrolled: {
    backgroundColor: "rgba(44, 51, 39, 0.85)",
    backdropFilter: "blur(20px)",
    borderColor: "rgba(245, 241, 234, 0.08)",
  },
};

/**
 * Mobile drawer panel slide.
 */
export const drawerPanel: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: 0.55, ease: SOFT_EASE },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.4, ease: EDITORIAL_EASE },
  },
};
