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
  source: string; // 'online' | 'walk_in'
  createdAt: string;
};

export type CalRoom = {
  id: string;
  name: string;
  nameEn: string;
  maxGuests: number;
  price: number;
};

export const SOURCE_LABEL: Record<string, string> = {
  online: "ออนไลน์",
  walk_in: "Walk-in",
};
export function sourceLabel(s: string): string {
  return SOURCE_LABEL[s] ?? s;
}

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

// ── Line icons (match AdminShell stroke style; no emoji) ──
export type IconName =
  | "tasks"
  | "bell"
  | "house"
  | "calendar"
  | "slip"
  | "wallet"
  | "login"
  | "logout"
  | "users"
  | "chevronLeft"
  | "chevronRight"
  | "clock"
  | "search"
  | "filter"
  | "download"
  | "printer"
  | "plus"
  | "chart";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  tasks: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><path d="m9 14 2 2 4-4" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9" /><path d="M10.5 21a1.8 1.8 0 0 0 3 0" /></>,
  house: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M14 13h3" /></>,
  slip: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" /><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" /><path d="M21 11h-5a2 2 0 0 0 0 4h5z" /></>,
  login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></>,
  logout: <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  users: <><circle cx="9" cy="8" r="3.3" /><path d="M3 20c0-3.2 2.7-5.8 6-5.8s6 2.6 6 5.8" /><path d="M16 5.5a3.3 3.3 0 0 1 0 6.1M21 20c0-2.4-1.3-4.5-3.3-5.4" /></>,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  filter: <path d="M3 5h18l-7 8v5l-4 2v-7z" />,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
  printer: <><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
};

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICON_PATHS[name]}
    </svg>
  );
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
