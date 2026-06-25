import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "monthlyRevenueTarget", label: "เป้ารายได้ต่อเดือน (บาท)", type: "number", placeholder: "300000" },
  { name: "occupancyTarget", label: "อัตราเข้าพักเป้าหมาย (%)", type: "number", placeholder: "70" },
  { name: "adrTarget", label: "ราคาเฉลี่ยต่อคืนเป้าหมาย (บาท)", type: "number", placeholder: "5000" },
];

const DEFAULTS = { monthlyRevenueTarget: 0, occupancyTarget: 70, adrTarget: 0 };

export default async function GoalsSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="เป้าหมาย / KPI" description="ตั้งเป้ารายได้และอัตราเข้าพัก เพื่อใช้เทียบในหน้า Dashboard" />
      <KvForm
        settingKey="goals"
        title="เป้าหมาย / KPI"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="ตัวเลขเป้าหมายไว้เทียบกับผลจริงในรายงาน/Dashboard"
      />
    </div>
  );
}
