import { NextResponse, type NextRequest } from "next/server";

import { BOOKING_HOLD_MS } from "@/lib/booking/hold";
import { verifyBankSlip } from "@/lib/easyslip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Largest slip image we accept as base64 (~4MB raw → ~5.5MB base64).
const MAX_BASE64_LEN = 6_000_000;

export async function POST(request: NextRequest) {
  let body: { bookingId?: string; base64?: string; payload?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }
  if (!body.base64 && !body.payload) {
    return NextResponse.json({ error: "slip image or payload required" }, { status: 400 });
  }
  // Accept a data: URL too — strip the prefix.
  const base64 = body.base64?.includes(",") ? body.base64.split(",")[1] : body.base64;
  if (base64 && base64.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: "slip image too large (max ~4MB)" }, { status: 413 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!customer) {
    return NextResponse.json({ error: "customer profile not found" }, { status: 404 });
  }

  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id, status, created_at")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (!booking || booking.customer_id !== customer.id) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
  }
  if (booking.status === "confirmed") {
    return NextResponse.json({ ok: true, status: "confirmed", alreadyConfirmed: true });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json(
      { error: "booking is not awaiting payment", status: booking.status },
      { status: 409 },
    );
  }
  const createdMs = new Date(booking.created_at as string).getTime();
  if (Date.now() - createdMs > BOOKING_HOLD_MS) {
    return NextResponse.json({ error: "booking hold expired" }, { status: 410 });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .maybeSingle();
  if (!payment) {
    return NextResponse.json(
      { error: "no pending payment — generate a QR first" },
      { status: 409 },
    );
  }

  // ── Verify the slip against EasySlip ──
  let verify;
  try {
    verify = await verifyBankSlip({
      base64: base64 || undefined,
      payload: body.payload,
      matchAmount: payment.amount as number,
      matchAccount: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "slip verification failed" },
      { status: 502 },
    );
  }

  if (!verify.success) {
    return NextResponse.json(
      { error: verify.message ?? "could not read slip", code: "verify_failed" },
      { status: 422 },
    );
  }
  if (verify.isDuplicate) {
    return NextResponse.json(
      { error: "this slip has already been used", code: "duplicate" },
      { status: 409 },
    );
  }
  if (!verify.isAmountMatched) {
    return NextResponse.json(
      {
        error: "amount on the slip does not match",
        code: "amount_mismatch",
        expected: payment.amount,
        got: verify.amountInSlip,
      },
      { status: 422 },
    );
  }

  // ── Settle: mark payment paid + confirm booking ──
  const { error: payErr } = await admin
    .from("payments")
    .update({
      status: "paid",
      paid_at: verify.paidAt ?? new Date().toISOString(),
      verified_at: new Date().toISOString(),
      trans_ref: verify.transRef,
    })
    .eq("id", payment.id);

  if (payErr) {
    // Unique violation on trans_ref → slip already settled another payment.
    if (payErr.code === "23505") {
      return NextResponse.json(
        { error: "this slip has already been used", code: "duplicate" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  const { error: bookErr } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", booking.id);
  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }

  // Best-effort audit log (non-fatal).
  await admin.from("notifications").insert({
    kind: "payment_confirmed",
    payload: {
      booking_id: booking.id,
      payment_id: payment.id,
      trans_ref: verify.transRef,
      amount: payment.amount,
      sender: verify.senderName,
    },
  });

  return NextResponse.json({
    ok: true,
    status: "confirmed",
    transRef: verify.transRef,
    amount: payment.amount,
  });
}
