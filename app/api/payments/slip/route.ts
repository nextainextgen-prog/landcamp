import { NextResponse, type NextRequest } from "next/server";

import { BOOKING_HOLD_MS } from "@/lib/booking/hold";
import { verifyBankSlip } from "@/lib/easyslip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 6_000_000; // ~4MB image

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Receives a customer payment slip. The booking moves to `payment_review` and
 * the slip is verified against EasySlip in the background — the verdict is
 * stored for admins ONLY and never returned to the customer (so a system/API
 * hiccup never surfaces as a scary "invalid slip" to the guest). An admin then
 * confirms the booking after reviewing the slip + verdict.
 */
export async function POST(request: NextRequest) {
  let body: { bookingId?: string; base64?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }
  if (!body.base64) {
    return NextResponse.json({ error: "slip image required" }, { status: 400 });
  }
  if (body.base64.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: "slip image too large (max ~4MB)" }, { status: 413 });
  }
  const slipDataUrl = body.base64;
  const base64Only = slipDataUrl.includes(",") ? slipDataUrl.split(",")[1] : slipDataUrl;

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
    .select("id, customer_id, status, total_amount, created_at")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (!booking || booking.customer_id !== customer.id) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
  }
  if (booking.status === "confirmed") {
    return NextResponse.json({ ok: true, status: "confirmed" });
  }
  if (booking.status !== "pending_payment" && booking.status !== "payment_review") {
    return NextResponse.json(
      { error: "booking is not awaiting payment", status: booking.status },
      { status: 409 },
    );
  }
  if (booking.status === "pending_payment") {
    const createdMs = new Date(booking.created_at as string).getTime();
    if (Date.now() - createdMs > BOOKING_HOLD_MS) {
      return NextResponse.json({ error: "booking hold expired" }, { status: 410 });
    }
  }

  // Ensure a payment row exists.
  let { data: payment } = await admin
    .from("payments")
    .select("id, amount")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) {
    const { data: created } = await admin
      .from("payments")
      .insert({
        booking_id: booking.id,
        amount: booking.total_amount as number,
        kind: "full",
        status: "pending",
      })
      .select("id, amount")
      .single();
    payment = created;
  }
  if (!payment) {
    return NextResponse.json({ error: "could not record payment" }, { status: 500 });
  }

  // ── Background verification — result is for admins, never the customer. ──
  let verifyStatus = "pending";
  let verifyNote: string | null = null;
  let transRef: string | null = null;
  try {
    const v = await verifyBankSlip({
      base64: base64Only,
      matchAmount: payment.amount as number,
      matchAccount: true,
    });
    transRef = v.transRef;
    if (!v.success) verifyStatus = "unreadable";
    else if (v.isDuplicate) verifyStatus = "duplicate";
    else if (!v.isAmountMatched) verifyStatus = "amount_mismatch";
    else verifyStatus = "matched";
    verifyNote = JSON.stringify({
      amountInSlip: v.amountInSlip,
      expected: payment.amount,
      sender: v.senderName,
      receiver: v.receiverAccount,
      transRef: v.transRef,
      message: v.message,
    });
  } catch (err) {
    verifyStatus = "error";
    verifyNote = err instanceof Error ? err.message : "verification error";
  }

  // Persist slip + verdict. trans_ref has a unique index; if this slip was
  // already used, downgrade to 'duplicate' and store without the ref.
  const baseUpdate = {
    slip_image: slipDataUrl,
    verify_status: verifyStatus,
    verify_note: verifyNote,
    verified_at: new Date().toISOString(),
  };
  const { error: upErr } = await admin
    .from("payments")
    .update(transRef && verifyStatus === "matched" ? { ...baseUpdate, trans_ref: transRef } : baseUpdate)
    .eq("id", payment.id);
  if (upErr?.code === PG_UNIQUE_VIOLATION) {
    await admin
      .from("payments")
      .update({ ...baseUpdate, verify_status: "duplicate" })
      .eq("id", payment.id);
  }

  // Move the booking into admin review (also keeps the dates held).
  if (booking.status === "pending_payment") {
    await admin.from("bookings").update({ status: "payment_review" }).eq("id", booking.id);
  }

  // Audit log (non-fatal).
  await admin.from("notifications").insert({
    kind: "slip_submitted",
    payload: { booking_id: booking.id, payment_id: payment.id, verify_status: verifyStatus },
  });

  // Always success to the customer — no verdict leaked.
  return NextResponse.json({ ok: true, status: "received" });
}
