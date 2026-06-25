import type { AdminRole } from "@/lib/admin/sections";

export type SettingCard = {
  title: string;
  desc: string;
  href?: string;
  superAdminOnly?: boolean;
};
export type SettingGroup = { label: string; cards: SettingCard[] };

/** Shared by the settings hub (cards) and the settings sub-nav (left list). */
export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    label: "การเงิน",
    cards: [
      { title: "ตั้งค่าการเงิน", desc: "บัญชีรับเงิน · พร้อมเพย์ · QR · มัดจำ", href: "/admin/payment-settings" },
      { title: "ภาษี & ใบเสร็จ", desc: "VAT · เลขผู้เสียภาษี · หัวบิล", href: "/admin/settings/tax" },
      { title: "เป้าหมาย / KPI", desc: "เป้ารายเดือน · อัตราเข้าพักเป้าหมาย", href: "/admin/settings/goals" },
    ],
  },
  {
    label: "ผู้ใช้ & สิทธิ์",
    cards: [
      { title: "แอดมิน & สิทธิ์ (Roles)", desc: "เพิ่ม/ลบแอดมิน · ติ๊กสิทธิ์รายเมนู", href: "/admin/users" },
      { title: "จัดการลูกค้า", desc: "ดู/แก้/ลบ · รวมบัญชีซ้ำ · แบน", href: "/admin/customers", superAdminOnly: true },
      { title: "ความปลอดภัย", desc: "เปลี่ยนรหัสผ่าน", href: "/admin/settings/security" },
    ],
  },
  {
    label: "การแจ้งเตือน",
    cards: [
      { title: "LINE OA", desc: "Channel · OA token · auto add-friend", href: "/admin/settings/line" },
      { title: "Email (Resend)", desc: "โดเมน · ผู้ส่ง · API key", href: "/admin/settings/email" },
      { title: "กำหนดการแจ้งเตือน (Routing)", desc: "จองใหม่→ทีม · ยืนยัน→ลูกค้า", href: "/admin/settings/routing" },
      { title: "คลังเทมเพลตข้อความ", desc: "แก้ข้อความอีเมล / การ์ด LINE", href: "/admin/settings/templates" },
    ],
  },
  {
    label: "เนื้อหาเว็บ & แบรนด์",
    cards: [
      { title: "แก้เนื้อหาเว็บ (CMS)", desc: "ข้อความ · รูป · วิดีโอ + พรีวิวสด", href: "/admin/content" },
    ],
  },
  {
    label: "เชื่อมต่อภายนอก",
    cards: [
      { title: "ซิงก์ปฏิทิน", desc: "Airbnb · Booking.com · Agoda (iCal)", href: "/admin/settings/calendar" },
    ],
  },
  {
    label: "ระบบ & ความปลอดภัย",
    cards: [
      { title: "บันทึกการใช้งาน (Audit Log)", desc: "ใครทำอะไร เมื่อไหร่", href: "/admin/settings/audit-log" },
      { title: "ข้อมูล & PDPA", desc: "นโยบายความเป็นส่วนตัว · คำขอลบข้อมูล", href: "/admin/settings/pdpa" },
      { title: "สำรองข้อมูล (Backup)", desc: "ดาวน์โหลดข้อมูลสำรอง", href: "/admin/settings/backup" },
      { title: "งานอัตโนมัติ (Cron)", desc: "เคลียร์จองหมดเวลา · เตือนใกล้วัน", href: "/admin/settings/cron" },
    ],
  },
];

/** Groups with super-admin-only cards filtered out for non-super admins. */
export function visibleGroups(role: AdminRole): SettingGroup[] {
  return SETTINGS_GROUPS.map((g) => ({
    ...g,
    cards: g.cards.filter((c) => role === "super_admin" || !c.superAdminOnly),
  })).filter((g) => g.cards.length > 0);
}
