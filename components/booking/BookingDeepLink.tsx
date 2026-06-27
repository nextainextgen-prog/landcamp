"use client";

import { useEffect } from "react";

import { CUSTOMER_AUTH_ENABLED } from "@/lib/features";

/**
 * Entry point for the LINE Rich Menu → booking deep link.
 *
 * The Rich Menu button opens  /?source=line-richmenu  in LINE's in-app browser.
 * On arrival this component:
 *   1. If the visitor is already signed in  → scroll to the booking section.
 *   2. If NOT signed in and customer auth is on → start LINE Login immediately
 *      (no prompt), returning to /#reserve so we land back on the booking part.
 *   3. If customer auth is soft-launched OFF  → just scroll (never loop on login).
 *
 * It also handles a plain  /#reserve  (or #rooms) hash on load — e.g. the
 * redirect back from the LINE callback — with a controlled 300ms smooth scroll
 * so it fires after the page has rendered (works inside LINE's mobile browser).
 *
 * Renders nothing. The booking section itself is RoomsSection (id="rooms"); we
 * keep `#reserve` as the public anchor and resolve it to that section.
 */

const RICH_MENU_SOURCE = "line-richmenu";
const BOOKING_ANCHOR = "/#reserve";
const SCROLL_DELAY_MS = 300;

function bookingSection(): HTMLElement | null {
  return document.getElementById("reserve") ?? document.getElementById("rooms");
}

function scrollToBookingSoon() {
  window.setTimeout(() => {
    bookingSection()?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, SCROLL_DELAY_MS);
}

export function BookingDeepLink() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromRichMenu = url.searchParams.get("source") === RICH_MENU_SOURCE;

    if (fromRichMenu) {
      // Strip ?source so a refresh / back-button never re-triggers the flow.
      const cleanUrl = () => {
        url.searchParams.delete("source");
        url.hash = "reserve";
        window.history.replaceState(null, "", url.toString());
      };

      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d: { user: unknown }) => {
          if (d.user) {
            // Already signed in → go straight to the booking section.
            cleanUrl();
            scrollToBookingSoon();
          } else if (CUSTOMER_AUTH_ENABLED) {
            // Not signed in → auto-start LINE Login, come back to the booking part.
            window.location.href = `/api/auth/line/login?next=${encodeURIComponent(BOOKING_ANCHOR)}`;
          } else {
            // Customer login is soft-launched off → don't loop, just scroll.
            cleanUrl();
            scrollToBookingSoon();
          }
        })
        .catch(() => {
          cleanUrl();
          scrollToBookingSoon();
        });
      return;
    }

    // Direct hash navigation (e.g. returning from the LINE callback to /#reserve).
    if (window.location.hash === "#reserve" || window.location.hash === "#rooms") {
      scrollToBookingSoon();
    }
  }, []);

  return null;
}
