"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/react";
import type { BookingStatus } from "@/types";

export type ReviewRow = {
  id: string;
  booking_code: string;
  room_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
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

const FILTERS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "payment_review", label: "รอตรวจสลิป" },
  { key: "pending_payment", label: "รอชำระ" },
  { key: "confirmed", label: "ยืนยันแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
  { key: "cancelled", label: "ยกเลิก" },
];

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
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.booking_code.toLowerCase().includes(term) ||
        r.customer_name.toLowerCase().includes(term) ||
        r.customer_phone.includes(term)
      );
    });
  }, [rows, filter, q]);

  async function patch(id: string, body: Record<string, string>, optimistic: BookingStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setRows((list) => list.map((r) => (r.id === id ? { ...r, status: optimistic } : r)));
    } catch {
      window.alert("ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
            {counts[f.key] ? ` (${counts[f.key]})` : ""}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหา รหัสจอง / ชื่อลูกค้า / เบอร์โทร"
        className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />

      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          ไม่พบรายการ
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => {
            const note = parseNote(r.payment?.verify_note ?? null);
            const verify = r.payment?.verify_status
              ? VERIFY[r.payment.verify_status] ?? VERIFY.pending
              : null;
            const busy = busyId === r.id;
            return (
              <li key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{r.booking_code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}>
                        {STATUS_TH[r.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-700">
                      {r.customer_name} · {r.room_name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {r.customer_email}
                      {r.customer_phone ? ` · ${r.customer_phone}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {thaiDate(r.check_in)} – {thaiDate(r.check_out)} · {r.adults} ผู้ใหญ่
                      {r.children > 0 ? ` · ${r.children} เด็ก` : ""} · ฿
                      {r.total_amount.toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {r.status === "payment_review" && (
                      <>
                        <Button size="sm" variant="primary" isDisabled={busy} onPress={() => patch(r.id, { action: "confirm" }, "confirmed")}>
                          ยืนยันการจอง
                        </Button>
                        <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => patch(r.id, { action: "reject" }, "cancelled")}>
                          ปฏิเสธ
                        </Button>
                      </>
                    )}
                    {r.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => patch(r.id, { status: "completed" }, "completed")}>
                          เสร็จสิ้น
                        </Button>
                        <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => patch(r.id, { status: "no_show" }, "no_show")}>
                          ไม่มาตามนัด
                        </Button>
                      </>
                    )}
                    {(r.status === "pending_payment" || r.status === "payment_review" || r.status === "confirmed") && (
                      <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => patch(r.id, { status: "cancelled" }, "cancelled")}>
                        ยกเลิก
                      </Button>
                    )}
                  </div>
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
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- slip data URL */}
          <img src={zoom} alt="สลิป" className="max-h-[90vh] max-w-[90vw] object-contain" />
        </div>
      )}
    </div>
  );
}
