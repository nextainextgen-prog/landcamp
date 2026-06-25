import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireSection } from "@/lib/admin/guard";
import { restoreVersion } from "@/lib/content/store";
import { CONTENT_CACHE_TAG } from "@/lib/content/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("content");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    await restoreVersion(id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to restore" },
      { status: 500 },
    );
  }

  revalidateTag(CONTENT_CACHE_TAG, "max");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
