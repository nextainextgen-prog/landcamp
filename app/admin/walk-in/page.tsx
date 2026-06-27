import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { WalkInForm, type WalkInRoom, type BookedRange } from "./WalkInForm";

export const dynamic = "force-dynamic";

/** Today's date (YYYY-MM-DD) in Asia/Bangkok. */
function bangkokToday(): string {
  const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(Date.now() + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

export default async function AdminWalkInPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    admin
      .from("rooms")
      .select("id, name_th, slug, price_weekday, price_weekend, max_guests, is_available")
      .eq("is_available", true)
      .order("display_order"),
    admin
      .from("bookings")
      .select("room_id, check_in, check_out, booking_code, customer_id")
      .in("status", ["confirmed", "pending_payment", "payment_review"])
      .gte("check_out", bangkokToday()),
  ]);

  const custIds = [...new Set((bookings ?? []).map((b) => b.customer_id as string).filter(Boolean))];
  const { data: custs } = custIds.length
    ? await admin.from("customers").select("id, full_name").in("id", custIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const custName = new Map((custs ?? []).map((c) => [c.id as string, (c.full_name as string) ?? "ลูกค้า"]));

  const list: WalkInRoom[] = (rooms ?? []).map((r) => ({
    id: r.id as string,
    name: r.name_th as string,
    slug: (r.slug as string) ?? "",
    priceWeekday: r.price_weekday as number,
    priceWeekend: (r.price_weekend as number) ?? (r.price_weekday as number),
    maxGuests: r.max_guests as number,
  }));

  const booked: BookedRange[] = (bookings ?? []).map((b) => ({
    roomId: b.room_id as string,
    checkIn: b.check_in as string,
    checkOut: b.check_out as string,
    bookingCode: (b.booking_code as string) ?? "",
    guestName: custName.get(b.customer_id as string) ?? "ลูกค้า",
  }));

  return <WalkInForm rooms={list} booked={booked} today={bangkokToday()} />;
}
