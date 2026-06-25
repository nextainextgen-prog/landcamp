"use client";

import { useEffect, useState } from "react";

import { Panel } from "@/components/admin/ui";

type Loaded = {
  loginChannelId: string;
  oaBasicId: string;
  teamGroupId: string;
  addFriend: boolean;
  loginChannelSecretSet: boolean;
  messagingAccessTokenSet: boolean;
  messagingChannelSecretSet: boolean;
};

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
      {children}
    </span>
  );
}

export function LineSettingsForm() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [oaBasicId, setOaBasicId] = useState("");
  const [addFriend, setAddFriend] = useState(true);
  const [teamGroupId, setTeamGroupId] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [msgSecret, setMsgSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const callbackUrl = origin ? `${origin}/auth/line/callback` : "";
  const webhookUrl = origin ? `${origin}/api/line/webhook` : "";

  useEffect(() => {
    fetch("/api/admin/settings/line")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        const d = data as Loaded;
        setLoaded(d);
        setChannelId(d.loginChannelId);
        setOaBasicId(d.oaBasicId);
        setTeamGroupId(d.teamGroupId ?? "");
        setAddFriend(d.addFriend);
      })
      .catch(() => setUnavailable(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings/line", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginChannelId: channelId,
        oaBasicId,
        teamGroupId,
        addFriend,
        loginChannelSecret: secret,
        messagingAccessToken: token,
        messagingChannelSecret: msgSecret,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
      setSaving(false);
      return;
    }
    setSecret("");
    setToken("");
    setMsgSecret("");
    setLoaded((p) =>
      p
        ? {
            ...p,
            loginChannelId: channelId,
            oaBasicId,
            teamGroupId,
            addFriend,
            loginChannelSecretSet: p.loginChannelSecretSet || secret.trim().length > 0,
            messagingAccessTokenSet: p.messagingAccessTokenSet || token.trim().length > 0,
            messagingChannelSecretSet: p.messagingChannelSecretSet || msgSecret.trim().length > 0,
          }
        : p,
    );
    setMsg({ kind: "ok", text: "บันทึกแล้ว" });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านค่าจากฐานข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>013_line_auth</strong> ใน Supabase แล้ว
        </div>
      )}

      <Panel title="LINE Login + Official Account" bodyClassName="flex flex-col gap-5">
        <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
          นำค่าจาก <strong>LINE Developers Console</strong> มากรอก — Login channel กับ Messaging
          channel (OA) <strong>ต้องอยู่ provider เดียวกัน</strong> เพื่อให้ส่งข้อความหาลูกค้าได้ภายหลัง
          <br />
          ตั้ง Callback URL ในช่อง LINE Login เป็น:
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-[11px] text-[color:var(--color-forest-deep)]">
            {callbackUrl || "…"}
          </code>
        </div>

        <label className="grid gap-1.5">
          <Label>LINE Login — Channel ID</Label>
          <input className={inputCls} value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="เช่น 2001234567" />
        </label>

        <label className="grid gap-1.5">
          <Label>LINE Login — Channel Secret</Label>
          <input
            type="password"
            className={inputCls}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={loaded?.loginChannelSecretSet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "ยังไม่ได้ตั้งค่า"}
          />
        </label>

        <label className="grid gap-1.5">
          <Label>Messaging API (OA) — Channel Access Token</Label>
          <textarea
            rows={2}
            className={inputCls}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={loaded?.messagingAccessTokenSet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "ใช้ส่งการ์ดหาลูกค้า/แจ้งทีม"}
          />
        </label>

        <label className="grid gap-1.5">
          <Label>Messaging API (OA) — Channel Secret</Label>
          <input
            type="password"
            className={inputCls}
            value={msgSecret}
            onChange={(e) => setMsgSecret(e.target.value)}
            placeholder={loaded?.messagingChannelSecretSet ? "•••••••• (ตั้งค่าไว้แล้ว — กรอกเพื่อเปลี่ยน)" : "ใช้ตรวจสอบ webhook"}
          />
        </label>

        <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
          ตั้ง <strong>Webhook URL</strong> ในช่อง Messaging API เป็น (เพื่อรับ Group ID + เช็คอิน):
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-[11px] text-[color:var(--color-forest-deep)]">
            {webhookUrl || "…"}
          </code>
          แล้วเชิญ OA เข้ากลุ่มทีม + พิมพ์ข้อความในกลุ่ม → ดู Group ID ได้ที่หน้า <strong>บันทึกการใช้งาน (Audit Log)</strong>
        </div>

        <label className="grid gap-1.5">
          <Label>Group ID กลุ่มทีมงาน</Label>
          <input className={inputCls} value={teamGroupId} onChange={(e) => setTeamGroupId(e.target.value)} placeholder="C............................. (จาก Audit Log)" />
        </label>

        <label className="grid gap-1.5">
          <Label>OA Basic ID</Label>
          <input className={inputCls} value={oaBasicId} onChange={(e) => setOaBasicId(e.target.value)} placeholder="เช่น @landcamp" />
        </label>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={addFriend} onChange={(e) => setAddFriend(e.target.checked)} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" />
          <span className="text-sm text-[color:var(--color-ink)]">ให้ลูกค้าเพิ่มเพื่อน OA อัตโนมัติตอนเข้าสู่ระบบ (auto add-friend)</span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
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
