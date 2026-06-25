import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aggregated admin notification feed — "แจ้งเตือนทุกอย่าง".
 *
 * Rather than a dedicated table, this stitches together the most recent
 * activity across the system into a single, time-sorted stream:
 *   • bookings awaiting slip review   (action needed)
 *   • new bookings (online + walk-in)
 *   • today's check-ins
 *   • new customers
 *   • new website leads (enquiries)
 *
 * The client decides what counts as "unread" by comparing each item's `ts`
 * against a locally-stored last-seen timestamp, so no write path is required.
 */

type Notice = {
  id: string;
  kind: "payment" | "booking" | "checkin" | "customer" | "lead";
  title: string;
  body: string;
  href: string;
  ts: string; // ISO
  priority?: boolean;
};

const LOOKBACK_DAYS = 14;
const PER_KIND = 12;
const MAX_ITEMS = 40;

function thaiDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "supabase unavailable" },
      { status: 500 },
    );
  }

  const sinceIso = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [
    { data: review },
    { data: recentBookings },
    { data: checkins },
    { data: customers },
    { data: leads },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select("id, booking_code, customer_id, total_amount, updated_at, created_at")
      .eq("status", "payment_review")
      .order("updated_at", { ascending: false })
      .limit(PER_KIND),
    admin
      .from("bookings")
      .select("id, booking_code, customer_id, check_in, source, total_amount, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(PER_KIND),
    admin
      .from("bookings")
      .select("id, booking_code, customer_id, check_in, created_at")
      .in("status", ["confirmed", "pending_payment"])
      .gte("check_in", today)
      .lte("check_in", tomorrow)
      .order("check_in", { ascending: true })
      .limit(PER_KIND),
    admin
      .from("customers")
      .select("id, full_name, phone, source, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(PER_KIND),
    admin
      .from("leads")
      .select("id, name, phone, checkin_date, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(PER_KIND),
  ]);

  // Resolve customer display names for the booking-derived notices.
  const custIds = new Set<string>();
  for (const b of review ?? []) if (b.customer_id) custIds.add(b.customer_id as string);
  for (const b of recentBookings ?? []) if (b.customer_id) custIds.add(b.customer_id as string);
  for (const b of checkins ?? []) if (b.customer_id) custIds.add(b.customer_id as string);

  const nameMap = new Map<string, string>();
  if (custIds.size > 0) {
    const { data: custRows } = await admin
      .from("customers")
      .select("id, full_name")
      .in("id", [...custIds]);
    for (const c of custRows ?? []) {
      nameMap.set(c.id as string, ((c.full_name as string) || "ลูกค้า").trim());
    }
  }
  const who = (id: unknown) => nameMap.get(id as string) || "ลูกค้า";

  const items: Notice[] = [];

  for (const b of review ?? []) {
    items.push({
      id: `pay-${b.id}`,
      kind: "payment",
      title: "รอตรวจสลิปโอนเงิน",
      body: `${who(b.customer_id)} · ${b.booking_code ?? "—"}`,
      href: "/admin/bookings",
      ts: (b.updated_at as string) ?? (b.created_at as string),
      priority: true,
    });
  }

  for (const b of recentBookings ?? []) {
    const isWalkIn = b.source === "walk_in";
    items.push({
      id: `bk-${b.id}`,
      kind: "booking",
      title: isWalkIn ? "การจองใหม่ (Walk-in)" : "การจองใหม่",
      body: `${who(b.customer_id)} · เข้าพัก ${thaiDate(b.check_in as string)}`,
      href: "/admin/bookings",
      ts: b.created_at as string,
    });
  }

  for (const b of checkins ?? []) {
    const sameDay = (b.check_in as string) === today;
    items.push({
      id: `ci-${b.id}`,
      kind: "checkin",
      title: sameDay ? "เช็คอินวันนี้" : "เช็คอินพรุ่งนี้",
      body: `${who(b.customer_id)} · ${b.booking_code ?? "—"}`,
      href: "/admin/calendar",
      // Surface against "now" so it ranks near the top of the feed.
      ts: new Date().toISOString(),
    });
  }

  for (const c of customers ?? []) {
    const channel = c.source === "walk_in" ? "Walk-in" : c.source === "manual" ? "เพิ่มเอง" : "ออนไลน์";
    items.push({
      id: `cu-${c.id}`,
      kind: "customer",
      title: "ลูกค้าใหม่",
      body: `${(c.full_name as string) || "ลูกค้า"} · ${channel}`,
      href: `/admin/customers/${c.id}`,
      ts: c.created_at as string,
    });
  }

  for (const l of leads ?? []) {
    items.push({
      id: `ld-${l.id}`,
      kind: "lead",
      title: "ลูกค้าสนใจจองจากหน้าเว็บ",
      body: `${(l.name as string) || "—"}${l.phone ? ` · ${l.phone}` : ""}`,
      href: "/admin/customers",
      ts: l.created_at as string,
    });
  }

  items.sort((a, b) => {
    // Action-needed (payment) floats above same-time items.
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return (b.ts ?? "").localeCompare(a.ts ?? "");
  });

  return NextResponse.json({ items: items.slice(0, MAX_ITEMS) });
}
