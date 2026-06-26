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

export function OtpSettingsForm() {
  const [unavailable, setUnavailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [senderName, setSenderName] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [otpLength, setOtpLength] = useState(6);
  const [otpTtlSeconds, setOtpTtlSeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiSecretSet, setApiSecretSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/otp")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        setProvider(data.provider ?? "");
        setSenderName(data.senderName ?? "");
        setApiBaseUrl(data.apiBaseUrl ?? "");
        setOtpLength(data.otpLength ?? 6);
        setOtpTtlSeconds(data.otpTtlSeconds ?? 300);
        setCooldownSeconds(data.cooldownSeconds ?? 60);
        setMaxAttempts(data.maxAttempts ?? 5);
        setEnabled(Boolean(data.enabled));
        setApiKeySet(Boolean(data.apiKeySet));
        setApiSecretSet(Boolean(data.apiSecretSet));
      })
      .catch(() => setUnavailable(true));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings/otp", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider,
        senderName,
        apiBaseUrl,
        otpLength,
        otpTtlSeconds,
        cooldownSeconds,
        maxAttempts,
        enabled,
        apiKey,
        apiSecret,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
      setSaving(false);
      return;
    }
    if (apiKey.trim()) setApiKeySet(true);
    if (apiSecret.trim()) setApiSecretSet(true);
    setApiKey("");
    setApiSecret("");
    setMsg({ kind: "ok", text: "บันทึกแล้ว" });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านค่าจากฐานข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>022_otp_settings</strong> แล้ว
        </div>
      )}

      <Panel title="ยืนยันตัวตนด้วย OTP (SMS)" bodyClassName="flex flex-col gap-5">
        <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
          เตรียมไว้สำหรับเชื่อมต่อในอนาคต — ปัจจุบันลูกค้าเข้าสู่ระบบด้วย LINE
          เท่านั้น เมื่อกรอกข้อมูลผู้ให้บริการ SMS ครบและเปิดใช้งาน
          ระบบจะพร้อมส่งรหัส OTP เพื่อยืนยันเบอร์โทรได้ทันทีโดยไม่ต้องแก้โค้ด
        </div>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-warm-clay)]"
          />
          <span className="text-sm text-[color:var(--color-ink)]">เปิดใช้งานการยืนยันด้วย OTP</span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>ผู้ให้บริการ (Provider)</Label>
            <input
              className={inputCls}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="thaibulksms / twilio / custom"
            />
          </label>
          <label className="grid gap-1.5">
            <Label>ชื่อผู้ส่ง (Sender)</Label>
            <input
              className={inputCls}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="LandCamp"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>API Key</Label>
            <input
              type="password"
              className={inputCls}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeySet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "API key"}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>API Secret</Label>
            <input
              type="password"
              className={inputCls}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={apiSecretSet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "API secret (ถ้ามี)"}
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <Label>API Base URL (สำหรับ provider แบบ custom)</Label>
          <input
            className={inputCls}
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="https://api.provider.com/v1"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <Label>จำนวนหลัก OTP</Label>
            <input
              type="number"
              min={4}
              max={8}
              className={inputCls}
              value={otpLength}
              onChange={(e) => setOtpLength(Number(e.target.value))}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>อายุรหัส (วินาที)</Label>
            <input
              type="number"
              min={30}
              max={3600}
              className={inputCls}
              value={otpTtlSeconds}
              onChange={(e) => setOtpTtlSeconds(Number(e.target.value))}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>เว้นช่วงส่งซ้ำ (วินาที)</Label>
            <input
              type="number"
              min={0}
              max={3600}
              className={inputCls}
              value={cooldownSeconds}
              onChange={(e) => setCooldownSeconds(Number(e.target.value))}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>กรอกผิดได้สูงสุด (ครั้ง)</Label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
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
          {msg && (
            <span className={msg.kind === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
              {msg.text}
            </span>
          )}
        </div>
      </Panel>
    </div>
  );
}
