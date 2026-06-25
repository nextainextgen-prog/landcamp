"use client";

import { useEffect, useState } from "react";

import { Panel } from "@/components/admin/ui";

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
      {children}
    </span>
  );
}

export function CalendarSettingsForm() {
  const [unavailable, setUnavailable] = useState(false);
  const [airbnb, setAirbnb] = useState("");
  const [booking, setBooking] = useState("");
  const [agoda, setAgoda] = useState("");
  const [exportEnabled, setExportEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/calendar")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        setAirbnb(data.airbnb ?? "");
        setBooking(data.booking ?? "");
        setAgoda(data.agoda ?? "");
        setExportEnabled(Boolean(data.exportEnabled));
      })
      .catch(() => setUnavailable(true));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings/calendar", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ airbnb, booking, agoda, exportEnabled }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
      setSaving(false);
      return;
    }
    setMsg({ kind: "ok", text: "บันทึกแล้ว" });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านค่าจากฐานข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>015_email_channel_settings</strong> แล้ว
        </div>
      )}

      <Panel title="ซิงก์ปฏิทินกับแพลตฟอร์มอื่น (iCal)" bodyClassName="flex flex-col gap-5">
        <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
          วางลิงก์ iCal (.ics) จากแต่ละแพลตฟอร์มไว้ได้เลย เก็บไว้ก่อนกรอกภายหลังก็ได้ —
          ระบบจะนำมาใช้ดึงวันที่ถูกจองจากช่องทางอื่น (กันจองชน) เมื่อเปิดใช้งานในขั้นถัดไป
        </div>

        <label className="grid gap-1.5">
          <Label>Airbnb — ลิงก์ iCal</Label>
          <input className={inputCls} value={airbnb} onChange={(e) => setAirbnb(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/....ics" />
        </label>
        <label className="grid gap-1.5">
          <Label>Booking.com — ลิงก์ iCal</Label>
          <input className={inputCls} value={booking} onChange={(e) => setBooking(e.target.value)} placeholder="https://admin.booking.com/...ics" />
        </label>
        <label className="grid gap-1.5">
          <Label>Agoda — ลิงก์ iCal</Label>
          <input className={inputCls} value={agoda} onChange={(e) => setAgoda(e.target.value)} placeholder="https://...ics" />
        </label>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={exportEnabled} onChange={(e) => setExportEnabled(e.target.checked)} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" />
          <span className="text-sm text-[color:var(--color-ink)]">เปิดให้แพลตฟอร์มอื่นดึงปฏิทินของเรา (export)</span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          {msg && <span className={msg.kind === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>{msg.text}</span>}
        </div>
      </Panel>
    </div>
  );
}
