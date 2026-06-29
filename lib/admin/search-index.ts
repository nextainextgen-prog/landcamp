// Client-safe static index of every navigable admin page/section. Powers the
// topbar global search (page/section autocomplete). Keep `href` values in sync
// with the real routes under app/admin/**. No server-only imports here so client
// components can import it directly.

export type SearchEntry = {
  /** Full Thai display name shown in the results list. */
  label: string;
  /** Thai + English aliases that should also match the query. */
  keywords: string[];
  /** Exact route to navigate to. */
  href: string;
  /** Parent section, used to group results under a header. */
  section: string;
};

export const ADMIN_SEARCH_INDEX: SearchEntry[] = [
  // ── ภาพรวม ──
  { label: "ภาพรวม (Dashboard)", keywords: ["dashboard", "overview", "home", "หน้าแรก", "สรุป", "แดชบอร์ด"], href: "/admin/dashboard", section: "ภาพรวม" },
  { label: "ปฏิทินการจอง", keywords: ["calendar", "ปฏิทิน", "booking calendar", "ตารางจอง"], href: "/admin/calendar", section: "ภาพรวม" },
  { label: "ห้องว่าง (Occupancy)", keywords: ["occupancy", "ห้องว่าง", "availability", "ว่าง", "เข้าพัก"], href: "/admin/occupancy", section: "ภาพรวม" },
  { label: "จองหน้าร้าน (Walk-in)", keywords: ["walk-in", "walkin", "จองหน้าร้าน", "เดินเข้า", "เคาน์เตอร์", "จองห้องพัก"], href: "/admin/walk-in", section: "ภาพรวม" },

  // ── จัดการ ──
  { label: "รายการจอง", keywords: ["bookings", "booking", "จอง", "รายการจอง", "reservation", "ออเดอร์", "orders"], href: "/admin/bookings", section: "จัดการ" },
  { label: "จัดการห้องพัก", keywords: ["rooms", "room", "ห้อง", "ห้องพัก", "villa", "วิลล่า", "เปิดปิดห้อง"], href: "/admin/rooms", section: "จัดการ" },
  { label: "รายได้", keywords: ["revenue", "income", "รายได้", "เงิน", "ยอดขาย", "sales", "report"], href: "/admin/revenue", section: "จัดการ" },
  { label: "ประวัติสลิป", keywords: ["slips", "slip", "สลิป", "ประวัติสลิป", "payment slip", "หลักฐานโอน", "โอนเงิน"], href: "/admin/slips", section: "จัดการ" },
  { label: "จัดการลูกค้า", keywords: ["customers", "customer", "ลูกค้า", "สมาชิก", "member", "crm"], href: "/admin/customers", section: "จัดการ" },
  { label: "แม่บ้าน / ทำความสะอาด (Housekeeping)", keywords: ["housekeeping", "แม่บ้าน", "ทำความสะอาด", "cleaning", "ห้องพร้อม"], href: "/admin/housekeeping", section: "จัดการ" },

  // ── การเงิน ──
  { label: "ตั้งค่าการเงิน", keywords: ["payment", "finance", "การเงิน", "พร้อมเพย์", "promptpay", "qr", "มัดจำ", "บัญชีรับเงิน", "easyslip"], href: "/admin/payment-settings", section: "การเงิน" },
  { label: "ใบเสร็จรับเงิน", keywords: ["receipt", "ใบเสร็จ", "ใบเสร็จรับเงิน", "ใบยืนยันการจอง", "เอกสาร", "tax", "เลขผู้เสียภาษี", "หัวบิล", "invoice"], href: "/admin/settings/tax", section: "การเงิน" },
  { label: "เป้าหมาย / KPI", keywords: ["goals", "kpi", "เป้า", "เป้าหมาย", "target", "อัตราเข้าพัก"], href: "/admin/settings/goals", section: "การเงิน" },

  // ── ผู้ใช้ & สิทธิ์ ──
  { label: "แอดมิน & สิทธิ์ (Roles)", keywords: ["users", "admin", "สิทธิ์", "แอดมิน", "roles", "permission", "ผู้ใช้", "จัดการผู้ใช้"], href: "/admin/users", section: "ผู้ใช้ & สิทธิ์" },
  { label: "ความปลอดภัย / เปลี่ยนรหัสผ่าน", keywords: ["security", "password", "รหัสผ่าน", "ความปลอดภัย", "เปลี่ยนรหัส"], href: "/admin/settings/security", section: "ผู้ใช้ & สิทธิ์" },

  // ── การแจ้งเตือน ──
  { label: "LINE OA", keywords: ["line", "line oa", "ไลน์", "channel", "oa token", "add friend", "แอดเฟรนด์"], href: "/admin/settings/line", section: "การแจ้งเตือน" },
  { label: "การ์ด LINE", keywords: ["line card", "การ์ด", "flex", "การ์ดไลน์", "การ์ดยืนยัน"], href: "/admin/settings/cards", section: "การแจ้งเตือน" },
  { label: "ตั้งค่า Email (Resend)", keywords: ["email", "อีเมล", "resend", "mail", "ส่งเมล", "โดเมน"], href: "/admin/settings/email", section: "การแจ้งเตือน" },
  { label: "OTP (SMS)", keywords: ["otp", "sms", "รหัส otp", "ยืนยันเบอร์", "เบอร์โทร"], href: "/admin/settings/otp", section: "การแจ้งเตือน" },
  { label: "กำหนดการแจ้งเตือน (Routing)", keywords: ["routing", "แจ้งเตือน", "notification", "ส่งหาทีม", "เส้นทางแจ้งเตือน"], href: "/admin/settings/routing", section: "การแจ้งเตือน" },

  // ── เนื้อหาเว็บ & แบรนด์ ──
  { label: "แก้เนื้อหาเว็บ (CMS)", keywords: ["content", "cms", "เนื้อหา", "เว็บ", "ข้อความเว็บ", "รูป", "วิดีโอ", "แบรนด์"], href: "/admin/content", section: "เนื้อหาเว็บ & แบรนด์" },

  // ── เชื่อมต่อภายนอก ──
  { label: "ซิงก์ปฏิทิน (iCal)", keywords: ["calendar sync", "ical", "airbnb", "booking.com", "agoda", "ซิงก์", "ปฏิทินภายนอก"], href: "/admin/settings/calendar", section: "เชื่อมต่อภายนอก" },

  // ── ระบบ & ความปลอดภัย ──
  { label: "บันทึกการใช้งาน (Audit Log)", keywords: ["audit", "audit log", "บันทึก", "log", "ประวัติการใช้งาน"], href: "/admin/settings/audit-log", section: "ระบบ & ความปลอดภัย" },
  { label: "ข้อมูล & PDPA", keywords: ["pdpa", "privacy", "ความเป็นส่วนตัว", "ข้อมูลส่วนบุคคล", "ลบข้อมูล"], href: "/admin/settings/pdpa", section: "ระบบ & ความปลอดภัย" },
  { label: "สำรองข้อมูล (Backup)", keywords: ["backup", "สำรองข้อมูล", "ดาวน์โหลดข้อมูล", "export"], href: "/admin/settings/backup", section: "ระบบ & ความปลอดภัย" },
  { label: "งานอัตโนมัติ (Cron)", keywords: ["cron", "อัตโนมัติ", "งานอัตโนมัติ", "scheduled", "เคลียร์จอง"], href: "/admin/settings/cron", section: "ระบบ & ความปลอดภัย" },

  // ── ตั้งค่า ──
  { label: "ตั้งค่าระบบ", keywords: ["settings", "ตั้งค่า", "setting", "config", "ระบบ"], href: "/admin/settings", section: "ตั้งค่า" },
];

/**
 * Partial, case-insensitive match on label + keywords. Thai needs no case
 * folding but toLowerCase keeps the English aliases consistent. Results are
 * ranked (label-prefix > label-contains > keyword-prefix > keyword-contains)
 * and capped at `limit`.
 */
export function filterAdminIndex(query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of ADMIN_SEARCH_INDEX) {
    const label = entry.label.toLowerCase();
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.includes(q)) score = 1;
    else if (entry.keywords.some((k) => k.toLowerCase().startsWith(q))) score = 2;
    else if (entry.keywords.some((k) => k.toLowerCase().includes(q))) score = 3;
    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.entry);
}

export type LabelChunk = { text: string; hit: boolean };

/** Split a label so the part matching `query` can be visually highlighted. */
export function highlightMatch(label: string, query: string): LabelChunk[] {
  const q = query.trim();
  if (!q) return [{ text: label, hit: false }];
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return [{ text: label, hit: false }];
  return [
    { text: label.slice(0, idx), hit: false },
    { text: label.slice(idx, idx + q.length), hit: true },
    { text: label.slice(idx + q.length), hit: false },
  ].filter((c) => c.text.length > 0);
}
