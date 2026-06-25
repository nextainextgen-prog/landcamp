import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { HousekeepingBoard, type Task, type RoomOption } from "./HousekeepingBoard";

export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  let tasks: Task[] = [];
  let rooms: RoomOption[] = [];
  let errorMsg: string | null = null;

  try {
    const admin = createAdminClient();
    const [{ data: taskRows }, { data: roomRows }] = await Promise.all([
      admin
        .from("housekeeping_tasks")
        .select("id, room_id, booking_id, status, assignee, note, due_date, created_at")
        .order("created_at", { ascending: false }),
      admin.from("rooms").select("id, name_th").order("display_order"),
    ]);

    rooms = (roomRows ?? []).map((r) => ({ id: r.id as string, name: (r.name_th as string) ?? "—" }));
    const roomName = new Map(rooms.map((r) => [r.id, r.name]));

    const bookingIds = [...new Set((taskRows ?? []).map((t) => t.booking_id as string).filter(Boolean))];
    const codeMap = new Map<string, string>();
    if (bookingIds.length) {
      const { data: bookings } = await admin.from("bookings").select("id, booking_code").in("id", bookingIds);
      for (const b of bookings ?? []) codeMap.set(b.id as string, b.booking_code as string);
    }

    tasks = (taskRows ?? []).map((t) => ({
      id: t.id as string,
      roomName: t.room_id ? roomName.get(t.room_id as string) ?? "—" : "—",
      bookingCode: t.booking_id ? codeMap.get(t.booking_id as string) ?? null : null,
      status: t.status as Task["status"],
      assignee: (t.assignee as string) ?? "",
      note: (t.note as string) ?? "",
      dueDate: (t.due_date as string) ?? null,
      createdAt: t.created_at as string,
    }));
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load housekeeping tasks";
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        โหลดข้อมูลไม่สำเร็จ: {errorMsg} — รัน migration 020 แล้วหรือยัง?
      </div>
    );
  }

  return <HousekeepingBoard initial={tasks} rooms={rooms} />;
}
