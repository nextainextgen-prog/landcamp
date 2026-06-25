import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "teamOnNewBooking", label: "แจ้งกลุ่มทีมงานเมื่อมีจองใหม่", type: "checkbox" },
  { name: "teamOnSlip", label: "แจ้งกลุ่มทีมงานเมื่อลูกค้าแนบสลิป", type: "checkbox" },
  { name: "customerOnConfirm", label: "ส่งใบยืนยันให้ลูกค้าเมื่อจองสำเร็จ", type: "checkbox" },
  { name: "reminderBeforeCheckin", label: "เตือนลูกค้าก่อนวันเข้าพัก", type: "checkbox" },
  { name: "reminderDaysBefore", label: "เตือนก่อนกี่วัน", type: "number", placeholder: "2", hint: "ใช้คู่กับ 'เตือนลูกค้าก่อนวันเข้าพัก'" },
];

const DEFAULTS = {
  teamOnNewBooking: true,
  teamOnSlip: true,
  customerOnConfirm: true,
  reminderBeforeCheckin: true,
  reminderDaysBefore: 2,
};

export default async function RoutingSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="กำหนดการแจ้งเตือน (Routing)" description="เลือกว่าเหตุการณ์ไหนจะแจ้งใคร ผ่านช่องทางใด" />
      <KvForm
        settingKey="routing"
        title="กำหนดการแจ้งเตือน"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="เปิด/ปิดการแจ้งเตือนแต่ละเหตุการณ์ได้ที่นี่ — ระบบส่งจริงจะอ่านค่าเหล่านี้ (ต้องตั้งค่า LINE/Email ให้พร้อมก่อน)"
      />
    </div>
  );
}
