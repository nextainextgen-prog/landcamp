import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireSection } from "@/lib/admin/guard";
import { publishDraft } from "@/lib/content/store";
import { CONTENT_CACHE_TAG } from "@/lib/content/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Publishes the current draft so visitors see it. Copies draft → published,
 * snapshots a version, then invalidates the cached content tag + the homepage
 * so the change is live without a redeploy.
 */
export async function POST() {
  const auth = await requireSection("content");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await publishDraft(auth.session.username);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to publish" },
      { status: 500 },
    );
  }

  revalidateTag(CONTENT_CACHE_TAG, "max");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
