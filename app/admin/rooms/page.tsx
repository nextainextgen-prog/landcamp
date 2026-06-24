import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoomsManager, type AdminRoom } from "./RoomsManager";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  if (!(await requireSection("rooms")).ok) redirect("/admin");

  let rooms: AdminRoom[] = [];
  let errorMsg: string | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("rooms")
      .select(
        "id, slug, room_type, name_th, name_en, description_th, description_en, price_weekday, price_weekend, max_guests, is_available, display_order",
      )
      .order("display_order");
    if (error) throw error;
    rooms = (data ?? []) as AdminRoom[];
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load rooms";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">ห้องพัก</h1>
        <p className="text-sm text-neutral-500">
          จัดการชื่อ ราคา จำนวนผู้เข้าพัก และสถานะเปิด–ปิดของแต่ละห้อง
        </p>
      </header>
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <RoomsManager initialRooms={rooms} />
      )}
    </div>
  );
}
