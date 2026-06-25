import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateRoomInput } from "@/lib/validators/room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS =
  "id, slug, room_type, name_th, name_en, description_th, description_en, price_weekday, price_weekend, max_guests, is_available, display_order, amenities, images, details";

export async function GET() {
  const auth = await requireSection("rooms");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin.from("rooms").select(FIELDS).order("display_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rooms: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("rooms");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const result = validateRoomInput(body);
  if (!result.ok) return NextResponse.json({ error: "validation failed", fields: result.errors }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin.from("rooms").insert(result.data).select(FIELDS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room: data }, { status: 201 });
}
