import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
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
        "id, slug, room_type, name_th, name_en, description_th, description_en, price_weekday, price_weekend, max_guests, is_available, display_order, amenities, images, details",
      )
      .order("display_order");
    if (error) throw error;
    rooms = (data ?? []) as AdminRoom[];
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load rooms";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ห้องพัก"
        description="จัดการรูป ข้อความ ราคา รายละเอียด และป้ายโปรโมชันที่แสดงบนหน้าเว็บ — แก้ได้ทุกอย่างที่นี่"
      />
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
