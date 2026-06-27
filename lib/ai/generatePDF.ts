/**
 * Client-side A4 PDF report generator for "น้องแคมป์".
 *
 * Runs in the browser (called from the chat widget's "ดาวน์โหลด PDF" button).
 * Thai glyphs need an embedded Thai font — jsPDF's built-in fonts are Latin
 * only — so we fetch /fonts/Sarabun-Regular.ttf and register it at runtime.
 * If that file is missing we fall back to Helvetica (Latin) rather than crash;
 * drop Sarabun-Regular.ttf into public/fonts/ to get proper Thai text.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Json = Record<string, unknown>;
export type ReportPayload = { type: string; title: string; data: Json };

const STATUS_TH: Record<string, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};

function baht(n: unknown): string {
  return `${Math.round(Number(n) || 0).toLocaleString("en-US")} บาท`;
}
function thaiDateTime(): string {
  return new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
}

async function registerThaiFont(doc: jsPDF): Promise<string> {
  try {
    const res = await fetch("/fonts/Sarabun-Regular.ttf");
    if (!res.ok) return "helvetica";
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    doc.addFileToVFS("Sarabun-Regular.ttf", b64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    return "Sarabun";
  } catch {
    return "helvetica";
  }
}

function finalY(doc: jsPDF, fallback: number): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return last ? last.finalY : fallback;
}

/** Build + trigger download of an A4 PDF for the given report payload. */
export async function generateReportPDF(report: ReportPayload, titleOverride?: string): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const font = await registerThaiFont(doc);
  doc.setFont(font, "normal");

  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const title = titleOverride ?? report.title ?? "รายงาน";

  // ── Header ──
  doc.setFontSize(18);
  doc.setTextColor(45, 55, 40);
  doc.text("LandCamp Villa", marginX, 50);
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(title, marginX, 72);
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`สร้างเมื่อ ${thaiDateTime()}`, marginX, 88);
  doc.setDrawColor(210, 205, 195);
  doc.line(marginX, 98, pageW - marginX, 98);

  const baseStyles = { font, fontSize: 10, cellPadding: 5 } as const;
  const headStyles = { font, fillColor: [77, 88, 75] as [number, number, number], textColor: 255, fontSize: 10 };

  const startY = 116;
  if (report.type === "summary") {
    drawSummary(doc, report.data, marginX, startY, font);
  } else if (report.type === "revenue") {
    drawRevenue(doc, report.data, marginX, startY, baseStyles, headStyles);
  } else {
    drawBookings(doc, report.data, marginX, startY, baseStyles, headStyles);
  }

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont(font, "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("สร้างโดยน้องแคมป์ AI — LandCamp Villa System", marginX, pageH - 24);
    doc.text(`หน้า ${p} / ${pages}`, pageW - marginX, pageH - 24, { align: "right" });
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`landcamp-${report.type}-${today}.pdf`);
}

/* ── summary: KPI grid ──────────────────────────────────────────── */
function drawSummary(doc: jsPDF, d: Json, x: number, y: number, font: string): number {
  const cards: { label: string; value: string }[] = [
    { label: "การจองวันนี้", value: String(Number(d.bookingsToday) || 0) },
    { label: "เช็คอินวันนี้", value: String(Number(d.arrivalsToday) || 0) },
    { label: "รายได้วันนี้", value: baht(d.revenueToday) },
    { label: "ห้องว่าง", value: `${Number(d.roomsAvailable) || 0} / ${Number(d.roomsTotal) || 0}` },
    { label: "มีคนพัก", value: String(Number(d.roomsOccupied) || 0) },
    { label: "สลิปรอตรวจ", value: String(Number(d.slipsPending) || 0) },
  ];
  const cols = 3;
  const gap = 12;
  const pageW = doc.internal.pageSize.getWidth();
  const cardW = (pageW - x * 2 - gap * (cols - 1)) / cols;
  const cardH = 64;
  cards.forEach((c, i) => {
    const cx = x + (i % cols) * (cardW + gap);
    const cy = y + Math.floor(i / cols) * (cardH + gap);
    doc.setFillColor(247, 245, 240);
    doc.setDrawColor(225, 220, 210);
    doc.roundedRect(cx, cy, cardW, cardH, 6, 6, "FD");
    doc.setFont(font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(c.label, cx + 12, cy + 22);
    doc.setFontSize(16);
    doc.setTextColor(45, 55, 40);
    doc.text(c.value, cx + 12, cy + 46);
  });
  return y + Math.ceil(cards.length / cols) * (cardH + gap);
}

/* ── revenue: category + room tables ────────────────────────────── */
function drawRevenue(
  doc: jsPDF,
  d: Json,
  x: number,
  y: number,
  styles: Json,
  headStyles: Json,
): number {
  const byCategory = (d.byCategory as Record<string, number>) ?? {};
  const byRoom = (d.byRoom as Record<string, number>) ?? {};
  const total = Number(d.total) || 0;

  const catBody = Object.entries(byCategory).map(([k, v]) => [k, baht(v)]);
  catBody.push(["รวมทั้งหมด", baht(total)]);
  autoTable(doc, {
    startY: y,
    head: [["หมวดรายรับ", "จำนวนเงิน"]],
    body: catBody,
    styles: styles as never,
    headStyles: headStyles as never,
    columnStyles: { 1: { halign: "right" } },
    margin: { left: x, right: x },
  });
  let ny = finalY(doc, y) + 20;

  const roomBody = Object.entries(byRoom).map(([k, v]) => [k, baht(v)]);
  if (roomBody.length > 0) {
    autoTable(doc, {
      startY: ny,
      head: [["แยกตามห้อง", "จำนวนเงิน"]],
      body: roomBody,
      styles: styles as never,
      headStyles: headStyles as never,
      columnStyles: { 1: { halign: "right" } },
      margin: { left: x, right: x },
    });
    ny = finalY(doc, ny) + 20;
  }
  return ny;
}

/* ── bookings / check-ins / cancellations table ─────────────────── */
function drawBookings(
  doc: jsPDF,
  d: Json,
  x: number,
  y: number,
  styles: Json,
  headStyles: Json,
): number {
  let head: string[];
  let body: string[][];

  if (Array.isArray(d.cancellations)) {
    head = ["รหัส", "ลูกค้า", "ห้อง", "เข้าพัก", "ยอด", "เหตุผล"];
    body = (d.cancellations as Json[]).map((b) => [
      String(b.bookingCode ?? "—"),
      String(b.customer ?? "—"),
      String(b.room ?? "—"),
      String(b.checkIn ?? "—"),
      baht(b.amount),
      String(b.reason ?? "—"),
    ]);
  } else if (Array.isArray(d.checkIns)) {
    head = ["รหัส", "ลูกค้า", "ห้อง", "เช็คอิน", "ผู้เข้าพัก", "สถานะ"];
    body = (d.checkIns as Json[]).map((b) => [
      String(b.bookingCode ?? "—"),
      String(b.customer ?? "—"),
      String(b.room ?? "—"),
      String(b.checkIn ?? "—"),
      String(b.guests ?? "—"),
      STATUS_TH[String(b.status)] ?? String(b.status ?? "—"),
    ]);
  } else {
    head = ["รหัส", "ลูกค้า", "ห้อง", "เข้าพัก", "ออก", "สถานะ", "ยอด"];
    body = ((d.bookings as Json[]) ?? []).map((b) => [
      String(b.bookingCode ?? "—"),
      String(b.customer ?? "—"),
      String(b.room ?? "—"),
      String(b.checkIn ?? "—"),
      String(b.checkOut ?? "—"),
      STATUS_TH[String(b.status)] ?? String(b.status ?? "—"),
      baht(b.amount),
    ]);
  }

  if (body.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text("ไม่มีข้อมูลในช่วงที่เลือก", x, y + 10);
    return y + 24;
  }

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    styles: styles as never,
    headStyles: headStyles as never,
    margin: { left: x, right: x },
  });
  return finalY(doc, y) + 20;
}
