/**
 * Server-only CMS store — direct (uncached) reads/writes of the site_content
 * singleton row. Used by the admin editor page (read) and the admin content API
 * (save draft / publish). The public site reads through the cached
 * lib/content/server.ts instead.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SiteContentOverride } from "./types";

const ID = 1;

export type ContentRow = {
  draft: SiteContentOverride;
  published: SiteContentOverride;
};

/** Returns the draft/published overrides, or null if the row/table is missing. */
export async function readContentRow(): Promise<ContentRow | null> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("site_content")
      .select("draft, published")
      .eq("id", ID)
      .maybeSingle();
    if (error || !data) return null;
    return {
      draft: (data.draft ?? {}) as SiteContentOverride,
      published: (data.published ?? {}) as SiteContentOverride,
    };
  } catch {
    return null;
  }
}

/** Saves the draft override (does not touch the published copy). Throws on error. */
export async function saveDraft(draft: SiteContentOverride): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert({ id: ID, draft }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/**
 * Publishes the current draft: copies draft → published, stamps published_at,
 * and snapshots the published doc into site_content_versions for rollback.
 */
export async function publishDraft(actor: string): Promise<SiteContentOverride> {
  const admin = createSupabaseAdminClient();

  const { data: row, error: readErr } = await admin
    .from("site_content")
    .select("draft")
    .eq("id", ID)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const draft = (row?.draft ?? {}) as SiteContentOverride;

  const { error: upErr } = await admin
    .from("site_content")
    .update({ published: draft, published_at: new Date().toISOString() })
    .eq("id", ID);
  if (upErr) throw new Error(upErr.message);

  // Snapshot (non-fatal — publish already succeeded).
  await admin.from("site_content_versions").insert({ data: draft, created_by: actor });

  return draft;
}

export type ContentVersion = {
  id: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
};

/** Recent publish snapshots, newest first. */
export async function listVersions(limit = 20): Promise<ContentVersion[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("site_content_versions")
      .select("id, label, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ContentVersion[];
  } catch {
    return [];
  }
}

/**
 * Restores a snapshot: sets both draft and published back to that version's
 * doc so the editor and the live site reflect it. Throws on error.
 */
export async function restoreVersion(id: string): Promise<SiteContentOverride> {
  const admin = createSupabaseAdminClient();

  const { data: version, error: readErr } = await admin
    .from("site_content_versions")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!version) throw new Error("version not found");
  const data = (version.data ?? {}) as SiteContentOverride;

  const { error: upErr } = await admin
    .from("site_content")
    .update({ draft: data, published: data, published_at: new Date().toISOString() })
    .eq("id", ID);
  if (upErr) throw new Error(upErr.message);

  return data;
}
