import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { OccupancyGrid, type OccRoom, type OccBooking } from "./OccupancyGrid";

export const dynamic = "force-dynamic";

export default async function AdminOccupancyPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    admin.from("rooms").select("id, name_th").order("display_order"),
    admin.from("bookings").select("room_id, check_in, check_out, status").neq("status", "cancelled"),
  ]);

  const occRooms: OccRoom[] = (rooms ?? []).map((r) => ({ id: r.id as string, name: r.name_th as string }));
  const occBookings: OccBooking[] = (bookings ?? []).map((b) => ({
    room_id: b.room_id as string,
    check_in: b.check_in as string,
    check_out: b.check_out as string,
    status: b.status as string,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ห้องว่าง" description="มุมมองห้องว่าง–ไม่ว่าง 14 วันข้างหน้า" />
      <OccupancyGrid rooms={occRooms} bookings={occBookings} />
    </div>
  );
}
