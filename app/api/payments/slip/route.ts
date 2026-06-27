import { NextResponse, type NextRequest } from "next/server";

import { BOOKING_HOLD_MS } from "@/lib/booking/hold";
import { confirmBookingPaid } from "@/lib/booking/confirm";
import { notifyTeamSlipPending } from "@/lib/notify/booking";
import { verifyBankSlip } from "@/lib/easyslip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomerSession } from "@/lib/customer/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 6_000_000; // ~4MB image

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Receives a customer payment slip, verifies it against EasySlip, then decides
 * automatically what happens next:
 *   • matched    (QR readable + amount + receiver account ok + not duplicate)
 *                → confirm the booking automatically (no manual review).
 *   • duplicate  (slip already used) → don't advance; ask the guest to re-submit.
 *   • anything else (no QR / unreadable / amount or name mismatch / API error)
 *                → `payment_review` for an admin to check by hand.
 * The full verdict is still stored for admins; the guest only gets a friendly,
 * non-scary summary of the decision.
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

  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }
  const customer = { id: session.id };

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
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
  let verify: Awaited<ReturnType<typeof verifyBankSlip>> | null = null;
  try {
    const v = await verifyBankSlip({
      base64: base64Only,
      matchAmount: payment.amount as number,
      matchAccount: true,
    });
    verify = v;
    transRef = v.transRef;

    // Duplicate detection runs in THREE layers — a duplicate must never slip
    // through as "matched":
    //   1. EasySlip's own checkDuplicate (v.isDuplicate).
    //   2. Our DB: was this exact transRef already accepted on ANOTHER booking?
    //      (covers cases EasySlip's per-account cache might miss.)
    //   3. The unique index on payments.trans_ref (final guard, handled below).
    let dbDuplicate = false;
    if (transRef) {
      const { data: prior } = await admin
        .from("slip_verifications")
        .select("id")
        .eq("trans_ref", transRef)
        .eq("verify_status", "matched")
        .neq("booking_id", booking.id)
        .limit(1);
      dbDuplicate = Boolean(prior && prior.length);
    }

    if (!v.success) verifyStatus = "unreadable";
    else if (v.isDuplicate || dbDuplicate) verifyStatus = "duplicate";
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

  // Upload the slip image to private Storage (bucket "slips") instead of
  // bloating the DB with base64. Store the object path in slip_url.
  let slipPath: string | null = null;
  try {
    const mimeMatch = slipDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const ext = (mimeMatch?.[1].split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const bytes = Buffer.from(base64Only ?? "", "base64");
    const path = `${booking.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("slips")
      .upload(path, bytes, { contentType: mimeMatch?.[1] ?? "image/jpeg", upsert: false });
    if (!upErr) slipPath = path;
  } catch {
    // non-fatal — verdict is still recorded; admin can re-request the slip
  }

  // Persist slip path + verdict. trans_ref has a unique index. We claim the ref
  // for any non-duplicate verdict (matched OR amount_mismatch) so a real slip
  // can't be reused on a different booking even when the amount was wrong — if
  // the ref is already taken, the unique index fires and we downgrade to
  // 'duplicate' (the final, race-proof layer of duplicate detection).
  const verifiedAt = new Date().toISOString();
  const baseUpdate = {
    slip_url: slipPath,
    verify_status: verifyStatus,
    verify_note: verifyNote,
    verified_at: verifiedAt,
  };
  const claimsRef = Boolean(transRef) && verifyStatus !== "duplicate";
  const { error: upErr } = await admin
    .from("payments")
    .update(claimsRef ? { ...baseUpdate, trans_ref: transRef } : baseUpdate)
    .eq("id", payment.id);
  if (upErr?.code === PG_UNIQUE_VIOLATION) {
    verifyStatus = "duplicate";
    await admin
      .from("payments")
      .update({ ...baseUpdate, verify_status: "duplicate" })
      .eq("id", payment.id);
  }

  // Record one history row per verification attempt (never overwrites — this is
  // the audit trail powering /admin/slips). Non-fatal.
  try {
    await admin.from("slip_verifications").insert({
      booking_id: booking.id,
      payment_id: payment.id,
      api_success: verify?.success ?? false,
      verify_status: verifyStatus,
      is_duplicate: verifyStatus === "duplicate",
      trans_ref: transRef,
      amount_in_slip: verify?.amountInSlip ?? null,
      amount_expected: payment.amount,
      is_amount_matched: verify?.isAmountMatched ?? false,
      sender_name: verify?.senderName ?? null,
      sender_bank: verify?.senderBank ?? null,
      receiver_name: verify?.receiverNameTh ?? verify?.receiverNameEn ?? null,
      receiver_bank: verify?.receiverBank ?? null,
      receiver_account: verify?.receiverAccount ?? null,
      slip_paid_at: verify?.paidAt ?? null,
      ref1: verify?.ref1 ?? null,
      ref2: verify?.ref2 ?? null,
      ref3: verify?.ref3 ?? null,
      slip_url: slipPath,
      message: verify?.message ?? verifyNote,
      raw: verify?.raw ?? null,
    });
  } catch {
    // non-fatal — the verdict is already on the payments row.
  }

  // ── Auto-decision from the verdict ──
  let decision: "confirmed" | "review" | "duplicate";
  if (verifyStatus === "matched") {
    // Fully valid slip → confirm exactly like a manual admin confirm.
    decision = "confirmed";
    await confirmBookingPaid(admin, booking.id, { actor: "auto-verify", method: "transfer" });
  } else if (verifyStatus === "duplicate") {
    // Reused slip — leave the booking where it is so the guest can transfer and
    // attach a genuine slip (or rebook if the hold has expired).
    decision = "duplicate";
  } else {
    // No QR / unreadable / amount or name mismatch / API error → human review.
    decision = "review";
    if (booking.status === "pending_payment") {
      await admin.from("bookings").update({ status: "payment_review" }).eq("id", booking.id);
    }
  }

  // Audit log (non-fatal).
  await admin.from("notifications").insert({
    kind: "slip_submitted",
    payload: { booking_id: booking.id, payment_id: payment.id, verify_status: verifyStatus, decision },
  });

  // Alert the team group only when the slip needs human action — a "matched"
  // slip already auto-confirmed (which sends its own confirmation alert).
  if (decision === "review" || decision === "duplicate") {
    await notifyTeamSlipPending(booking.id, verifyStatus);
  }

  const CUSTOMER_MESSAGE = {
    confirmed: "ชำระเงินสำเร็จ ยืนยันการจองเรียบร้อยแล้ว ขอบคุณครับ",
    review: "ได้รับสลิปแล้ว ทีมงานกำลังตรวจสอบ จะยืนยันให้เร็วที่สุดครับ",
    duplicate: "สลิปนี้เคยถูกใช้ไปแล้ว กรุณาโอนชำระและแนบสลิปใหม่อีกครั้งครับ",
  } as const;

  // A duplicate is a soft failure so the customer UI lets them re-attach.
  return NextResponse.json({
    ok: decision !== "duplicate",
    decision,
    status: decision === "confirmed" ? "confirmed" : "received",
    message: CUSTOMER_MESSAGE[decision],
  });
}
