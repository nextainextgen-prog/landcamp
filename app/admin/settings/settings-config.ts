import type { AdminRole } from "@/lib/admin/sections";

export type SettingCard = {
  title: string;
  desc: string;
  icon: string;
  href?: string;
  superAdminOnly?: boolean;
};
export type SettingGroup = { label: string; cards: SettingCard[] };

/** Shared by the settings hub (cards) and the settings sub-nav (left list). */
export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    label: "การเงิน",
    cards: [
      { title: "ตั้งค่าการเงิน", desc: "บัญชีรับเงิน · พร้อมเพย์ · QR · มัดจำ", icon: "finance", href: "/admin/payment-settings" },
      { title: "ภาษี & ใบเสร็จ", desc: "VAT · เลขผู้เสียภาษี · หัวบิล", icon: "receipt", href: "/admin/settings/tax" },
      { title: "เป้าหมาย / KPI", desc: "เป้ารายเดือน · อัตราเข้าพักเป้าหมาย", icon: "kpi", href: "/admin/settings/goals" },
    ],
  },
  {
    label: "ผู้ใช้ & สิทธิ์",
    cards: [
      { title: "แอดมิน & สิทธิ์ (Roles)", desc: "เพิ่ม/ลบแอดมิน · ติ๊กสิทธิ์รายเมนู", icon: "users", href: "/admin/users" },
      { title: "จัดการลูกค้า", desc: "ดู/แก้/ลบ · รวมบัญชีซ้ำ · แบน", icon: "customer", href: "/admin/customers", superAdminOnly: true },
      { title: "ความปลอดภัย", desc: "เปลี่ยนรหัสผ่าน", icon: "shield", href: "/admin/settings/security" },
    ],
  },
  {
    label: "การแจ้งเตือน",
    cards: [
      { title: "LINE OA", desc: "Channel · OA token · auto add-friend", icon: "chat", href: "/admin/settings/line" },
      { title: "การ์ด LINE", desc: "ตกแต่งการ์ดยืนยัน/เตือน — รูป ข้อความ ปุ่ม", icon: "card", href: "/admin/settings/cards" },
      { title: "Email (Resend)", desc: "โดเมน · ผู้ส่ง · API key", icon: "email", href: "/admin/settings/email" },
      { title: "OTP (SMS)", desc: "ผู้ให้บริการ · API key · ยืนยันเบอร์โทร", icon: "shield", href: "/admin/settings/otp" },
      { title: "กำหนดการแจ้งเตือน (Routing)", desc: "จองใหม่→ทีม · ยืนยัน→ลูกค้า", icon: "bell", href: "/admin/settings/routing" },
      { title: "คลังเทมเพลตข้อความ", desc: "แก้ข้อความอีเมล / การ์ด LINE", icon: "template", href: "/admin/settings/templates" },
    ],
  },
  {
    label: "เนื้อหาเว็บ & แบรนด์",
    cards: [
      { title: "แก้เนื้อหาเว็บ (CMS)", desc: "ข้อความ · รูป · วิดีโอ + พรีวิวสด", icon: "cms", href: "/admin/content" },
      { title: "ป๊อปอัปประกาศ", desc: "ข้อความประกาศเด้งบนหน้าเว็บ · โปรโมชัน · ข่าวทั่วไป", icon: "megaphone", href: "/admin/settings/announcement" },
    ],
  },
  {
    label: "เชื่อมต่อภายนอก",
    cards: [
      { title: "ซิงก์ปฏิทิน", desc: "Airbnb · Booking.com · Agoda (iCal)", icon: "calendar", href: "/admin/settings/calendar" },
    ],
  },
  {
    label: "ระบบ & ความปลอดภัย",
    cards: [
      { title: "บันทึกการใช้งาน (Audit Log)", desc: "ใครทำอะไร เมื่อไหร่", icon: "audit", href: "/admin/settings/audit-log" },
      { title: "ข้อมูล & PDPA", desc: "นโยบายความเป็นส่วนตัว · คำขอลบข้อมูล", icon: "privacy", href: "/admin/settings/pdpa" },
      { title: "สำรองข้อมูล (Backup)", desc: "ดาวน์โหลดข้อมูลสำรอง", icon: "backup", href: "/admin/settings/backup" },
      { title: "งานอัตโนมัติ (Cron)", desc: "เคลียร์จองหมดเวลา · เตือนใกล้วัน", icon: "clock", href: "/admin/settings/cron" },
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
