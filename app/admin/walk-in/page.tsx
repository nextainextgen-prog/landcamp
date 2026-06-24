import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { WalkInForm, type WalkInRoom } from "./WalkInForm";

export const dynamic = "force-dynamic";

export default async function AdminWalkInPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  const admin = createAdminClient();
  const { data: rooms } = await admin
    .from("rooms")
    .select("id, name_th, price_weekday, price_weekend, max_guests")
    .order("display_order");

  const list: WalkInRoom[] = (rooms ?? []).map((r) => ({
    id: r.id as string,
    name: r.name_th as string,
    priceWeekday: r.price_weekday as number,
    priceWeekend: r.price_weekend as number,
    maxGuests: r.max_guests as number,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Walk-in / หน้าเคาน์เตอร์"
        description="เพิ่มลูกค้าและสร้างการจองให้ลูกค้าที่มาหน้างาน"
      />
      <WalkInForm rooms={list} />
    </div>
  );
}
