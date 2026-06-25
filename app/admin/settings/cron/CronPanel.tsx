"use client";

import { useState } from "react";

import { Panel } from "@/components/admin/ui";

export function CronPanel() {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cron/clear-expired", { method: "POST" });
      const data = (await res.json()) as { cancelled?: number; error?: string };
      setMsg(res.ok ? `ยกเลิกการจองที่หมดเวลาแล้ว ${data.cancelled ?? 0} รายการ` : data.error ?? "รันไม่สำเร็จ");
    } catch {
      setMsg("รันไม่สำเร็จ (เครือข่าย)");
    }
    setRunning(false);
  }

  return (
    <Panel title="งานอัตโนมัติ (Cron)" bodyClassName="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-xl border border-[color:var(--color-forest-deep)]/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-forest-deep)]">เคลียร์การจองที่หมดเวลา</div>
            <div className="text-xs text-[color:var(--color-ink)]/55">ยกเลิกการจองที่ค้างเกิน 15 นาที (รันอัตโนมัติทุก 5 นาที)</div>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="shrink-0 rounded-lg bg-[color:var(--color-warm-clay)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
          >
            {running ? "กำลังรัน…" : "รันเดี๋ยวนี้"}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-[color:var(--color-forest-deep)]">{msg}</p>}
      </div>

      <div className="rounded-xl border border-dashed border-[color:var(--color-forest-deep)]/12 p-4 text-sm text-[color:var(--color-ink)]/45">
        เตือนใกล้วันเข้าพัก / ขอรีวิวหลังเช็คเอาท์ — จะเพิ่มเมื่อระบบแจ้งเตือนพร้อม
      </div>
    </Panel>
  );
}
