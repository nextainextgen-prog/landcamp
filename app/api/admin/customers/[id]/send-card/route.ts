import { NextResponse } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/notify/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manually (re)sends the LINE confirmation card for one of this customer's
 * bookings, from the customer profile page. Gated by the `customers` section so
 * staff who manage customers can trigger it without needing `bookings` access.
 * The send is logged to the notifications history by sendBookingConfirmation.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("customers");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const bookingId =
    body && typeof body === "object" && typeof (body as { bookingId?: unknown }).bookingId === "string"
      ? (body as { bookingId: string }).bookingId
      : null;
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.customer_id !== id) {
    return NextResponse.json(
      { error: "booking not found for this customer" },
      { status: 404 },
    );
  }

  const ok = await sendBookingConfirmation(bookingId);
  return NextResponse.json({ ok });
}
