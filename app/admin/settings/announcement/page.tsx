import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { KvForm, type KvField } from "../KvForm";

export const dynamic = "force-dynamic";

const FIELDS: KvField[] = [
  { name: "enabled", label: "เปิดใช้งานป๊อปอัปประกาศบนหน้าเว็บ", type: "switch" },
  {
    name: "image",
    label: "รูปประกาศ (ถ้ามี)",
    type: "image",
    aspect: "16/9",
    upload: "/api/admin/announcement/media",
    hint: "ขนาดมาตรฐาน 1200 × 675 px (อัตราส่วน 16:9) · ไฟล์ JPG/PNG/WebP สูงสุด 8MB · รูปจะถูกครอบให้พอดีกรอบอัตโนมัติ",
  },
  { name: "title", label: "หัวข้อประกาศ", type: "text", placeholder: "เช่น โปรโมชันเดือนนี้" },
  { name: "message", label: "ข้อความประกาศ", type: "textarea", placeholder: "รายละเอียดที่จะแสดงในป๊อปอัป (ขึ้นบรรทัดใหม่ได้)" },
  { name: "buttonText", label: "ข้อความบนปุ่ม (เว้นว่าง = ไม่มีปุ่ม)", type: "text", placeholder: "เช่น ดูรายละเอียด" },
  { name: "buttonLink", label: "ลิงก์เมื่อกดปุ่ม", type: "text", placeholder: "เช่น /#rooms หรือ https://line.me/..." },
  { name: "showOnce", label: "แสดงครั้งเดียวต่อผู้เข้าชม (จะเด้งใหม่เมื่อแก้ประกาศ)", type: "switch" },
];

const DEFAULTS = {
  enabled: false,
  image: "",
  title: "",
  message: "",
  buttonText: "",
  buttonLink: "",
  showOnce: true,
};

export default async function AnnouncementSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader
        title="ป๊อปอัปประกาศ"
        description="ตั้งค่าข้อความที่จะเด้งทักผู้เข้าชมบนหน้าเว็บไซต์"
      />
      <KvForm
        settingKey="announcement"
        title="ป๊อปอัปประกาศหน้าเว็บ"
        fields={FIELDS}
        defaults={DEFAULTS}
        note="เปิดสวิตช์แล้วกรอกหัวข้อ/ข้อความ → ป๊อปอัปจะเด้งบนหน้าเว็บไซต์ทันที ใช้ประกาศโปรโมชัน วันหยุด หรือข่าวทั่วไป (ปิดสวิตช์เมื่อไม่ต้องการให้แสดง)"
      />
    </div>
  );
}
