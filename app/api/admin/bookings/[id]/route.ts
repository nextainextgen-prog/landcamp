import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Admin confirm/reject of a booking after reviewing the submitted slip.
 * body: { action: "confirm" | "reject" }
 *  - confirm → booking 'confirmed', latest payment 'paid'
 *  - reject  → booking 'cancelled', latest payment 'failed'
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (body.action !== "confirm" && body.action !== "reject") {
    return NextResponse.json({ error: "action must be confirm or reject" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
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

  // Update the latest payment row, if any.
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

  return NextResponse.json({ ok: true, status: bookingStatus });
}
