import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui";
import { LineSettingsForm } from "./LineSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ตั้งค่าระบบ"
        description="กรอกค่าการเชื่อมต่อต่าง ๆ ได้ที่นี่ ไม่ต้องแก้ในโค้ด"
      />
      <LineSettingsForm />
    </div>
  );
}
