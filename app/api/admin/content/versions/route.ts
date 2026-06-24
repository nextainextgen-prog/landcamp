import { NextResponse } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { listVersions } from "@/lib/content/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSection("content");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const versions = await listVersions();
  return NextResponse.json({ versions });
}
