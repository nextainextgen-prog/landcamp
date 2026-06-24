/**
 * Server-only reader for published site content.
 *
 * Reads the published override from `site_content` (single row, id=1) through
 * the service-role admin client, deep-merges it over the code defaults, and
 * caches the result under the `site-content` tag. The publish API revalidates
 * that tag so edits go live without a redeploy.
 *
 * Any failure (table missing because migration 011 hasn't run, env not set,
 * network error) falls back to the code defaults — the site never breaks.
 */

import "server-only";
import { unstable_cache } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CONTENT_DEFAULTS } from "./defaults";
import { mergeContent } from "./merge";
import type { SiteContent, SiteContentOverride } from "./types";

export const CONTENT_CACHE_TAG = "site-content";

const loadPublishedOverride = unstable_cache(
  async (): Promise<SiteContentOverride> => {
    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("site_content")
        .select("published")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data?.published) return {};
      return data.published as SiteContentOverride;
    } catch {
      return {};
    }
  },
  ["site-content-published"],
  { tags: [CONTENT_CACHE_TAG] },
);

/** Resolved content the public site renders from (defaults + published override). */
export async function getSiteContent(): Promise<SiteContent> {
  const override = await loadPublishedOverride();
  return mergeContent(CONTENT_DEFAULTS, override);
}
