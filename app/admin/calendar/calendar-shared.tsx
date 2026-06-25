// Shared types, status config, date helpers and small presentational atoms for
// the booking calendar dashboard. Kept framework-light so both the dashboard
// shell and the individual calendar views can import without a cycle.

export type CalBooking = {
  id: string;
  code: string;
  customerId: string;
  customer: string;
  avatarUrl: string;
  phone: string;
  isVip: boolean;
  roomId: string;
  room: string;
  check_in: string; // YYYY-MM-DD (inclusive)
  check_out: string; // YYYY-MM-DD (exclusive)
  status: string;
  guests: number;
  total: number;
  nights: number;
  createdAt: string;
};

export type CalRoom = { id: string; name: string };

export type StatusKey =
  | "pending_payment"
  | "payment_review"
  | "confirmed"
  | "completed"
  | "no_show";

export const STATUS: Record<StatusKey, { label: string; color: string; soft: string }> = {
  pending_payment: { label: "รอชำระ", color: "#d4a24c", soft: "rgba(212,162,76,0.14)" },
  payment_review: { label: "รอตรวจสลิป", color: "#5b7fa6", soft: "rgba(91,127,166,0.14)" },
  confirmed: { label: "ยืนยันแล้ว", color: "#4d584b", soft: "rgba(77,88,75,0.14)" },
  completed: { label: "เสร็จสิ้น", color: "#778475", soft: "rgba(119,132,117,0.16)" },
  no_show: { label: "ไม่มาตามนัด", color: "#b5654d", soft: "rgba(181,101,77,0.14)" },
};

export function statusColor(s: string): string {
  return STATUS[s as StatusKey]?.color ?? "#9a8f7d";
}
export function statusLabel(s: string): string {
  return STATUS[s as StatusKey]?.label ?? s;
}

export const WEEKDAYS_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
export const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
/** Sunday-start week containing `d`. */
export function weekStart(d: Date): Date {
  return addDays(d, -d.getDay());
}

export function thaiShortDate(s: string): string {
  return parseYmd(s).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

/** "x นาที/ชม./วันที่แล้ว" from an ISO timestamp. */
export function timeAgo(iso: string, nowMs: number): string {
  if (!iso) return "";
  const diff = nowMs - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  return parseYmd(iso.slice(0, 10)).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// ── Atoms ──
export function Avatar({
  name,
  url,
  vip = false,
  size = 36,
}: {
  name: string;
  url?: string;
  vip?: boolean;
  size?: number;
}) {
  const ring = vip ? "ring-2 ring-[color:var(--color-warm-clay)]" : "ring-1 ring-[color:var(--color-forest-deep)]/12";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${ring}`}
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--color-bone-soft)] text-sm font-semibold text-[color:var(--color-forest-deep)] ${ring}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
