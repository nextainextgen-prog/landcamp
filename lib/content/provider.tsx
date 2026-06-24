"use client";

/**
 * Client provider for resolved site content.
 *
 * The server fetches the merged content tree (defaults + published override)
 * and passes it down through this provider so client sections can read it with
 * `useContent()`. Falls back to CONTENT_DEFAULTS if a section is rendered
 * outside a provider, so it never throws.
 */

import { createContext, useContext, type ReactNode } from "react";

import { CONTENT_DEFAULTS } from "./defaults";
import type { SiteContent } from "./types";

const ContentContext = createContext<SiteContent>(CONTENT_DEFAULTS);

export function ContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: ReactNode;
}) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent(): SiteContent {
  return useContext(ContentContext);
}
