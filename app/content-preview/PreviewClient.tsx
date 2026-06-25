"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ContentProvider } from "@/lib/content/provider";
import type { SiteContent } from "@/lib/content/types";

/**
 * Wraps the preview in a ContentProvider whose value can be updated live by the
 * CMS editor. The editor posts the in-progress draft via postMessage on every
 * keystroke, so the preview reflects edits in real time (before saving).
 */
export function PreviewClient({
  initialContent,
  children,
}: {
  initialContent: SiteContent;
  children: ReactNode;
}) {
  const [content, setContent] = useState<SiteContent>(initialContent);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; content?: SiteContent } | null;
      if (data?.type === "lc-content" && data.content) {
        setContent(data.content);
      }
    }
    window.addEventListener("message", onMessage);
    // Tell the editor we're mounted so it can push the current draft.
    window.parent?.postMessage({ type: "lc-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <ContentProvider content={content}>{children}</ContentProvider>;
}
