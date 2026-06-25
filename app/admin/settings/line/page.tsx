import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui";
import { LineSettingsForm } from "../LineSettingsForm";

export const dynamic = "force-dynamic";

export default async function LineSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/settings" className="text-xs text-[color:var(--color-forest-deep)]/60 hover:text-[color:var(--color-warm-clay)]">
          ‹ ตั้งค่าระบบ
        </Link>
        <PageHeader
          title="LINE OA"
          description="เชื่อม LINE Login + Official Account สำหรับเข้าสู่ระบบและส่งการ์ดแจ้งเตือน"
        />
      </div>
      <LineSettingsForm />
    </div>
  );
}
