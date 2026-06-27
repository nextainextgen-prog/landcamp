/**
 * Customer analytics — RFM, CLV and a health score derived purely from a
 * customer's bookings. No DB access here; the page passes in the booking rows
 * it already fetched and a reference timestamp (so the result is deterministic
 * and easy to test).
 */

export type BadgeTone = "clay" | "forest" | "sage" | "neutral" | "amber" | "red" | "blue";

/** Statuses that count as realised revenue (mirrors the booking pages). */
export const EARNING_STATUSES = new Set(["confirmed", "completed"]);

export type MetricsBooking = {
  status: string;
  total_amount: number | null;
  created_at: string;
};

export type CustomerMetrics = {
  totalBookings: number;
  paidBookings: number;
  totalSpent: number;
  avgOrderValue: number;
  recencyDays: number | null;
  rfm: { r: number; f: number; m: number; code: string };
  segment: { key: string; label: string; tone: BadgeTone };
  clv: number;
  health: { score: number; label: string; tone: BadgeTone };
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeCustomerMetrics(
  bookings: MetricsBooking[],
  nowMs: number,
): CustomerMetrics {
  const totalBookings = bookings.length;
  const paid = bookings.filter((b) => EARNING_STATUSES.has(b.status));
  const paidBookings = paid.length;
  const totalSpent = paid.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const avgOrderValue = paidBookings > 0 ? Math.round(totalSpent / paidBookings) : 0;

  // Recency — days since the most recent booking of any status.
  let lastMs: number | null = null;
  for (const b of bookings) {
    const ms = new Date(b.created_at).getTime();
    if (!Number.isNaN(ms) && (lastMs === null || ms > lastMs)) lastMs = ms;
  }
  const recencyDays = lastMs === null ? null : Math.max(0, Math.floor((nowMs - lastMs) / DAY_MS));

  // ── RFM scoring (1–3 each) ──
  const r = recencyDays === null ? 1 : recencyDays <= 30 ? 3 : recencyDays <= 90 ? 2 : 1;
  const f = paidBookings >= 3 ? 3 : paidBookings >= 1 ? 2 : 1;
  const m = totalSpent >= 10000 ? 3 : totalSpent >= 3000 ? 2 : 1;
  const code = `${r}${f}${m}`;

  const segment = pickSegment({ r, f, m, totalBookings, paidBookings });

  // ── Projected lifetime value: avg order × expected future visits. ──
  const clv = paidBookings > 0 ? Math.round(avgOrderValue * (paidBookings + 2)) : 0;

  // ── Health score 0–100 (recency 50 / frequency 30 / monetary 20). ──
  const recencyPts =
    recencyDays === null
      ? 0
      : recencyDays <= 30
        ? 50
        : recencyDays <= 90
          ? 35
          : recencyDays <= 180
            ? 20
            : recencyDays <= 365
              ? 8
              : 0;
  const frequencyPts = (Math.min(paidBookings, 5) / 5) * 30;
  const monetaryPts = Math.min(totalSpent / 20000, 1) * 20;
  const score = Math.round(recencyPts + frequencyPts + monetaryPts);
  const health = healthLabel(score);

  return {
    totalBookings,
    paidBookings,
    totalSpent,
    avgOrderValue,
    recencyDays,
    rfm: { r, f, m, code },
    segment,
    clv,
    health,
  };
}

function pickSegment({
  r,
  f,
  m,
  totalBookings,
  paidBookings,
}: {
  r: number;
  f: number;
  m: number;
  totalBookings: number;
  paidBookings: number;
}): CustomerMetrics["segment"] {
  if (totalBookings === 0) return { key: "prospect", label: "ยังไม่เคยจอง", tone: "neutral" };
  // "ประจำ" / "ชั้นดี" mean the guest actually came back — require ≥2 real stays
  // (champion already needs f≥3 ⇒ ≥3 stays). A single recent booking → "ลูกค้าใหม่".
  if (r >= 3 && f >= 3) return { key: "champion", label: "ลูกค้าชั้นดี", tone: "forest" };
  if (paidBookings >= 2 && r >= 2 && f >= 2) return { key: "loyal", label: "ลูกค้าประจำ", tone: "sage" };
  if (r === 1 && f >= 2) return { key: "at_risk", label: "เสี่ยงหาย", tone: "amber" };
  if (r === 1 && f <= 1) return { key: "lost", label: "หายไปแล้ว", tone: "red" };
  if (f <= 1 && m >= 2) return { key: "big_spender", label: "จองใหญ่", tone: "clay" };
  return { key: "new", label: "ลูกค้าใหม่", tone: "blue" };
}

function healthLabel(score: number): CustomerMetrics["health"] {
  if (score >= 70) return { score, label: "แข็งแรง", tone: "forest" };
  if (score >= 40) return { score, label: "ปกติ", tone: "sage" };
  if (score >= 15) return { score, label: "เริ่มห่าง", tone: "amber" };
  return { score, label: "เสี่ยงหลุด", tone: "red" };
}
