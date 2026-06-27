import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { dispatchFunction } from "@/lib/ai/functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = Record<string, unknown>;

function baht(n: unknown): string {
  return `฿${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
}
function num(v: unknown): number {
  return Number(v) || 0;
}

/**
 * Proactive opening report shown when the chat widget first loads. Computed
 * deterministically from the real handlers (no model call) so the figures are
 * always accurate. On /admin/revenue it also folds in today's + this month's
 * revenue. Returns a ready-to-display "model" message.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const page = request.nextUrl.searchParams.get("page") ?? "";

  const [summary, checkIns, slips] = await Promise.all([
    dispatchFunction("getDashboardSummary", {}),
    dispatchFunction("getUpcomingCheckIns", { hours: 48 }),
    dispatchFunction("getSlipsSummary", {}),
  ]);

  const lines: string[] = ["สวัสดีครับ นี่คือสรุปภาพรวมล่าสุด"];

  if (!("error" in summary)) {
    lines.push("");
    lines.push(`การจองวันนี้ ${num(summary.bookingsToday)} รายการ (เช็คอินวันนี้ ${num(summary.arrivalsToday)})`);
    lines.push(`รายได้วันนี้ ${baht(summary.revenueToday)}`);
    lines.push(
      `ห้องว่าง ${num(summary.roomsAvailable)} จาก ${num(summary.roomsTotal)} ห้อง` +
        ` (มีคนพัก ${num(summary.roomsOccupied)}, ปิดปรับปรุง ${num(summary.roomsMaintenance)})`,
    );
  }

  const awaiting = !("error" in slips) ? num(slips.awaitingReview) : 0;
  lines.push(`มีสลิปรอตรวจ ${awaiting} รายการ`);

  if (!("error" in checkIns)) {
    lines.push(`เช็คอินใน 48 ชั่วโมงข้างหน้า ${num(checkIns.count)} รายการ`);
  }

  // Revenue page → richer revenue context.
  let revenueReport: Json | null = null;
  if (page.startsWith("/admin/revenue")) {
    const [today, month] = await Promise.all([
      dispatchFunction("getRevenueReport", { period: "day" }),
      dispatchFunction("getRevenueReport", { period: "month" }),
    ]);
    if (!("error" in today)) lines.push(`รายได้วันนี้ (ตามบัญชีรายรับ) ${baht(today.total)}`);
    if (!("error" in month)) {
      lines.push(`รายได้เดือนนี้ ${baht(month.total)} จาก ${num(month.entries)} รายการ`);
      revenueReport = month;
    }
  }

  lines.push("");
  lines.push("ถามอะไรเพิ่มได้เลยครับ เช่น รายได้เดือนนี้ หรือห้องว่างคืนนี้");

  const message = {
    role: "model" as const,
    content: lines.join("\n"),
    timestamp: new Date().toISOString(),
  };

  // Offer a PDF: the overview summary by default, or the monthly revenue on the
  // revenue page.
  const report = revenueReport
    ? { type: "revenue", title: "รายงานรายได้เดือนนี้", data: revenueReport }
    : !("error" in summary)
      ? { type: "summary", title: "ภาพรวมระบบ", data: summary }
      : null;

  return NextResponse.json({ message, report });
}
