import type { BookingStatus } from "@/types";

export const BOOKING_STATUS_TH: Record<BookingStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "กำลังตรวจสอบสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};

/**
 * Customer-facing booking status — reassuring, success-leaning wording. Once a
 * slip is submitted (payment_review) the guest is told the room is theirs
 * ("ยืนยันการจองแล้ว") rather than the internal "กำลังตรวจสอบสลิป".
 */
export type StatusTone = "success" | "pending" | "neutral" | "danger";
export const BOOKING_STATUS_CUSTOMER: Record<
  BookingStatus,
  { label: string; sub: string; tone: StatusTone }
> = {
  pending_payment: { label: "รอชำระเงิน", sub: "อัปโหลดสลิปเพื่อยืนยันการจอง", tone: "pending" },
  payment_review: { label: "ยืนยันการจองแล้ว", sub: "ได้ห้องแล้ว · กำลังจัดเตรียมเอกสาร", tone: "success" },
  confirmed: { label: "ยืนยันการจองแล้ว", sub: "ได้ห้องแล้ว · พร้อมเข้าพัก", tone: "success" },
  completed: { label: "เข้าพักเสร็จสิ้น", sub: "ขอบคุณที่ใช้บริการ", tone: "neutral" },
  cancelled: { label: "ยกเลิกแล้ว", sub: "การจองนี้ถูกยกเลิก", tone: "neutral" },
  no_show: { label: "ไม่ได้เข้าพัก", sub: "ไม่มีการเข้าพักตามกำหนด", tone: "danger" },
};

export const STATUS_TONE_BADGE: Record<StatusTone, string> = {
  success: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)] ring-[color:var(--color-sage-mid)]/30",
  pending: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)] ring-[color:var(--color-warm-clay)]/30",
  neutral: "bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]/70 ring-[color:var(--color-forest-deep)]/20",
  danger: "bg-red-100 text-red-700 ring-red-200",
};

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function formatTHB(amount: number): string {
  return THB.format(amount);
}

export function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}
