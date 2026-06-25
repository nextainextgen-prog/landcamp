import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { readContentRow, saveDraft } from "@/lib/content/store";
import type { SiteContentOverride } from "@/lib/content/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Guard against absurd payloads (the content doc is small).
const MAX_BODY_BYTES = 512_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  const auth = await requireSection("content");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const row = await readContentRow();
  if (!row) {
    return NextResponse.json(
      { error: "content store unavailable — run migration 011", draft: {}, published: {} },
      { status: 503 },
    );
  }
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const auth = await requireSection("content");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const draft = isPlainObject(body) ? (body as { draft?: unknown }).draft : undefined;
  if (!isPlainObject(draft)) {
    return NextResponse.json({ error: "draft must be an object" }, { status: 400 });
  }
  if (JSON.stringify(draft).length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "draft too large" }, { status: 413 });
  }

  try {
    await saveDraft(draft as SiteContentOverride);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to save draft" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
