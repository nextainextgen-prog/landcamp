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

/* ──────────────────────────────────────────────────────────────────────────
 * Team-group operational alerts (Thai; emoji OK — these are LINE messages, not
 * website UI). All push to the configured team group and no-op when no group id
 * is set, so callers never break.
 * ────────────────────────────────────────────────────────────────────────── */

type TeamBooking = {
  booking_code: string;
  status: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_amount: number;
  source: string | null;
  customer_id: string;
  room_id: string;
};

async function loadTeamBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  bookingId: string,
): Promise<{ b: TeamBooking; name: string; phone: string | null; room: string } | null> {
  const { data: b } = await admin
    .from("bookings")
    .select("booking_code, status, check_in, check_out, adults, children, total_amount, source, customer_id, room_id")
    .eq("id", bookingId)
    .maybeSingle<TeamBooking>();
  if (!b) return null;
  const { data: c } = await admin
    .from("customers")
    .select("full_name, phone")
    .eq("id", b.customer_id)
    .maybeSingle<{ full_name: string | null; phone: string | null }>();
  const { data: r } = await admin
    .from("rooms")
    .select("name_th")
    .eq("id", b.room_id)
    .maybeSingle<{ name_th: string | null }>();
  return { b, name: c?.full_name ?? "ลูกค้า", phone: c?.phone ?? null, room: r?.name_th ?? "" };
}

const SOURCE_TH: Record<string, string> = {
  online: "จองออนไลน์",
  walk_in: "Walk-in",
  manual: "เพิ่มเอง",
};
const SLIP_VERDICT_TH: Record<string, string> = {
  matched: "✅ สลิปถูกต้อง",
  amount_mismatch: "⚠️ ยอดไม่ตรง",
  duplicate: "⚠️ สลิปซ้ำ",
  unreadable: "❓ อ่านสลิปไม่ออก",
  error: "❓ ตรวจสลิปไม่สำเร็จ",
};
const thb = (n: number) => n.toLocaleString("en-US");
const guestText = (a: number, c: number) => `${a} ผู้ใหญ่${c ? ` · ${c} เด็ก` : ""}`;
const nameLine = (name: string, phone: string | null) => `${name}${phone ? ` · ${phone}` : ""}`;

/** Fired when a customer creates an online booking (status pending_payment). */
export async function notifyTeamNewBooking(bookingId: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const info = await loadTeamBooking(admin, bookingId);
    if (!info) return;
    const { b, name, phone, room } = info;
    await pushToTeamGroup([
      {
        type: "text",
        text:
          `📥 มีจองใหม่ · รอชำระเงิน\n${b.booking_code} · ${room}\n${nameLine(name, phone)}\n` +
          `เข้าพัก ${thaiDate(b.check_in)} – ${thaiDate(b.check_out)} · ${guestText(b.adults, b.children)}\n` +
          `ยอด ${thb(b.total_amount)} บาท · ช่องทาง: ${SOURCE_TH[b.source ?? "online"] ?? "จองออนไลน์"}`,
      },
    ]);
  } catch {
    // best-effort
  }
}

/** Fired when a customer attaches a slip that needs manual review/confirmation. */
export async function notifyTeamSlipPending(bookingId: string, verifyStatus: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const info = await loadTeamBooking(admin, bookingId);
    if (!info) return;
    const { b, name, phone, room } = info;
    await pushToTeamGroup([
      {
        type: "text",
        text:
          `🧾 ลูกค้าแนบสลิปแล้ว · รอยืนยัน\n${b.booking_code} · ${room}\n${nameLine(name, phone)}\n` +
          `ยอด ${thb(b.total_amount)} บาท\nผลตรวจสลิป: ${SLIP_VERDICT_TH[verifyStatus] ?? "—"}\n` +
          `→ เข้าตรวจ/ยืนยันที่หลังบ้าน`,
      },
    ]);
  } catch {
    // best-effort
  }
}

/**
 * Daily morning digest to the team: today's arrivals (check-in) and departures
 * (check-out). Called by the daily cron. Skips sending when both are empty.
 */
export async function notifyTeamDailyDigest(todayBkk: string): Promise<{ checkIn: number; checkOut: number }> {
  const result = { checkIn: 0, checkOut: 0 };
  try {
    const admin = createSupabaseAdminClient();
    const [{ data: ins }, { data: outs }] = await Promise.all([
      admin.from("bookings").select("booking_code, room_id, customer_id").eq("status", "confirmed").eq("check_in", todayBkk).order("booking_code").limit(50),
      admin.from("bookings").select("booking_code, room_id, customer_id").eq("status", "confirmed").eq("check_out", todayBkk).order("booking_code").limit(50),
    ]);
    const inRows = (ins ?? []) as { booking_code: string; room_id: string; customer_id: string }[];
    const outRows = (outs ?? []) as { booking_code: string; room_id: string; customer_id: string }[];
    result.checkIn = inRows.length;
    result.checkOut = outRows.length;
    // Only post the digest on days that have at least one arrival (check-in).
    // A day with no check-ins (even if it has check-outs) stays quiet, so the
    // team isn't pinged every morning — per owner preference.
    if (!inRows.length) return result;

    const roomIds = [...new Set([...inRows, ...outRows].map((r) => r.room_id))];
    const custIds = [...new Set([...inRows, ...outRows].map((r) => r.customer_id))];
    const [{ data: rooms }, { data: custs }] = await Promise.all([
      roomIds.length ? admin.from("rooms").select("id, name_th").in("id", roomIds) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      custIds.length ? admin.from("customers").select("id, full_name, phone").in("id", custIds) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);
    const roomMap = new Map((rooms ?? []).map((r) => [r.id as string, (r.name_th as string) ?? ""]));
    const custMap = new Map((custs ?? []).map((c) => [c.id as string, { name: (c.full_name as string) ?? "ลูกค้า", phone: (c.phone as string) ?? null }]));
    const line = (r: { booking_code: string; room_id: string; customer_id: string }) => {
      const c = custMap.get(r.customer_id);
      return `• ${r.booking_code} · ${roomMap.get(r.room_id) ?? ""} · ${nameLine(c?.name ?? "ลูกค้า", c?.phone ?? null)}`;
    };

    const blocks: string[] = [];
    if (inRows.length) blocks.push(`🏡 เช็คอินวันนี้ (${inRows.length} รายการ)\n${inRows.map(line).join("\n")}`);
    if (outRows.length) blocks.push(`🧳 เช็คเอาท์วันนี้ (${outRows.length} รายการ)\n${outRows.map(line).join("\n")}`);
    await pushToTeamGroup([{ type: "text", text: blocks.join("\n\n") }]);
  } catch {
    // best-effort
  }
  return result;
}
