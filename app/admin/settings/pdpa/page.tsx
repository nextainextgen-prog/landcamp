import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "dpoContact", label: "ผู้ดูแลข้อมูลส่วนบุคคล (DPO) — ติดต่อ", type: "text", placeholder: "privacy@landcampkhaoyai.com" },
  { name: "retentionDays", label: "เก็บข้อมูลลูกค้านานกี่วัน", type: "number", placeholder: "365", hint: "ใช้เป็นแนวทางลบข้อมูลที่ไม่เคลื่อนไหว" },
  { name: "privacyPolicy", label: "นโยบายความเป็นส่วนตัว (แสดงบนเว็บ/อีเมล)", type: "textarea" },
];

const DEFAULTS = {
  dpoContact: "",
  retentionDays: 365,
  privacyPolicy:
    "LandCamp Villa Khao Yai เก็บข้อมูลส่วนบุคคล (ชื่อ, ช่องทางติดต่อ, ประวัติการจอง) เพื่อให้บริการจองที่พักเท่านั้น และจะไม่เปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับความยินยอม ลูกค้าสามารถขอดู/แก้ไข/ลบข้อมูลได้โดยติดต่อทีมงาน",
};

export default async function PdpaSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="ข้อมูล & PDPA" description="นโยบายความเป็นส่วนตัวและการจัดการข้อมูลลูกค้า" />
      <KvForm
        settingKey="pdpa"
        title="ข้อมูล & PDPA"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="คำขอลบข้อมูลลูกค้า: ดำเนินการได้ที่หน้า 'จัดการลูกค้า' (เฉพาะ Super Admin)"
      />
    </div>
  );
}
