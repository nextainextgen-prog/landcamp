import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { OccupancyGrid, type OccRoom, type OccBooking } from "./OccupancyGrid";
import { OccupancyStats } from "./OccupancyStats";
import { MonthCalendar } from "./MonthCalendar";

export const dynamic = "force-dynamic";

export default async function AdminOccupancyPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    admin.from("rooms").select("id, name_th").order("display_order"),
    admin.from("bookings").select("room_id, check_in, check_out, status, booking_code").neq("status", "cancelled"),
  ]);

  const occRooms: OccRoom[] = (rooms ?? []).map((r) => ({ id: r.id as string, name: r.name_th as string }));
  const occBookings: OccBooking[] = (bookings ?? []).map((b) => ({
    room_id: b.room_id as string,
    check_in: b.check_in as string,
    check_out: b.check_out as string,
    status: b.status as string,
    booking_code: (b.booking_code as string) ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <OccupancyStats rooms={occRooms} bookings={occBookings} />
      <OccupancyGrid rooms={occRooms} bookings={occBookings} />
      <MonthCalendar rooms={occRooms} bookings={occBookings} />
    </div>
  );
}
