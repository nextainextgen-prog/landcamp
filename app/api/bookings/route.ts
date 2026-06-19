import { NextResponse, type NextRequest } from "next/server";

import { checkAvailability } from "@/lib/booking/availability";
import { generateBookingCode } from "@/lib/booking/code";
import { calculateTotal } from "@/lib/booking/pricing";
import { CreateBookingSchema } from "@/lib/schemas/booking";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXTRA_BED_PER_NIGHT = 1500;

type RoomRow = Record<string, unknown> & {
  id: string;
  base_price?: number | null;
  price_weekday?: number | null;
};

function diffNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = Date.UTC(
    Number(checkIn.slice(0, 4)),
    Number(checkIn.slice(5, 7)) - 1,
    Number(checkIn.slice(8, 10)),
  );
  const end = Date.UTC(
    Number(checkOut.slice(0, 4)),
    Number(checkOut.slice(5, 7)) - 1,
    Number(checkOut.slice(8, 10)),
  );
  return Math.round((end - start) / msPerDay);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // TODO(auth-trigger): a Postgres trigger on auth.users should create the
  // customers row on first sign-in (see migration 005_auth_customer_sync).
  // Until that lands reliably, surface a clean 404 for the client.
  const { data: customerRow, error: customerErr } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (customerErr) {
    return NextResponse.json({ error: customerErr.message }, { status: 500 });
  }
  if (!customerRow) {
    return NextResponse.json(
      { error: "customer_not_found" },
      { status: 404 },
    );
  }
  const customerId = (customerRow as { id: string }).id;

  const availability = await checkAvailability(
    admin,
    input.roomId,
    input.checkIn,
    input.checkOut,
  );
  if (!availability.available) {
    return NextResponse.json(
      { error: "unavailable", reason: availability.reason },
      { status: 409 },
    );
  }

  const { data: roomRaw, error: roomErr } = await admin
    .from("rooms")
    .select("*")
    .eq("id", input.roomId)
    .maybeSingle();
  if (roomErr) {
    return NextResponse.json({ error: roomErr.message }, { status: 500 });
  }
  if (!roomRaw) {
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  }
  const room = roomRaw as RoomRow;
  const basePrice = Number(room.base_price ?? room.price_weekday ?? 0);

  const nights = diffNights(input.checkIn, input.checkOut);
  const pricing = calculateTotal({
    basePrice,
    nights,
    adults: input.adults,
    children: input.children,
    extraBed: input.extraBed,
  });

  const bookingCode = await generateBookingCode(admin);

  const payload = {
    booking_code: bookingCode,
    customer_id: customerId,
    room_id: input.roomId,
    check_in: input.checkIn,
    check_out: input.checkOut,
    adults: input.adults,
    children: input.children,
    extra_bed: input.extraBed,
    base_amount: basePrice * nights,
    extra_bed_amount: input.extraBed ? EXTRA_BED_PER_NIGHT * nights : 0,
    total_amount: pricing.total,
    status: "pending_payment",
    notes: input.notes ?? null,
  };

  const { data: booking, error: insertErr } = await admin
    .from("bookings")
    .insert(payload)
    .select()
    .single();
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(
    { booking_code: bookingCode, booking },
    { status: 201 },
  );
}
