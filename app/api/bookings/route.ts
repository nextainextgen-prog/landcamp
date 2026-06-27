import { NextResponse, type NextRequest } from "next/server";

import { checkAvailability } from "@/lib/booking/availability";
import { generateBookingCode } from "@/lib/booking/code";
import { holdExpiresAtIso, holdExpiryCutoffIso } from "@/lib/booking/hold";
import { calculateBookingTotal } from "@/lib/booking/pricing";
import { CreateBookingSchema } from "@/lib/schemas/booking";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomerSession } from "@/lib/customer/session";
import { PUBLIC_BOOKING_ENABLED } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Postgres error codes (surfaced via PostgREST `error.code`).
const PG_UNIQUE_VIOLATION = "23505";
const PG_EXCLUSION_VIOLATION = "23P01"; // bookings_no_overlap (double-booking)
const MAX_CODE_ATTEMPTS = 3;

type RoomRow = {
  id: string;
  price_weekday: number;
  price_weekend: number;
  max_guests: number;
  is_available: boolean;
};

/** Today's date (YYYY-MM-DD) in Asia/Bangkok, so "book today" is allowed. */
function bangkokToday(nowMs: number): string {
  const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(nowMs + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  // Online booking is not live yet (see lib/features.ts).
  if (!PUBLIC_BOOKING_ENABLED) {
    return NextResponse.json(
      { error: "การจองออนไลน์ยังไม่เปิดให้บริการ — กรุณาติดต่อผ่าน LINE" },
      { status: 503 },
    );
  }

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

  const { roomId, customerId, checkIn, checkOut, adults, children, extraBed, notes } =
    parsed.data;

  // ── Authentication: a booking always belongs to the signed-in customer. ──
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }
  // Online bookings require a completed profile (name + phone). The UI collects
  // this before submitting; this guards direct API calls.
  if (!session.profileComplete) {
    return NextResponse.json(
      { error: "profile incomplete", code: "profile_incomplete" },
      { status: 422 },
    );
  }
  // The session is the source of truth for the customer id.
  const customer = { id: session.id };

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  // If the client also sent a customerId it must match (prevents booking on
  // behalf of another customer).
  if (customerId && customer.id !== customerId) {
    return NextResponse.json(
      { error: "customerId does not match the signed-in user" },
      { status: 403 },
    );
  }

  // ── Load the room and validate booking constraints. ──
  const { data: roomRow, error: roomErr } = await admin
    .from("rooms")
    .select("id, price_weekday, price_weekend, max_guests, is_available")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr) {
    return NextResponse.json({ error: roomErr.message }, { status: 500 });
  }
  if (!roomRow) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const room = roomRow as RoomRow;

  if (!room.is_available) {
    return NextResponse.json({ error: "room is not available" }, { status: 409 });
  }

  const now = Date.now();
  if (checkIn < bangkokToday(now)) {
    return NextResponse.json(
      { error: "check-in date is in the past" },
      { status: 422 },
    );
  }

  if (adults + children > room.max_guests) {
    return NextResponse.json(
      { error: `exceeds room capacity (max ${room.max_guests})` },
      { status: 422 },
    );
  }

  // Lazily free this room's expired 15-minute holds so a stale `pending_payment`
  // row neither shows as unavailable nor blocks the insert (EXCLUDE constraint) —
  // independent of the once-daily cleanup cron.
  await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("room_id", roomId)
    .eq("status", "pending_payment")
    .lt("created_at", holdExpiryCutoffIso(now));

  // App-level pre-check; the DB EXCLUDE constraint is the real guarantee.
  const availability = await checkAvailability(admin, roomId, checkIn, checkOut);
  if (!availability.available) {
    return NextResponse.json(
      { error: "dates not available", reason: availability.reason },
      { status: 409 },
    );
  }

  const pricing = calculateBookingTotal({
    priceWeekday: room.price_weekday,
    priceWeekend: room.price_weekend,
    checkIn,
    checkOut,
    extraBed,
  });

  // ── Insert, retrying on booking_code collisions; an overlap is terminal. ──
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const bookingCode = await generateBookingCode(admin);

    const { data: inserted, error: insertErr } = await admin
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        customer_id: customer.id,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        extra_bed: extraBed,
        base_amount: pricing.baseAmount,
        extra_bed_amount: pricing.extraBedAmount,
        total_amount: pricing.totalAmount,
        status: "pending_payment",
        notes: notes ?? null,
      })
      .select("id, booking_code, status, nights, total_amount, created_at")
      .single();

    if (!insertErr && inserted) {
      const createdAtMs = new Date(inserted.created_at as string).getTime();
      return NextResponse.json(
        {
          id: inserted.id,
          bookingCode: inserted.booking_code,
          status: inserted.status,
          nights: inserted.nights,
          baseAmount: pricing.baseAmount,
          extraBedAmount: pricing.extraBedAmount,
          totalAmount: inserted.total_amount,
          expiresAt: holdExpiresAtIso(createdAtMs),
        },
        { status: 201 },
      );
    }

    if (insertErr?.code === PG_EXCLUSION_VIOLATION) {
      // Someone else locked these dates between the pre-check and the insert.
      return NextResponse.json(
        { error: "dates were just taken", reason: "overlap" },
        { status: 409 },
      );
    }

    if (insertErr?.code === PG_UNIQUE_VIOLATION) {
      // booking_code race — regenerate and retry.
      continue;
    }

    return NextResponse.json(
      { error: insertErr?.message ?? "failed to create booking" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: "could not allocate a unique booking code, please retry" },
    { status: 503 },
  );
}
