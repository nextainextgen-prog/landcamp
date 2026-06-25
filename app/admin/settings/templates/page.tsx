import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "emailConfirmSubject", label: "อีเมลยืนยัน — หัวข้อ", type: "text", placeholder: "ยืนยันการจอง {{booking_code}}" },
  { name: "emailConfirmBody", label: "อีเมลยืนยัน — เนื้อหา", type: "textarea" },
  { name: "lineConfirmText", label: "การ์ด LINE ยืนยัน — ข้อความ", type: "textarea" },
  { name: "lineReminderText", label: "การ์ด LINE เตือนเข้าพัก — ข้อความ", type: "textarea" },
];

const DEFAULTS = {
  emailConfirmSubject: "ยืนยันการจอง {{booking_code}} — LandCamp Villa",
  emailConfirmBody: "เรียนคุณ {{name}}\n\nขอบคุณที่จองที่พักกับ LandCamp Villa Khao Yai\nรหัสจอง: {{booking_code}}\nวันที่: {{check_in}} – {{check_out}}\nยอดรวม: {{total}} บาท\n\nแล้วพบกันครับ",
  lineConfirmText: "✅ ยืนยันการจอง {{booking_code}}\n{{check_in}} – {{check_out}}\nยอด {{total}} บาท",
  lineReminderText: "📅 ใกล้ถึงวันเข้าพักแล้ว! {{check_in}}\nรหัสจอง {{booking_code}} — เดินทางปลอดภัยนะครับ",
};

export default async function TemplatesSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="คลังเทมเพลตข้อความ" description="แก้ข้อความอีเมล / การ์ด LINE ที่ส่งหาลูกค้า" />
      <KvForm
        settingKey="templates"
        title="เทมเพลตข้อความ"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="ใช้ตัวแปรในข้อความได้ เช่น {{name}} {{booking_code}} {{check_in}} {{check_out}} {{total}} — ระบบจะแทนค่าจริงตอนส่ง"
      />
    </div>
  );
}
