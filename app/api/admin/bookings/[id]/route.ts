import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/notify/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DIRECT_STATUSES = new Set([
  "pending_payment",
  "payment_review",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

/**
 * Admin booking status update.
 * body: { action: "confirm" | "reject" } — slip review with payment side-effects:
 *   - confirm → booking 'confirmed', latest payment 'paid'
 *   - reject  → booking 'cancelled', latest payment 'failed'
 * or  { status: <BookingStatus> } — direct manual status change (e.g. completed,
 *   no_show, cancelled) with no payment side-effects.
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  type EditBody = {
    check_in?: string;
    check_out?: string;
    adults?: number;
    children?: number;
    total_amount?: number;
  };
  let body: { action?: string; status?: string; notes?: string; edit?: EditBody };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Internal note / special-request update (no status change).
  if (!body.action && !body.status && typeof body.notes === "string") {
    const { error } = await admin.from("bookings").update({ notes: body.notes }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, notes: body.notes });
  }

  // Edit booking fields (dates / guests / total). The DB EXCLUDE constraint
  // rejects date overlaps for active bookings, surfaced as an error.
  if (!body.action && !body.status && body.edit) {
    const e = body.edit;
    const patch: Record<string, unknown> = {};
    if (typeof e.check_in === "string") patch.check_in = e.check_in;
    if (typeof e.check_out === "string") patch.check_out = e.check_out;
    if (typeof e.adults === "number" && e.adults >= 1) patch.adults = e.adults;
    if (typeof e.children === "number" && e.children >= 0) patch.children = e.children;
    if (typeof e.total_amount === "number" && e.total_amount >= 0) patch.total_amount = e.total_amount;
    const ci = (patch.check_in as string) ?? null;
    const co = (patch.check_out as string) ?? null;
    if (ci && co && co <= ci) {
      return NextResponse.json({ error: "วันเช็คเอาท์ต้องหลังวันเช็คอิน" }, { status: 400 });
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
    }
    const { error } = await admin.from("bookings").update(patch).eq("id", id);
    if (error) {
      const msg = /exclu|overlap|conflict/i.test(error.message) ? "ช่วงวันที่ชนกับการจองอื่นของห้องนี้" : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, edit: patch });
  }

  // Direct status change (no payment side-effects).
  if (!body.action && body.status) {
    if (!DIRECT_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const { data, error } = await admin
      .from("bookings")
      .update({ status: body.status })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "booking not found" }, { status: 404 });
    return NextResponse.json({ ok: true, status: body.status });
  }

  if (body.action !== "confirm" && body.action !== "reject") {
    return NextResponse.json({ error: "action must be confirm or reject" }, { status: 400 });
  }

  const bookingStatus = body.action === "confirm" ? "confirmed" : "cancelled";
  const paymentStatus = body.action === "confirm" ? "paid" : "failed";

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .update({ status: bookingStatus })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: "booking not found" }, { status: 404 });

  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (payment) {
    await admin
      .from("payments")
      .update({
        status: paymentStatus,
        ...(body.action === "confirm" ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", payment.id);
  }

  // On confirm: push the LINE confirmation card to the customer (non-fatal).
  if (body.action === "confirm") {
    await sendBookingConfirmation(id);
  }

  return NextResponse.json({ ok: true, status: bookingStatus });
}
