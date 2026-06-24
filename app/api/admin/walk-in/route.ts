import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { checkAvailability } from "@/lib/booking/availability";
import { generateBookingCode } from "@/lib/booking/code";
import { calculateBookingTotal } from "@/lib/booking/pricing";
import { WalkInSchema } from "@/lib/schemas/admin-crm";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/** Today's date (YYYY-MM-DD) in Asia/Bangkok, so "check in today" is allowed. */
function bangkokToday(nowMs: number): string {
  const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(nowMs + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Front-desk walk-in reservation. Unlike online bookings these are created by
 * staff for a guest standing at the counter, so the booking is `confirmed`
 * immediately (never `pending_payment` — that would be auto-cancelled by the
 * 15-minute hold cron). Payment state lives on the payments row instead.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = WalkInSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    fullName,
    phone,
    email,
    roomId,
    checkIn,
    checkOut,
    adults,
    children,
    extraBed,
    method,
    paid,
    notes,
  } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // ── Validate the room + booking constraints. ──
  const { data: roomRow, error: roomErr } = await admin
    .from("rooms")
    .select("id, price_weekday, price_weekend, max_guests, is_available")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 });
  if (!roomRow) return NextResponse.json({ error: "room not found" }, { status: 404 });

  const room = roomRow as RoomRow;
  if (!room.is_available) {
    return NextResponse.json({ error: "room is not available" }, { status: 409 });
  }
  if (checkIn < bangkokToday(Date.now())) {
    return NextResponse.json({ error: "check-in date is in the past" }, { status: 422 });
  }
  if (adults + children > room.max_guests) {
    return NextResponse.json(
      { error: `exceeds room capacity (max ${room.max_guests})` },
      { status: 422 },
    );
  }

  const availability = await checkAvailability(admin, roomId, checkIn, checkOut);
  if (!availability.available) {
    return NextResponse.json(
      { error: "dates not available", reason: availability.reason },
      { status: 409 },
    );
  }

  // ── Match an existing customer by phone, then email; else create one. ──
  const cleanPhone = phone.trim();
  const cleanEmail = (email ?? "").trim();
  let customerId: string | null = null;

  if (cleanPhone) {
    const { data } = await admin
      .from("customers")
      .select("id")
      .eq("phone", cleanPhone)
      .limit(1)
      .maybeSingle();
    customerId = (data?.id as string) ?? null;
  }
  if (!customerId && cleanEmail) {
    const { data } = await admin
      .from("customers")
      .select("id")
      .eq("email", cleanEmail)
      .limit(1)
      .maybeSingle();
    customerId = (data?.id as string) ?? null;
  }
  if (!customerId) {
    const { data: created, error: custErr } = await admin
      .from("customers")
      .insert({
        full_name: fullName,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        source: "walk_in",
      })
      .select("id")
      .single();
    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });
    customerId = created.id as string;
  }

  const pricing = calculateBookingTotal({
    priceWeekday: room.price_weekday,
    priceWeekend: room.price_weekend,
    checkIn,
    checkOut,
    extraBed,
  });

  // ── Insert booking, retrying on code collisions; an overlap is terminal. ──
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const bookingCode = await generateBookingCode(admin);

    const { data: inserted, error: insertErr } = await admin
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        customer_id: customerId,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        extra_bed: extraBed,
        base_amount: pricing.baseAmount,
        extra_bed_amount: pricing.extraBedAmount,
        total_amount: pricing.totalAmount,
        status: "confirmed",
        source: "walk_in",
        created_by: auth.userId,
        notes: notes || null,
      })
      .select("id, booking_code, total_amount")
      .single();

    if (!insertErr && inserted) {
      // Record the payment alongside the booking.
      const { error: payErr } = await admin.from("payments").insert({
        booking_id: inserted.id,
        amount: pricing.totalAmount,
        kind: "full",
        method,
        status: paid ? "paid" : "pending",
        paid_at: paid ? new Date().toISOString() : null,
      });
      if (payErr) {
        return NextResponse.json(
          { error: `booking created but payment failed: ${payErr.message}`, bookingCode },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          id: inserted.id,
          bookingCode: inserted.booking_code,
          customerId,
          totalAmount: inserted.total_amount,
          paid,
        },
        { status: 201 },
      );
    }

    if (insertErr?.code === PG_EXCLUSION_VIOLATION) {
      return NextResponse.json(
        { error: "dates were just taken", reason: "overlap" },
        { status: 409 },
      );
    }
    if (insertErr?.code === PG_UNIQUE_VIOLATION) {
      continue; // booking_code race — regenerate and retry
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
