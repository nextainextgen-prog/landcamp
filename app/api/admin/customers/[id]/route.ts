import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { PatchCustomerSchema } from "@/lib/schemas/admin-crm";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Update CRM fields on a customer: VIP flag and/or tags. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("customers");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = PatchCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.isVip !== undefined) update.is_vip = parsed.data.isVip;
  if (parsed.data.tags !== undefined) {
    // de-dupe while preserving order
    update.tags = Array.from(new Set(parsed.data.tags));
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin
    .from("customers")
    .update(update)
    .eq("id", id)
    .select("id, is_vip, tags")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "customer not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    isVip: data.is_vip as boolean,
    tags: (data.tags as string[]) ?? [],
  });
}
