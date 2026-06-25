import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui";
import { SettingsHub } from "./SettingsHub";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const auth = await requireSection("settings");
  if (!auth.ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ตั้งค่าระบบ"
        description="การเงิน · ผู้ใช้ · แจ้งเตือน · เนื้อหาเว็บ · เชื่อมต่อ — กดการ์ดเพื่อเปิดหน้าตั้งค่านั้น"
      />
      <SettingsHub role={auth.role} />
    </div>
  );
}
