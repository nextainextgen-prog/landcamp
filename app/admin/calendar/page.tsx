import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { BookingCalendar, type CalBooking } from "./BookingCalendar";

export const dynamic = "force-dynamic";

const LEGEND = [
  { label: "รอชำระ", color: "#d4a24c" },
  { label: "รอตรวจสลิป", color: "#5b7fa6" },
  { label: "ยืนยันแล้ว", color: "#4d584b" },
  { label: "เสร็จสิ้น", color: "#778475" },
];

export default async function AdminCalendarPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: bookingsData }, { data: rooms }, { data: customers }] = await Promise.all([
    admin
      .from("bookings")
      .select("id, booking_code, room_id, customer_id, check_in, check_out, status")
      .neq("status", "cancelled"),
    admin.from("rooms").select("id, name_th"),
    admin.from("customers").select("id, full_name"),
  ]);

  const roomName = new Map((rooms ?? []).map((r) => [r.id as string, r.name_th as string]));
  const customerName = new Map((customers ?? []).map((c) => [c.id as string, (c.full_name as string) ?? "—"]));

  const bookings: CalBooking[] = (bookingsData ?? []).map((b) => ({
    id: b.id as string,
    code: b.booking_code as string,
    customer: customerName.get(b.customer_id as string) ?? "—",
    room: roomName.get(b.room_id as string) ?? "—",
    check_in: b.check_in as string,
    check_out: b.check_out as string,
    status: b.status as string,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ปฏิทินการจอง"
        description="ดูการจองทั้งหมดในมุมมองปฏิทิน"
        actions={
          <div className="hidden flex-wrap items-center gap-3 sm:flex">
            {LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-[color:var(--color-ink)]/60">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        }
      />
      <BookingCalendar bookings={bookings} />
    </div>
  );
}
