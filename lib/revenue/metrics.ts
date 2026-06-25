/**
 * Revenue analytics — pure aggregation shared by the /admin/revenue dashboard.
 *
 * No DB access here. The server page fetches the raw rows once; the client
 * passes them (plus the active filters) into `computeRevenue` on every filter
 * change, so the whole dashboard re-filters instantly with no round-trips.
 *
 * Two notions of revenue are tracked side by side:
 *   • booked    — value of confirmed/completed bookings + manual ledger income.
 *   • collected — money actually received (paid payments) + manual income.
 * The gap between them is `outstanding` (booked but not yet collected).
 *
 * All amounts are THB integers.
 */

export type BadgeTone = "clay" | "forest" | "sage" | "neutral" | "amber" | "red" | "blue";

/** Booking statuses that count as realised (booked) revenue. */
export const EARNING_STATUSES = new Set(["confirmed", "completed"]);

export type RevView = "booked" | "collected";
export type Granularity = "day" | "month";

// ── Raw inputs (mirror the DB columns the page selects) ──
export type RevBooking = {
  id: string;
  booking_code: string;
  room_id: string | null;
  customer_id: string | null;
  status: string;
  total_amount: number | null;
  check_in: string | null;
  created_at: string;
  source: string | null;
};

export type RevPayment = {
  id: string;
  booking_id: string;
  amount: number | null;
  status: string;
  method: string | null;
  paid_at: string | null;
  created_at: string;
};

export type RevEntry = {
  id: string;
  occurred_at: string;
  label: string;
  category: string;
  amount: number | null;
  method: string | null;
  customer_name: string | null;
  room_id: string | null;
  source: string;
};

export type RevenueInput = {
  bookings: RevBooking[];
  payments: RevPayment[];
  entries: RevEntry[];
  roomName: Map<string, string>;
  customerName: Map<string, string>;
};

export type DateRange = { from: string; to: string }; // inclusive YYYY-MM-DD

export type RevenueOptions = {
  view: RevView;
  granularity: Granularity;
  range: DateRange;
  roomId: string | "all";
};

/** One row in the transactions table — booking, collected payment or manual entry. */
export type RevTxn = {
  id: string;
  date: string; // YYYY-MM-DD
  type: "booking" | "payment" | "manual";
  ref: string;
  customer: string;
  room: string;
  method: string;
  status: string;
  category: string;
  amount: number;
};

export type SeriesPoint = { key: string; label: string; value: number; compare: number };
export type Slice = { name: string; value: number; color: string };

export type RevenueResult = {
  kpis: {
    booked: number;
    collected: number;
    outstanding: number;
    bookingCount: number;
    aov: number;
    avgDailyCollected: number;
    primaryTotal: number; // booked or collected depending on view
    primaryGrowthPct: number | null; // vs previous equal-length period
    collectionRate: number; // collected / booked, 0..1
  };
  series: SeriesPoint[];
  byRoom: Slice[];
  byMethod: Slice[];
  byCategory: Slice[];
  transactions: RevTxn[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const num = (v: number | null | undefined) => (typeof v === "number" && !Number.isNaN(v) ? v : 0);
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");

const inRange = (d: string, range: DateRange) => d !== "" && d >= range.from && d <= range.to;

// Earthy palette reused across the donut/bars for deterministic colours.
const PALETTE = [
  "#4d584b", "#9a795b", "#778475", "#5b7fa6", "#d4a24c",
  "#b5654d", "#a2aaa1", "#8a6d8b", "#6f8f6a", "#c08552",
];
const colorFor = (i: number) => PALETTE[i % PALETTE.length];

const CATEGORY_TH: Record<string, string> = {
  room: "ห้องพัก",
  activity: "กิจกรรม",
  food: "อาหาร",
  walk_in: "Walk-in",
  deposit: "มัดจำ",
  refund: "คืนเงิน",
  other: "อื่นๆ",
};
export const categoryLabel = (c: string) => CATEGORY_TH[c] ?? c;

const METHOD_TH: Record<string, string> = {
  cash: "เงินสด",
  transfer: "โอนเงิน",
  promptpay: "พร้อมเพย์",
  card: "บัตร",
  other: "อื่นๆ",
};
export const methodLabel = (m: string) => METHOD_TH[m] ?? (m || "ไม่ระบุ");

/** Days (inclusive) spanned by a range. */
export function rangeDays(range: DateRange): number {
  const a = new Date(`${range.from}T00:00:00Z`).getTime();
  const b = new Date(`${range.to}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / DAY_MS) + 1);
}

/** The equal-length window immediately preceding `range` (for growth deltas). */
export function previousRange(range: DateRange): DateRange {
  const span = rangeDays(range);
  const fromMs = new Date(`${range.from}T00:00:00Z`).getTime();
  const prevTo = new Date(fromMs - DAY_MS).toISOString().slice(0, 10);
  const prevFrom = new Date(fromMs - span * DAY_MS).toISOString().slice(0, 10);
  return { from: prevFrom, to: prevTo };
}

export function growthPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null; // null = "new" (no baseline)
  return ((curr - prev) / prev) * 100;
}

function thaiMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
}
function thaiDay(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

/** Enumerate the bucket keys covering a range so charts show empty gaps as 0. */
function bucketKeys(range: DateRange, g: Granularity): { key: string; label: string }[] {
  const keys: { key: string; label: string }[] = [];
  if (g === "day") {
    let t = new Date(`${range.from}T00:00:00Z`).getTime();
    const end = new Date(`${range.to}T00:00:00Z`).getTime();
    while (t <= end) {
      const d = new Date(t).toISOString().slice(0, 10);
      keys.push({ key: d, label: thaiDay(d) });
      t += DAY_MS;
    }
  } else {
    const start = new Date(`${range.from.slice(0, 7)}-01T00:00:00Z`);
    const end = new Date(`${range.to.slice(0, 7)}-01T00:00:00Z`);
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
      const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
      keys.push({ key: ym, label: thaiMonth(ym) });
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  }
  return keys;
}

const bucketOf = (d: string, g: Granularity) => (g === "day" ? d : d.slice(0, 7));

/** Build the unified transaction list for a given view within the date range. */
function buildTxns(input: RevenueInput, opts: RevenueOptions): RevTxn[] {
  const { view, range, roomId } = opts;
  const txns: RevTxn[] = [];
  const roomMatch = (id: string | null) => roomId === "all" || id === roomId;

  if (view === "booked") {
    for (const b of input.bookings) {
      if (!EARNING_STATUSES.has(b.status)) continue;
      const d = day(b.created_at);
      if (!inRange(d, range) || !roomMatch(b.room_id)) continue;
      txns.push({
        id: `b:${b.id}`,
        date: d,
        type: "booking",
        ref: b.booking_code,
        customer: (b.customer_id && input.customerName.get(b.customer_id)) || "—",
        room: (b.room_id && input.roomName.get(b.room_id)) || "—",
        method: b.source === "walk_in" ? "เงินสด" : "โอนเงิน",
        status: b.status,
        category: "room",
        amount: num(b.total_amount),
      });
    }
  } else {
    const bookingRoom = new Map(input.bookings.map((b) => [b.id, b.room_id] as const));
    const bookingCode = new Map(input.bookings.map((b) => [b.id, b.booking_code] as const));
    const bookingCust = new Map(input.bookings.map((b) => [b.id, b.customer_id] as const));
    for (const p of input.payments) {
      if (p.status !== "paid") continue;
      const d = day(p.paid_at) || day(p.created_at);
      const rid = bookingRoom.get(p.booking_id) ?? null;
      if (!inRange(d, range) || !roomMatch(rid)) continue;
      const cid = bookingCust.get(p.booking_id) ?? null;
      txns.push({
        id: `p:${p.id}`,
        date: d,
        type: "payment",
        ref: bookingCode.get(p.booking_id) ?? p.booking_id.slice(0, 8),
        customer: (cid && input.customerName.get(cid)) || "—",
        room: (rid && input.roomName.get(rid)) || "—",
        method: methodLabel(p.method ?? ""),
        status: "paid",
        category: "room",
        amount: num(p.amount),
      });
    }
  }

  // Manual ledger income counts toward both views (it is recognised revenue).
  for (const e of input.entries) {
    const d = day(e.occurred_at);
    if (!inRange(d, range) || !roomMatch(e.room_id)) continue;
    txns.push({
      id: `e:${e.id}`,
      date: d,
      type: "manual",
      ref: e.source === "import" ? "นำเข้า" : "เพิ่มเอง",
      customer: e.customer_name || "—",
      room: (e.room_id && input.roomName.get(e.room_id)) || "—",
      method: methodLabel(e.method ?? ""),
      status: "ledger",
      category: e.category,
      amount: num(e.amount),
    });
  }

  txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return txns;
}

/** Sum a primary-view total over an arbitrary range (used for growth deltas). */
function primaryTotalFor(input: RevenueInput, opts: RevenueOptions): number {
  return buildTxns(input, opts).reduce((s, t) => s + t.amount, 0);
}

export function computeRevenue(input: RevenueInput, opts: RevenueOptions): RevenueResult {
  const { range, granularity, roomId, view } = opts;
  const roomMatch = (id: string | null) => roomId === "all" || id === roomId;

  // ── Booked: earning bookings + manual entries in range ──
  let booked = 0;
  let bookingCount = 0;
  for (const b of input.bookings) {
    if (!EARNING_STATUSES.has(b.status)) continue;
    if (!inRange(day(b.created_at), range) || !roomMatch(b.room_id)) continue;
    booked += num(b.total_amount);
    bookingCount += 1;
  }

  // ── Collected: paid payments + manual entries in range ──
  const bookingRoom = new Map(input.bookings.map((b) => [b.id, b.room_id] as const));
  let collectedFromPayments = 0;
  for (const p of input.payments) {
    if (p.status !== "paid") continue;
    const d = day(p.paid_at) || day(p.created_at);
    const rid = bookingRoom.get(p.booking_id) ?? null;
    if (!inRange(d, range) || !roomMatch(rid)) continue;
    collectedFromPayments += num(p.amount);
  }

  let entriesTotal = 0;
  for (const e of input.entries) {
    if (!inRange(day(e.occurred_at), range) || !roomMatch(e.room_id)) continue;
    entriesTotal += num(e.amount);
  }

  booked += entriesTotal;
  const collected = collectedFromPayments + entriesTotal;
  const outstanding = Math.max(0, booked - collected);
  const aov = bookingCount > 0 ? Math.round((booked - entriesTotal) / bookingCount) : 0;
  const days = rangeDays(range);
  const avgDailyCollected = Math.round(collected / days);
  const collectionRate = booked > 0 ? Math.min(1, collected / booked) : 0;

  // ── Time series with previous-period overlay ──
  const txns = buildTxns(input, opts);
  const prevTxns = buildTxns(input, { ...opts, range: previousRange(range) });
  const curBuckets = new Map<string, number>();
  for (const t of txns) {
    const k = bucketOf(t.date, granularity);
    curBuckets.set(k, (curBuckets.get(k) ?? 0) + t.amount);
  }
  // Align previous period onto current keys by ordinal position.
  const prevKeys = bucketKeys(previousRange(range), granularity);
  const prevByOrdinal = new Map<number, number>();
  prevTxns.forEach((t) => {
    const k = bucketOf(t.date, granularity);
    const idx = prevKeys.findIndex((pk) => pk.key === k);
    if (idx >= 0) prevByOrdinal.set(idx, (prevByOrdinal.get(idx) ?? 0) + t.amount);
  });
  const keys = bucketKeys(range, granularity);
  const series: SeriesPoint[] = keys.map((k, i) => ({
    key: k.key,
    label: k.label,
    value: curBuckets.get(k.key) ?? 0,
    compare: prevByOrdinal.get(i) ?? 0,
  }));

  // ── Breakdowns (based on the active view's transactions) ──
  const roomAgg = new Map<string, number>();
  const methodAgg = new Map<string, number>();
  const catAgg = new Map<string, number>();
  for (const t of txns) {
    roomAgg.set(t.room, (roomAgg.get(t.room) ?? 0) + t.amount);
    methodAgg.set(t.method, (methodAgg.get(t.method) ?? 0) + t.amount);
    catAgg.set(t.category, (catAgg.get(t.category) ?? 0) + t.amount);
  }
  const toSlices = (m: Map<string, number>, mapLabel?: (k: string) => string): Slice[] =>
    [...m.entries()]
      .filter(([, v]) => v !== 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name: mapLabel ? mapLabel(name) : name, value, color: colorFor(i) }));

  // Primary total + growth.
  const primaryTotal = view === "booked" ? booked : collected;
  const prevPrimary = primaryTotalFor(input, { ...opts, range: previousRange(range) });
  const primaryGrowthPct = growthPct(primaryTotal, prevPrimary);

  return {
    kpis: {
      booked,
      collected,
      outstanding,
      bookingCount,
      aov,
      avgDailyCollected,
      primaryTotal,
      primaryGrowthPct,
      collectionRate,
    },
    series,
    byRoom: toSlices(roomAgg),
    byMethod: toSlices(methodAgg),
    byCategory: toSlices(catAgg, categoryLabel),
    transactions: txns,
  };
}

/** Bangkok-local today as YYYY-MM-DD (UTC+7), deterministic from a timestamp. */
export function bangkokToday(nowMs: number): string {
  return new Date(nowMs + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD date string by N days. */
export function addDays(d: string, n: number): string {
  return new Date(new Date(`${d}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** First day of the month for a YYYY-MM-DD string. */
export function startOfMonth(d: string): string {
  return `${d.slice(0, 7)}-01`;
}
