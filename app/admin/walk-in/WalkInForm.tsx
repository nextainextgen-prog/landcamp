"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/admin/ui";

export type WalkInRoom = {
  id: string;
  name: string;
  priceWeekday: number;
  priceWeekend: number;
  maxGuests: number;
};

const inputClass =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[color:var(--color-ink)]/60">{label}</span>
      {children}
    </label>
  );
}

type Result =
  | { kind: "ok"; bookingCode: string; total: number; paid: boolean }
  | { kind: "error"; message: string };

/**
 * Front-desk walk-in form. Submits to POST /api/admin/walk-in which finds/creates
 * the customer, runs the same availability + pricing as online booking, and
 * records the reservation as `confirmed` (source = walk_in) plus a payment row.
 */
export function WalkInForm({ rooms }: { rooms: WalkInRoom[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [method, setMethod] = useState("cash");
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setRoomId(rooms[0]?.id ?? "");
    setCheckIn("");
    setCheckOut("");
    setAdults("2");
    setChildren("0");
    setMethod("cash");
    setPaid(true);
    setNotes("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          phone,
          email: email || undefined,
          roomId,
          checkIn,
          checkOut,
          adults: Number(adults),
          children: Number(children),
          extraBed: false,
          method,
          paid,
          notes,
        }),
      });
      const data = (await res.json()) as {
        bookingCode?: string;
        totalAmount?: number;
        error?: string;
      };
      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "บันทึกไม่สำเร็จ" });
        return;
      }
      setResult({
        kind: "ok",
        bookingCode: data.bookingCode ?? "—",
        total: data.totalAmount ?? 0,
        paid,
      });
      resetForm();
      router.refresh();
    } catch {
      setResult({ kind: "error", message: "เครือข่ายขัดข้อง ลองอีกครั้ง" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {result?.kind === "ok" && (
        <div className="rounded-xl border border-[color:var(--color-forest-deep)]/20 bg-[color:var(--color-forest-deep)]/8 px-4 py-3 text-sm text-[color:var(--color-forest-deep)]">
          ✅ บันทึกการจองแล้ว — รหัส <span className="font-mono font-semibold">{result.bookingCode}</span> · ยอด ฿{result.total.toLocaleString("en-US")} · {result.paid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
        </div>
      )}
      {result?.kind === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {result.message}
        </div>
      )}

      <Panel title="ข้อมูลลูกค้า">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="ชื่อ-นามสกุล">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" />
          </Field>
          <Field label="เบอร์โทร">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
          </Field>
          <Field label="อีเมล (ถ้ามี)">
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </Field>
        </div>
      </Panel>

      <Panel title="รายละเอียดการจอง">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ห้องพัก">
            <select className={inputClass} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — ฿{r.priceWeekday.toLocaleString("en-US")}/คืน
                </option>
              ))}
            </select>
          </Field>
          <Field label="เช็คอิน">
            <input type="date" className={inputClass} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </Field>
          <Field label="เช็คเอาท์">
            <input type="date" className={inputClass} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </Field>
          <Field label="ผู้ใหญ่">
            <input type="number" min={1} className={inputClass} value={adults} onChange={(e) => setAdults(e.target.value)} />
          </Field>
          <Field label="เด็ก">
            <input type="number" min={0} className={inputClass} value={children} onChange={(e) => setChildren(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="การชำระเงิน">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="วิธีชำระ">
            <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">เงินสด</option>
              <option value="transfer">โอนเงิน</option>
              <option value="card">บัตรเครดิต</option>
            </select>
          </Field>
          <label className="mt-6 flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            <span className="text-sm text-[color:var(--color-ink)]/70">ชำระเงินแล้ว</span>
          </label>
          <Field label="หมายเหตุ">
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เช่น มาถึงดึก" />
          </Field>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[color:var(--color-forest-deep)] px-6 py-3 text-sm font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "กำลังบันทึก…" : "บันทึกการจอง"}
        </button>
      </div>
    </form>
  );
}
