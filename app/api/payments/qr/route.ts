import { NextResponse, type NextRequest } from "next/server";

import { BOOKING_HOLD_MS, holdExpiresAtIso } from "@/lib/booking/hold";
import { generatePromptPayQR, type PromptPayKind } from "@/lib/easyslip";
import { getActivePromptPayAccount, resolveAmountDue } from "@/lib/payment/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Masks an account/phone for display: keep last 4 digits. */
function maskAccount(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `${"x".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  let body: { bookingId?: string };
  try {
    body = (await request.json()) as { bookingId?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
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

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, customer_id, status, total_amount, created_at")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (!booking || booking.customer_id !== customer.id) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
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

  const account = await getActivePromptPayAccount(admin);
  if (!account) {
    return NextResponse.json(
      { error: "no active PromptPay account configured", code: "no_promptpay_account" },
      { status: 409 },
    );
  }

  const plan = await resolveAmountDue(admin, booking.total_amount as number);

  let qr;
  try {
    qr = await generatePromptPayQR({
      kind: account.type as PromptPayKind,
      account: account.account_number,
      amount: plan.amount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "QR generation failed" },
      { status: 502 },
    );
  }

  // Reuse a pending payment row for this booking if one exists, else create it.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .maybeSingle();

  const row = {
    booking_id: booking.id,
    amount: plan.amount,
    kind: plan.kind,
    method: "promptpay",
    status: "pending" as const,
  };
  if (existing) {
    await admin.from("payments").update(row).eq("id", existing.id);
  } else {
    await admin.from("payments").insert(row);
  }

  return NextResponse.json({
    qr: { image: qr.image, mime: qr.mime, payload: qr.payload },
    amount: plan.amount,
    kind: plan.kind,
    depositPercent: plan.depositPercent,
    account: {
      name: account.account_name,
      type: account.type,
      bank: account.bank,
      number: maskAccount(account.account_number),
    },
    expiresAt: holdExpiresAtIso(createdMs),
  });
}
