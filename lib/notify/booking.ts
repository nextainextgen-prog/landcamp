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

async function loadCardData(bookingId: string) {
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

async function sendCard(bookingId: string, key: CardKey): Promise<boolean> {
  const data = await loadCardData(bookingId);
  if (!data || !data.lineUserId) return false;
  const config = await getCardConfig(key);
  if (!config.enabled) return false;
  const flex = buildCardFlex(config, data.vars);
  return pushLineMessages(data.lineUserId, [flex]);
}

/** Fired when an admin confirms a booking. */
export async function sendBookingConfirmation(bookingId: string): Promise<void> {
  try {
    const data = await loadCardData(bookingId);
    if (!data) return;
    if (data.lineUserId) {
      const config = await getCardConfig("card_confirm");
      if (config.enabled) {
        await pushLineMessages(data.lineUserId, [buildCardFlex(config, data.vars)]);
      }
    }
    // Team group alert (no-op until a group id is configured).
    await pushToTeamGroup([
      {
        type: "text",
        text: `🆕 ยืนยันการจอง ${data.vars.booking_code}\n${data.vars.name} · ${data.vars.room}\n${data.vars.check_in} – ${data.vars.check_out} · ${data.vars.total} บาท`,
      },
    ]);
  } catch {
    // notifications must never break the booking flow
  }
}

/** Fired by the reminder cron, a few days before check-in. */
export async function sendBookingReminder(bookingId: string): Promise<boolean> {
  try {
    return await sendCard(bookingId, "card_reminder");
  } catch {
    return false;
  }
}
