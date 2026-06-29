import { NextResponse } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { sendBookingConfirmation, sendBookingReminder } from "@/lib/notify/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which card the admin chose to (re)send. Both senders already exist and log to
// the notifications history; the reminder is de-duped by the cron so a manual
// send here won't double up with the automatic day-before reminder.
const SENDERS = {
  card_confirm: sendBookingConfirmation,
  card_reminder: sendBookingReminder,
} as const;
type CardKind = keyof typeof SENDERS;

/**
 * Re-sends a LINE card for a booking. `kind` picks the card (defaults to the
 * confirmation for backward-compat). Returns `sent` = whether it was actually
 * pushed (false when the customer isn't LINE-linked or the card is disabled).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSection("bookings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { kind?: string } | null;
  const kind: CardKind = body?.kind === "card_reminder" ? "card_reminder" : "card_confirm";

  const sent = await SENDERS[kind](id);
  return NextResponse.json({ ok: true, sent });
}
