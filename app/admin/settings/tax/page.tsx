import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "vatEnabled", label: "คิด VAT บนใบเสร็จ", type: "checkbox" },
  { name: "vatPercent", label: "อัตรา VAT (%)", type: "number", placeholder: "7" },
  { name: "taxId", label: "เลขประจำตัวผู้เสียภาษี", type: "text", placeholder: "0-0000-00000-00-0" },
  { name: "receiptHeader", label: "หัวบิล / ชื่อบนใบเสร็จ", type: "text", placeholder: "LandCamp Villa Khao Yai" },
  { name: "receiptAddress", label: "ที่อยู่บนใบเสร็จ", type: "textarea" },
  { name: "receiptFooter", label: "ข้อความท้ายใบเสร็จ", type: "textarea", placeholder: "ขอบคุณที่ใช้บริการ" },
];

const DEFAULTS = { vatEnabled: false, vatPercent: 7, taxId: "", receiptHeader: "", receiptAddress: "", receiptFooter: "" };

export default async function TaxSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="ภาษี & ใบเสร็จ" description="ตั้งค่า VAT, เลขผู้เสียภาษี และข้อความบนใบเสร็จ" />
      <KvForm
        settingKey="tax"
        title="ภาษี & ใบเสร็จ"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="ค่าเหล่านี้จะถูกนำไปใช้เมื่อออกใบเสร็จ/ใบกำกับให้ลูกค้า"
      />
    </div>
  );
}
