import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarDashboard, type CalBooking, type CalRoom } from "./CalendarDashboard";

export const dynamic = "force-dynamic";

/** Today's date (YYYY-MM-DD) in Asia/Bangkok, computed server-side for stability. */
function bangkokToday(): string {
  const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(Date.now() + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Wall-clock at request time (force-dynamic page) for relative "time ago". */
function serverNowMs(): number {
  return Date.now();
}

function nights(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export default async function AdminCalendarPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: bookingsData }, { data: rooms }, { data: customers }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, booking_code, room_id, customer_id, check_in, check_out, status, total_amount, adults, children, created_at",
      )
      .neq("status", "cancelled")
      .order("check_in", { ascending: true }),
    admin.from("rooms").select("id, name_th, display_order").order("display_order"),
    admin.from("customers").select("id, full_name, avatar_url, phone, is_vip"),
  ]);

  const roomName = new Map((rooms ?? []).map((r) => [r.id as string, r.name_th as string]));
  const customerMap = new Map(
    (customers ?? []).map((c) => [
      c.id as string,
      {
        name: (c.full_name as string) ?? "—",
        avatarUrl: (c.avatar_url as string) ?? "",
        phone: (c.phone as string) ?? "",
        isVip: Boolean(c.is_vip),
      },
    ]),
  );

  const bookings: CalBooking[] = (bookingsData ?? []).map((b) => {
    const c = customerMap.get(b.customer_id as string);
    return {
      id: b.id as string,
      code: b.booking_code as string,
      customerId: b.customer_id as string,
      customer: c?.name ?? "—",
      avatarUrl: c?.avatarUrl ?? "",
      phone: c?.phone ?? "",
      isVip: c?.isVip ?? false,
      roomId: b.room_id as string,
      room: roomName.get(b.room_id as string) ?? "—",
      check_in: b.check_in as string,
      check_out: b.check_out as string,
      status: b.status as string,
      guests: ((b.adults as number) ?? 0) + ((b.children as number) ?? 0),
      total: (b.total_amount as number) ?? 0,
      nights: nights(b.check_in as string, b.check_out as string),
      createdAt: (b.created_at as string) ?? "",
    };
  });

  const roomList: CalRoom[] = (rooms ?? []).map((r) => ({
    id: r.id as string,
    name: r.name_th as string,
  }));

  return (
    <CalendarDashboard bookings={bookings} rooms={roomList} today={bangkokToday()} now={serverNowMs()} />
  );
}
