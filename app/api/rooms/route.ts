import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOM_FIELDS = "id, slug, price_weekday, price_weekend, max_guests, is_available";

/**
 * Resolves a static landing-page room (identified by `slug`, e.g. "villa-1")
 * to its DB row so the BookingModal can obtain the UUID `roomId` the booking
 * APIs require. Returns a single room when `?slug=` is given, otherwise the
 * full list. Rooms are public data.
 */
export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug");

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  if (slug) {
    const { data, error } = await admin
      .from("rooms")
      .select(ROOM_FIELDS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "room not found" }, { status: 404 });
    }
    return NextResponse.json({ room: data });
  }

  const { data, error } = await admin
    .from("rooms")
    .select(ROOM_FIELDS)
    .order("display_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rooms: data ?? [] });
}
