import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; noteId: string }> };

/** Delete a customer note. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("customers");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, noteId } = await ctx.params;
  if (!id || !noteId) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { error } = await admin
    .from("customer_notes")
    .delete()
    .eq("id", noteId)
    .eq("customer_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
