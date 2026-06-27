/**
 * Booking notifications — sends the LINE confirmation / reminder cards to the
 * customer (and a short text alert to the team group). All sends are no-ops
 * when LINE isn't configured or the customer has no line_user_id, so callers
 * never break.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/data/siteConfig";
import { buildCardFlex, getCardConfig, type CardKey } from "@/lib/line/cards";
import { pushLineMessages, pushToTeamGroup } from "@/lib/line/messaging";

function thaiDate(d: string): string {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

type BookingForCard = {
  booking_code: string;
  customer_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  total_amount: number;
};

export async function loadCardData(bookingId: string) {
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("booking_code, customer_id, room_id, check_in, check_out, total_amount")
    .eq("id", bookingId)
    .maybeSingle<BookingForCard>();
  if (!booking) return null;

  const { data: customer } = await admin
    .from("customers")
    .select("line_user_id, full_name")
    .eq("id", booking.customer_id)
    .maybeSingle<{ line_user_id: string | null; full_name: string | null }>();

  const { data: room } = await admin
    .from("rooms")
    .select("name_th")
    .eq("id", booking.room_id)
    .maybeSingle<{ name_th: string | null }>();

  const vars: Record<string, string> = {
    name: customer?.full_name ?? "ลูกค้า",
    booking_code: booking.booking_code,
    room: room?.name_th ?? "",
    check_in: thaiDate(booking.check_in),
    check_out: thaiDate(booking.check_out),
    total: booking.total_amount.toLocaleString("en-US"),
    receipt_url: `${siteConfig.seo.siteUrl}/booking/${booking.booking_code}`,
    map_url: siteConfig.contact.googleMaps,
  };

  return { booking, lineUserId: customer?.line_user_id ?? null, vars };
}

type CardData = NonNullable<Awaited<ReturnType<typeof loadCardData>>>;

/**
 * Records a card-send attempt in the `notifications` log so admins get a
 * per-customer history (ส​่งสำเร็จ / ส่งไม่สำเร็จ / ไม่ได้ส่ง). Never throws —
 * logging must not break the send.
 */
async function logCardSend(
  bookingId: string,
  data: CardData,
  key: CardKey,
  ok: boolean,
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const status = ok ? "sent" : data.lineUserId ? "failed" : "skipped";
    await admin.from("notifications").insert({
      kind: key,
      status,
      sent_at: ok ? new Date().toISOString() : null,
      payload: {
        channel: "line",
        customer_id: data.booking.customer_id,
        booking_id: bookingId,
        booking_code: data.booking.booking_code,
        line_user_id: data.lineUserId,
        ok,
      },
    });
  } catch {
    // ignore — history logging is best-effort
  }
}

/** Sends one card type to the customer (if LINE-linked + enabled) and logs it. */
async function sendCardFor(bookingId: string, data: CardData, key: CardKey): Promise<boolean> {
  let ok = false;
  if (data.lineUserId) {
    const config = await getCardConfig(key);
    if (config.enabled) {
      ok = await pushLineMessages(data.lineUserId, [buildCardFlex(config, data.vars)]);
    }
  }
  await logCardSend(bookingId, data, key, ok);
  return ok;
}

/** Fired when an admin confirms a booking (and by the manual resend buttons). */
export async function sendBookingConfirmation(bookingId: string): Promise<boolean> {
  try {
    const data = await loadCardData(bookingId);
    if (!data) return false;
    const ok = await sendCardFor(bookingId, data, "card_confirm");
    // Team group alert (no-op until a group id is configured).
    await pushToTeamGroup([
      {
        type: "text",
        text: `🆕 ยืนยันการจอง ${data.vars.booking_code}\n${data.vars.name} · ${data.vars.room}\n${data.vars.check_in} – ${data.vars.check_out} · ${data.vars.total} บาท`,
      },
    ]);
    return ok;
  } catch {
    // notifications must never break the booking flow
    return false;
  }
}

/** Fired by the reminder cron, a day before check-in. */
export async function sendBookingReminder(bookingId: string): Promise<boolean> {
  try {
    const data = await loadCardData(bookingId);
    if (!data) return false;
    return await sendCardFor(bookingId, data, "card_reminder");
  } catch {
    return false;
  }
}
