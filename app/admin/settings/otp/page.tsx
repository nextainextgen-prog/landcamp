import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui";
import { OtpSettingsForm } from "./OtpSettingsForm";

export const dynamic = "force-dynamic";

export default async function OtpSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/settings" className="text-xs text-[color:var(--color-forest-deep)]/60 hover:text-[color:var(--color-warm-clay)]">
          ‹ ตั้งค่าระบบ
        </Link>
        <PageHeader
          title="OTP (SMS)"
          description="ตั้งค่าผู้ให้บริการ SMS สำหรับยืนยันเบอร์โทรด้วยรหัส OTP (เตรียมไว้สำหรับอนาคต)"
        />
      </div>
      <OtpSettingsForm />
    </div>
  );
}
