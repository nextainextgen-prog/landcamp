"use client";

import { useEffect } from "react";

/**
 * Bridges the live-preview iframe with the CMS editor. Listens for scroll
 * requests from the parent (when the admin opens a section) and flashes a
 * highlight so they can see exactly which part of the page they're editing.
 */
export function PreviewBridge() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; selector?: string } | null;
      if (!data || data.type !== "lc-scroll" || !data.selector) return;
      const el = data.selector.startsWith("#")
        ? document.getElementById(data.selector.slice(1))
        : document.querySelector(data.selector);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("lc-edit-flash");
      window.setTimeout(() => el.classList.remove("lc-edit-flash"), 1800);
    }
    window.addEventListener("message", onMessage);
    // Tell the parent we're ready.
    window.parent?.postMessage({ type: "lc-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <style
      // Global highlight applied to the section being edited.
      dangerouslySetInnerHTML={{
        __html: `.lc-edit-flash{outline:3px solid var(--color-warm-clay);outline-offset:-3px;border-radius:6px;animation:lcflash 1.8s ease-out;}@keyframes lcflash{0%,100%{outline-color:transparent}15%,70%{outline-color:var(--color-warm-clay)}}`,
      }}
    />
  );
}
