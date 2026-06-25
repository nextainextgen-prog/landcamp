import { NextResponse } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { sendBookingConfirmation } from "@/lib/notify/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Re-sends the LINE confirmation card for a booking. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  await sendBookingConfirmation(id);
  return NextResponse.json({ ok: true });
}
