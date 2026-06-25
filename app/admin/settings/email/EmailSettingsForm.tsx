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

export function EmailSettingsForm() {
  const [unavailable, setUnavailable] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/email")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        setFromEmail(data.fromEmail ?? "");
        setFromName(data.fromName ?? "");
        setReplyTo(data.replyTo ?? "");
        setEnabled(Boolean(data.enabled));
        setApiKeySet(Boolean(data.apiKeySet));
      })
      .catch(() => setUnavailable(true));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings/email", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromEmail, fromName, replyTo, enabled, resendApiKey: apiKey }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
      setSaving(false);
      return;
    }
    if (apiKey.trim()) setApiKeySet(true);
    setApiKey("");
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

      <Panel title="อีเมล (Resend)" bodyClassName="flex flex-col gap-5">
        <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
          ใช้ส่งอีเมลยืนยันการจอง/ใบเสร็จ — สมัคร <strong>Resend</strong>, ยืนยันโดเมน, แล้วนำ API key มากรอก
        </div>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" />
          <span className="text-sm text-[color:var(--color-ink)]">เปิดใช้งานการส่งอีเมล</span>
        </label>

        <label className="grid gap-1.5">
          <Label>Resend API Key</Label>
          <input
            type="password"
            className={inputCls}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={apiKeySet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "re_..."}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>อีเมลผู้ส่ง (From)</Label>
            <input className={inputCls} value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="booking@landcampkhaoyai.com" />
          </label>
          <label className="grid gap-1.5">
            <Label>ชื่อผู้ส่ง</Label>
            <input className={inputCls} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="LandCamp Villa" />
          </label>
          <label className="grid gap-1.5">
            <Label>อีเมลตอบกลับ (Reply-To)</Label>
            <input className={inputCls} value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="hello@landcampkhaoyai.com" />
          </label>
        </div>

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
