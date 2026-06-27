import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBankSlip, slipAccountMatches } from "@/lib/easyslip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Admin attaches a payment slip to an existing booking (e.g. a walk-in, or any
 * booking missing a slip) as financial evidence. We run the same EasySlip
 * verification (amount + receiver account vs payment_accounts) and record a row
 * in slip_verifications so it shows in /admin/slips — but we DO NOT change the
 * booking status. The admin stays in control: if EasySlip can't read the slip
 * (no QR / unreadable / error), the verdict is recorded and the admin can still
 * confirm the booking manually with the existing confirm action.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { base64?: string } | null;
  const slipDataUrl = body?.base64;
  if (!slipDataUrl) return NextResponse.json({ error: "missing slip image" }, { status: 400 });
  const base64Only = slipDataUrl.includes(",") ? slipDataUrl.split(",")[1] : slipDataUrl;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data: booking } = await admin
    .from("bookings")
    .select("id, booking_code")
    .eq("id", id)
    .maybeSingle<{ id: string; booking_code: string }>();
  if (!booking) return NextResponse.json({ error: "booking not found" }, { status: 404 });

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; amount: number }>();
  if (!payment) return NextResponse.json({ error: "no payment row for this booking" }, { status: 404 });

  // ── Verify (best-effort — never blocks the admin). ──
  let verifyStatus = "pending";
  let verifyNote: string | null = null;
  let transRef: string | null = null;
  let verify: Awaited<ReturnType<typeof verifyBankSlip>> | null = null;
  try {
    const v = await verifyBankSlip({ base64: base64Only, matchAmount: payment.amount });
    verify = v;
    transRef = v.transRef;

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

    const { data: acctRows } = await admin
      .from("payment_accounts")
      .select("account_number")
      .eq("is_active", true)
      .not("account_number", "is", null);
    const configured = (acctRows ?? []).map((a) => a.account_number as string | null);
    const accountChecked = configured.length > 0;
    const accountMatched = !accountChecked || slipAccountMatches(v.receiverAccount, configured);

    if (!v.success) verifyStatus = "unreadable";
    else if (v.isDuplicate || dbDuplicate) verifyStatus = "duplicate";
    else if (!accountMatched) verifyStatus = "account_mismatch";
    else if (!v.isAmountMatched) verifyStatus = "amount_mismatch";
    else verifyStatus = "matched";
    verifyNote = JSON.stringify({
      amountInSlip: v.amountInSlip,
      expected: payment.amount,
      sender: v.senderName,
      receiver: v.receiverAccount,
      accountChecked,
      accountMatched,
      transRef: v.transRef,
      message: v.message,
      by: "admin",
    });
  } catch (err) {
    verifyStatus = "error";
    verifyNote = err instanceof Error ? err.message : "verification error";
  }

  // ── Store the slip image in private Storage (bucket "slips"). ──
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
    // non-fatal — the verdict is still recorded
  }

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
    await admin.from("payments").update({ ...baseUpdate, verify_status: "duplicate" }).eq("id", payment.id);
  }

  // History row (powers /admin/slips). Non-fatal.
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
    // non-fatal — the verdict is already on the payments row
  }

  // Signed URL so the UI can show the slip immediately.
  let slipImage: string | null = null;
  if (slipPath) {
    const { data: signed } = await admin.storage.from("slips").createSignedUrl(slipPath, 3600);
    slipImage = signed?.signedUrl ?? null;
  }

  return NextResponse.json({ ok: true, verify_status: verifyStatus, verify_note: verifyNote, slip_image: slipImage });
}
