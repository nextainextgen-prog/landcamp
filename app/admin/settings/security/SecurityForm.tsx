"use client";

import { useState } from "react";

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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setMsg(null);
    if (next !== confirm) {
      setMsg({ kind: "err", text: "รหัสใหม่กับยืนยันไม่ตรงกัน" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/security/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "เปลี่ยนรหัสไม่สำเร็จ" });
      setSaving(false);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg({ kind: "ok", text: "เปลี่ยนรหัสผ่านแล้ว" });
    setSaving(false);
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
        <button
          type="button"
          onClick={save}
          disabled={saving || !current || !next}
          className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
        </button>
        {msg && <span className={msg.kind === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>{msg.text}</span>}
      </div>
      <p className="text-xs text-[color:var(--color-ink)]/45">2FA และการจำกัด IP จะเพิ่มในเวอร์ชันถัดไป</p>
    </Panel>
  );
}
