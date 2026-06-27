"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/ui";
import type { BookingStatus } from "@/types";

export type NotifyLogItem = {
  id: string;
  kind: string; // card_confirm | card_reminder
  status: string; // sent | failed | skipped
  bookingCode: string | null;
  at: string; // ISO created_at
};

export type NotifyBooking = {
  id: string;
  code: string;
  roomName: string;
  status: BookingStatus;
};

const KIND_TH: Record<string, string> = {
  card_confirm: "การ์ดยืนยันการจอง",
  card_reminder: "การ์ดเตือนก่อนเข้าพัก",
};
const STATUS_META: Record<string, { th: string; tone: "forest" | "red" | "neutral" }> = {
  sent: { th: "ส่งสำเร็จ", tone: "forest" },
  failed: { th: "ส่งไม่สำเร็จ", tone: "red" },
  skipped: { th: "ไม่ได้ส่ง", tone: "neutral" },
};

const CARD = "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

function thaiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerNotifications({
  customerId,
  bookings,
  lineLinked,
  initialLog,
}: {
  customerId: string;
  bookings: NotifyBooking[];
  lineLinked: boolean;
  initialLog: NotifyLogItem[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  async function send(bookingId: string) {
    setBusyId(bookingId);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/send-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && json.ok) {
        setToast({ ok: true, msg: "ส่งการ์ด LINE ให้ลูกค้าแล้ว" });
      } else if (res.ok) {
        setToast({ ok: false, msg: "ส่งไม่สำเร็จ — ลูกค้าอาจยังไม่ได้ผูก LINE หรือการ์ดถูกปิดอยู่" });
      } else {
        setToast({ ok: false, msg: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง" });
      }
      // Re-render the server component so the history list reflects this send.
      router.refresh();
    } catch {
      setToast({ ok: false, msg: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Send a card ── */}
      <section className={CARD}>
        <header className="flex items-center justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/8 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">ส่งการ์ดแจ้งเตือน LINE</h2>
          {lineLinked ? (
            <Badge tone="forest">ผูก LINE แล้ว</Badge>
          ) : (
            <Badge tone="neutral">ยังไม่ได้ผูก LINE</Badge>
          )}
        </header>

        {!lineLinked && (
          <div className="border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-warm-clay)]/8 px-5 py-3 text-[13px] text-[color:var(--color-warm-clay)]">
            ลูกค้ารายนี้ยังไม่ได้เข้าสู่ระบบผ่าน LINE — กดส่งได้แต่การ์ดจะไม่ถึงปลายทางจนกว่าลูกค้าจะผูก LINE
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="p-5">
            <Empty>ยังไม่มีการจองให้ส่งการ์ด</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-forest-deep)]/8">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">{b.code}</div>
                  <div className="truncate text-xs text-[color:var(--color-ink)]/45">{b.roomName}</div>
                </div>
                <button
                  type="button"
                  disabled={busyId === b.id}
                  onClick={() => send(b.id)}
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#06C755]/40 px-3 py-1.5 text-xs font-medium text-[#06A94B] transition-colors hover:bg-[#06C755]/8 disabled:opacity-50"
                >
                  {busyId === b.id ? (
                    <Spinner />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  ส่งการ์ดยืนยัน
                </button>
              </li>
            ))}
          </ul>
        )}

        {toast && (
          <div
            className={`border-t border-[color:var(--color-forest-deep)]/8 px-5 py-3 text-[13px] ${
              toast.ok ? "text-[color:var(--color-forest-deep)]" : "text-[color:var(--color-warm-clay)]"
            }`}
          >
            {toast.msg}
          </div>
        )}
      </section>

      {/* ── History ── */}
      <section className={CARD}>
        <header className="border-b border-[color:var(--color-forest-deep)]/8 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">ประวัติการส่งแจ้งเตือน</h2>
        </header>
        {initialLog.length === 0 ? (
          <div className="p-5">
            <Empty>ยังไม่มีประวัติการส่ง</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-forest-deep)]/8 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink)]/45">
                  <th className="px-5 py-3.5">วันที่/เวลา</th>
                  <th className="px-5 py-3.5">ประเภท</th>
                  <th className="px-5 py-3.5">การจอง</th>
                  <th className="px-5 py-3.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
                {initialLog.map((n) => {
                  const meta = STATUS_META[n.status] ?? STATUS_META.skipped;
                  return (
                    <tr key={n.id} className="hover:bg-[color:var(--color-bone-soft)]/30">
                      <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">{thaiDateTime(n.at)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[color:var(--color-ink)]/75">{KIND_TH[n.kind] ?? n.kind}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">{n.bookingCode ?? "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge tone={meta.tone}>{meta.th}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-forest-deep)]/20 bg-[color:var(--color-bone-soft)]/30 px-6 py-10 text-center text-sm text-[color:var(--color-ink)]/55">
      {children}
    </div>
  );
}
