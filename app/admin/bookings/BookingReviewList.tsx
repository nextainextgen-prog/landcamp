"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import type { BookingStatus } from "@/types";

export type ReviewRow = {
  id: string;
  booking_code: string;
  room_name: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: BookingStatus;
  total_amount: number;
  payment: {
    amount: number;
    kind: string;
    status: string;
    verify_status: string | null;
    verify_note: string | null;
    slip_image: string | null;
  } | null;
};

const STATUS_TH: Record<BookingStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-neutral-200 text-neutral-600",
  completed: "bg-teal-100 text-teal-800",
  no_show: "bg-red-100 text-red-700",
};

const VERIFY: Record<string, { label: string; cls: string }> = {
  matched: { label: "✓ สลิปตรง (ยอด+บัญชีถูกต้อง)", cls: "bg-emerald-100 text-emerald-800" },
  amount_mismatch: { label: "⚠ ยอดไม่ตรง", cls: "bg-amber-100 text-amber-800" },
  duplicate: { label: "⚠ สลิปซ้ำ (เคยใช้แล้ว)", cls: "bg-red-100 text-red-700" },
  unreadable: { label: "✗ อ่านสลิปไม่ออก", cls: "bg-red-100 text-red-700" },
  error: { label: "ระบบตรวจไม่สำเร็จ", cls: "bg-neutral-200 text-neutral-600" },
  pending: { label: "ยังไม่ได้ตรวจ", cls: "bg-neutral-200 text-neutral-600" },
};

function thaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function parseNote(note: string | null): Record<string, unknown> | null {
  if (!note) return null;
  try {
    return JSON.parse(note) as Record<string, unknown>;
  } catch {
    return { message: note };
  }
}

export function BookingReviewList({ initialRows }: { initialRows: ReviewRow[] }) {
  const [rows, setRows] = useState<ReviewRow[]>(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  async function act(id: string, action: "confirm" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("failed");
      const next: BookingStatus = action === "confirm" ? "confirmed" : "cancelled";
      setRows((list) => list.map((r) => (r.id === id ? { ...r, status: next } : r)));
    } catch {
      window.alert("ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
        ยังไม่มีการจอง
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const note = parseNote(r.payment?.verify_note ?? null);
          const verify = r.payment?.verify_status
            ? (VERIFY[r.payment.verify_status] ?? VERIFY.pending)
            : null;
          const reviewing = r.status === "payment_review";
          return (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{r.booking_code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}>
                      {STATUS_TH[r.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">{r.room_name}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {thaiDate(r.check_in)} – {thaiDate(r.check_out)} · {r.adults} ผู้ใหญ่
                    {r.children > 0 ? ` · ${r.children} เด็ก` : ""} · ฿{r.total_amount.toLocaleString("en-US")}
                  </div>
                </div>

                {reviewing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" isDisabled={busyId === r.id} onPress={() => act(r.id, "confirm")}>
                      ยืนยันการจอง
                    </Button>
                    <Button size="sm" variant="ghost" isDisabled={busyId === r.id} onPress={() => act(r.id, "reject")}>
                      ปฏิเสธ
                    </Button>
                  </div>
                )}
              </div>

              {r.payment && (r.payment.slip_image || verify) && (
                <div className="mt-3 flex flex-wrap items-start gap-4 border-t border-neutral-100 pt-3">
                  {r.payment.slip_image && (
                    <button
                      type="button"
                      onClick={() => setZoom(r.payment!.slip_image)}
                      className="shrink-0 overflow-hidden rounded-md border border-neutral-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- slip data URL */}
                      <img src={r.payment.slip_image} alt="สลิป" className="h-24 w-24 object-cover" />
                    </button>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-neutral-600">
                    {verify && (
                      <span className={`inline-flex w-fit rounded-full px-2 py-0.5 ${verify.cls}`}>
                        {verify.label}
                      </span>
                    )}
                    {note && (
                      <div className="mt-1 space-y-0.5">
                        {note.amountInSlip != null && (
                          <div>ยอดในสลิป: ฿{String(note.amountInSlip)} · ต้องชำระ: ฿{String(note.expected ?? "")}</div>
                        )}
                        {note.sender != null && <div>ผู้โอน: {String(note.sender)}</div>}
                        {note.transRef != null && <div className="font-mono">ref: {String(note.transRef)}</div>}
                        {note.message != null && <div className="text-neutral-400">{String(note.message)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- slip data URL */}
          <img src={zoom} alt="สลิป" className="max-h-[90vh] max-w-[90vw] object-contain" />
        </div>
      )}
    </>
  );
}
