"use client";

import { useState } from "react";

import { ActionButton } from "@/components/admin/ActionButton";
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

export function SecurityForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setMsg(null);
    if (next !== confirm) {
      setMsg({ kind: "err", text: "รหัสใหม่กับยืนยันไม่ตรงกัน" });
      throw new Error("รหัสใหม่กับยืนยันไม่ตรงกัน");
    }
    const res = await fetch("/api/admin/security/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const text = data.error ?? "เปลี่ยนรหัสไม่สำเร็จ";
      setMsg({ kind: "err", text });
      throw new Error(text);
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg({ kind: "ok", text: "เปลี่ยนรหัสผ่านแล้ว" });
  }

  return (
    <Panel title="เปลี่ยนรหัสผ่าน" bodyClassName="flex max-w-md flex-col gap-5">
      <label className="grid gap-1.5">
        <Label>รหัสผ่านปัจจุบัน</Label>
        <input type="password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="grid gap-1.5">
        <Label>รหัสผ่านใหม่</Label>
        <input type="password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      <label className="grid gap-1.5">
        <Label>ยืนยันรหัสผ่านใหม่</Label>
        <input type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <div className="flex items-center gap-3">
        <ActionButton
          onClick={save}
          variant="primary"
          pendingLabel="กำลังบันทึก…"
          doneLabel="เปลี่ยนแล้ว"
          disabled={!current || !next}
        >
          เปลี่ยนรหัสผ่าน
        </ActionButton>
        {msg && <span className={msg.kind === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>{msg.text}</span>}
      </div>
      <p className="text-xs text-[color:var(--color-ink)]/45">2FA และการจำกัด IP จะเพิ่มในเวอร์ชันถัดไป</p>
    </Panel>
  );
}
