import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { CronPanel } from "./CronPanel";

export const dynamic = "force-dynamic";

export default async function CronSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="งานอัตโนมัติ (Cron)" description="ดูและสั่งรันงานเบื้องหลังของระบบ" />
      <CronPanel />
    </div>
  );
}
