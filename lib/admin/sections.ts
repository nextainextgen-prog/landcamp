// Client-safe admin constants/types (no server-only imports), so client
// components can import these without pulling in next/headers.

export const SECTIONS = [
  { key: "bookings", label: "รายการจอง" },
  { key: "rooms", label: "ห้องพัก" },
  { key: "content", label: "เนื้อหาเว็บ" },
  { key: "revenue", label: "รายได้" },
  { key: "customers", label: "ลูกค้า" },
  { key: "payment-settings", label: "ตั้งค่าการเงิน" },
  { key: "settings", label: "ตั้งค่าระบบ" },
  { key: "users", label: "จัดการผู้ใช้" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];
export const SECTION_KEYS: SectionKey[] = SECTIONS.map((s) => s.key);

export type AdminRole = "super_admin" | "admin";
