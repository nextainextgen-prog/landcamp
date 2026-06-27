"use client";

import { useEffect } from "react";

import { CUSTOMER_AUTH_ENABLED } from "@/lib/features";

/**
 * Entry point for the LINE Rich Menu → homepage deep link.
 *
 * The Rich Menu button opens  /?source=line-richmenu  in LINE's in-app browser.
 * On arrival this component:
 *   1. If the visitor is already signed in  → land on the Hero (top of page).
 *   2. If NOT signed in and customer auth is on → start LINE Login immediately
 *      (no prompt), returning to the homepage Hero afterwards.
 *   3. If customer auth is soft-launched OFF  → just land on Hero (never loop).
 *
 * Renders nothing. The Hero is HeroSection (id="hero"); we resolve the landing
 * with a controlled 300ms smooth scroll so it fires after the page has rendered
 * (works inside LINE's mobile in-app browser).
 */

const RICH_MENU_SOURCE = "line-richmenu";
const HOME = "/";
const SCROLL_DELAY_MS = 300;

function scrollToHeroSoon() {
  window.setTimeout(() => {
    const hero = document.getElementById("hero");
    if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, SCROLL_DELAY_MS);
}

export function RichMenuEntry() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("source") !== RICH_MENU_SOURCE) return;

    // Strip ?source so a refresh / back-button never re-triggers the flow.
    const landOnHero = () => {
      url.searchParams.delete("source");
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
      scrollToHeroSoon();
    };

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: unknown }) => {
        if (d.user) {
          // Already signed in → land on the Hero.
          landOnHero();
        } else if (CUSTOMER_AUTH_ENABLED) {
          // Not signed in → auto-start LINE Login, return to the homepage Hero.
          window.location.href = `/api/auth/line/login?next=${encodeURIComponent(HOME)}`;
        } else {
          // Customer login is soft-launched off → don't loop, just land on Hero.
          landOnHero();
        }
      })
      .catch(landOnHero);
  }, []);

  return null;
}
