import { NextResponse, type NextRequest } from "next/server";

import { holdExpiresAtIso } from "@/lib/booking/hold";
import { getActivePaymentAccounts, resolveAmountDue } from "@/lib/payment/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomerSession } from "@/lib/customer/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payment instructions for a booking: amount due (deposit/full) and the active
 * receiving accounts (bank/PromptPay details + any uploaded QR image) the guest
 * can transfer to. No QR is generated — we surface what the admin configured.
 */
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

  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

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
  if (!booking || booking.customer_id !== session.id) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
  }

  const plan = await resolveAmountDue(admin, booking.total_amount as number);
  const accounts = await getActivePaymentAccounts(admin);

  if (accounts.length === 0) {
    return NextResponse.json(
      { error: "no active payment account configured", code: "no_account" },
      { status: 409 },
    );
  }

  // Ensure a pending payment row exists for the eventual slip submission.
  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await admin.from("payments").insert({
      booking_id: booking.id,
      amount: plan.amount,
      kind: plan.kind,
      status: "pending",
    });
  } else if (existing.status === "pending") {
    await admin
      .from("payments")
      .update({ amount: plan.amount, kind: plan.kind })
      .eq("id", existing.id);
  }

  const createdMs = new Date(booking.created_at as string).getTime();

  return NextResponse.json({
    amount: plan.amount,
    kind: plan.kind,
    depositPercent: plan.depositPercent,
    accounts: accounts.map((a) => ({
      id: a.id,
      type: a.type,
      account_name: a.account_name,
      account_name_en: a.account_name_en,
      bank: a.bank,
      account_number: a.account_number,
      qr_image: a.qr_image,
    })),
    expiresAt: holdExpiresAtIso(createdMs),
    status: booking.status,
  });
}
