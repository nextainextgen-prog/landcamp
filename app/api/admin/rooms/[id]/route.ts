import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateRoomInput } from "@/lib/validators/room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS =
  "id, slug, room_type, name_th, name_en, description_th, description_en, price_weekday, price_weekend, max_guests, is_available, display_order, amenities, images, details";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("rooms");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const result = validateRoomInput(body, { partial: true });
  if (!result.ok) return NextResponse.json({ error: "validation failed", fields: result.errors }, { status: 400 });
  if (Object.keys(result.data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin
    .from("rooms")
    .update(result.data)
    .eq("id", id)
    .select(FIELDS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "room not found" }, { status: 404 });
  // Purge the cached public homepage so closing/opening a room (is_available)
  // or any edit reflects on the site immediately, not after the 60s ISR window.
  revalidatePath("/");
  return NextResponse.json({ room: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("rooms");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { error } = await admin.from("rooms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
