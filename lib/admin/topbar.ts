// Topbar page headings (concise title + subtitle) keyed by route prefix.
// Client-safe: no server-only imports.

export type TopbarMeta = { title: string; subtitle: string };

// Order matters — longest / most specific prefixes first.
const TOPBAR_META: { prefix: string; meta: TopbarMeta }[] = [
  { prefix: "/admin/walk-in", meta: { title: "ลงข้อมูลการจอง", subtitle: "ฟอร์ม + ปฏิทิน real-time · AI ช่วยตัดสินใจ" } },
  { prefix: "/admin/dashboard", meta: { title: "ภาพรวม", subtitle: "สรุปผลการดำเนินงานแบบ real-time" } },
  { prefix: "/admin/bookings", meta: { title: "รายการจอง", subtitle: "จัดการคำสั่งจอง ตรวจสลิป และยืนยัน" } },
  { prefix: "/admin/calendar", meta: { title: "ปฏิทินการจอง", subtitle: "ดูคิวเข้าพักแบบรายวัน / รายเดือน" } },
  { prefix: "/admin/occupancy", meta: { title: "ห้องว่าง", subtitle: "ตรวจสถานะห้องว่างตามช่วงวันที่" } },
  { prefix: "/admin/rooms", meta: { title: "ห้องพัก", subtitle: "จัดการห้องพัก ราคา และสถานะเปิดจอง" } },
  { prefix: "/admin/customers", meta: { title: "ลูกค้า", subtitle: "ฐานข้อมูลลูกค้าและประวัติการจอง" } },
  { prefix: "/admin/revenue", meta: { title: "รายได้", subtitle: "สรุปยอดขายและแนวโน้มรายรับ" } },
  { prefix: "/admin/payment-settings", meta: { title: "ตั้งค่าการเงิน", subtitle: "บัญชีรับเงิน มัดจำ และนโยบายยกเลิก" } },
  { prefix: "/admin/content", meta: { title: "เนื้อหาเว็บ", subtitle: "จัดการรูป วิดีโอ และเนื้อหาหน้าเว็บ" } },
  { prefix: "/admin/users", meta: { title: "จัดการผู้ใช้", subtitle: "บัญชีผู้ดูแลและสิทธิ์การเข้าถึง" } },
  { prefix: "/admin/settings", meta: { title: "ตั้งค่าระบบ", subtitle: "ตั้งค่าการแจ้งเตือน ความปลอดภัย และระบบ" } },
];

export function topbarMeta(pathname: string): TopbarMeta {
  const hit = TOPBAR_META.find((t) => pathname === t.prefix || pathname.startsWith(`${t.prefix}/`));
  return hit?.meta ?? { title: "หลังบ้าน", subtitle: "ระบบจัดการ LandCamp" };
}
