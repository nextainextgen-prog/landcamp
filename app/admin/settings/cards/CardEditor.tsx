"use client";

import { useEffect, useRef, useState } from "react";

import { Panel } from "@/components/admin/ui";

export type CardConfig = {
  enabled: boolean;
  imageUrl: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
};

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

/** Sample values used only to render the live preview. */
const SAMPLE_VARS: Record<string, string> = {
  name: "คุณสมชาย ใจดี",
  booking_code: "LC-2026-0001",
  room: "วิลล่า 1 · Villa 1",
  check_in: "27 มิ.ย. 2569",
  check_out: "28 มิ.ย. 2569",
  total: "4,500",
  receipt_url: "#",
  map_url: "#",
};
const applyVars = (text: string) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => SAMPLE_VARS[k] ?? "");

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
      {children}
    </span>
  );
}

function Glyph({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function CardEditor({
  settingKey,
  title,
  defaults,
}: {
  settingKey: string;
  title: string;
  defaults: CardConfig;
}) {
  const [cfg, setCfg] = useState<CardConfig>(defaults);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Test-send state
  const [testId, setTestId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/settings/kv/${settingKey}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        setCfg({ ...defaults, ...(data.value ?? {}) });
      })
      .catch(() => setUnavailable(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey]);

  function set<K extends keyof CardConfig>(k: K, v: CardConfig[K]) {
    setCfg((p) => ({ ...p, [k]: v }));
    setMsg(null);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/content/media", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) set("imageUrl", data.url);
      else setMsg({ kind: "err", text: data.error ?? "อัปโหลดรูปไม่สำเร็จ" });
    } catch {
      setMsg({ kind: "err", text: "อัปโหลดรูปไม่สำเร็จ" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/settings/kv/${settingKey}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: cfg }),
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

  async function testSend() {
    if (!testId.trim() || testing) return;
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/settings/cards/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId: testId.trim(), config: cfg }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; sentTo?: string; error?: string };
      if (res.ok && data.ok) {
        setTestMsg({ kind: "ok", text: `ส่งทดสอบสำเร็จ → ${data.sentTo ?? "ลูกค้า"}` });
      } else {
        setTestMsg({ kind: "err", text: data.error ?? "ส่งทดสอบไม่สำเร็จ" });
      }
    } catch {
      setTestMsg({ kind: "err", text: "เครือข่ายขัดข้อง ลองอีกครั้ง" });
    }
    setTesting(false);
  }

  return (
    <Panel title={title} bodyClassName="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── left: form ── */}
      <div className="flex min-w-0 flex-col gap-5">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" />
          <span className="text-sm text-[color:var(--color-ink)]">เปิดใช้งานการ์ดนี้</span>
        </label>

        {/* Image */}
        <div className="grid gap-2">
          <Label>รูปหัวการ์ด (ไม่ใส่ก็ได้)</Label>
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-[color:var(--color-bone-soft)]">
              {cfg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-3 py-1.5 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50">
                {uploading ? "กำลังอัปโหลด…" : "อัปโหลดรูป"}
              </button>
              {cfg.imageUrl && (
                <button type="button" onClick={() => set("imageUrl", "")} className="text-xs text-red-600 hover:underline">ลบรูป</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          </div>
        </div>

        <label className="grid gap-1.5">
          <Label>หัวข้อ</Label>
          <input className={inputCls} value={cfg.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <Label>เนื้อหา</Label>
          <textarea rows={6} className={inputCls} value={cfg.body} onChange={(e) => set("body", e.target.value)} />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>ป้ายปุ่ม</Label>
            <input className={inputCls} value={cfg.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} placeholder="เช่น ดูใบจอง" />
          </label>
          <label className="grid gap-1.5">
            <Label>ลิงก์ปุ่ม</Label>
            <input className={inputCls} value={cfg.buttonUrl} onChange={(e) => set("buttonUrl", e.target.value)} placeholder="{{receipt_url}} หรือ {{map_url}}" />
          </label>
        </div>

        {unavailable && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            ยังบันทึกไม่ได้ — ตรวจว่ารัน migration <strong>016</strong> แล้ว
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50">
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          {msg && <span className={msg.kind === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>{msg.text}</span>}
        </div>
      </div>

      {/* ── right: live preview + test send ── */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
            ตัวอย่าง LINE CHAT
          </p>
          <LinePreview cfg={cfg} />
        </div>

        {/* Test send by booking UUID */}
        <div className="rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-[color:var(--color-bone-soft)]/40 p-4">
          <Label>ทดสอบส่งจริง</Label>
          <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-ink)]/55">
            กรอก UUID ของการจอง หรือ ลูกค้า เพื่อส่งการ์ดนี้ทาง LINE ก่อนใช้งาน —
            ถ้าเป็น UUID การจองจะใช้ค่าจริง ถ้าเป็นลูกค้า (ไม่มีการจอง) จะใช้ข้อมูลตัวอย่าง
          </p>
          <input
            className={`${inputCls} mt-2.5 font-mono text-xs`}
            value={testId}
            onChange={(e) => { setTestId(e.target.value); setTestMsg(null); }}
            placeholder="เช่น 1a2b3c4d-…"
          />
          <button
            type="button"
            onClick={testSend}
            disabled={testing || !testId.trim()}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-warm-clay)]/40 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--color-warm-clay)] transition-colors hover:bg-[color:var(--color-warm-clay)] hover:text-white disabled:opacity-50"
          >
            <Glyph d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" /> {testing ? "กำลังส่ง…" : "ส่งทดสอบ"}
          </button>
          {testMsg && (
            <p className={`mt-2 text-xs ${testMsg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{testMsg.text}</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** Phone-style LINE chat preview that renders the card with sample values. */
function LinePreview({ cfg }: { cfg: CardConfig }) {
  const title = applyVars(cfg.title).trim();
  const body = applyVars(cfg.body).trim();
  const buttonLabel = applyVars(cfg.buttonLabel).trim();

  return (
    <div className="overflow-hidden rounded-[20px] border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_14px_36px_-24px_rgba(45,55,40,0.4)]">
      {/* chat header */}
      <div className="flex items-center gap-2 border-b border-[color:var(--color-forest-deep)]/8 px-3 py-2.5">
        <Glyph d="M15 18l-6-6 6-6" className="h-4 w-4 text-[color:var(--color-ink)]/45" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)] text-[9px] font-bold text-[color:var(--color-bone)]">LC</span>
        <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">LandCamp</span>
        <span className="ml-auto flex items-center gap-2 text-[color:var(--color-ink)]/40">
          <Glyph d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" />
          <Glyph d="M4 6h16M4 12h16M4 18h16" />
        </span>
      </div>

      {/* chat body */}
      <div className="space-y-3 bg-[#9fb1d4] px-3 py-4">
        <div className="flex justify-center">
          <span className="rounded-full bg-black/15 px-3 py-0.5 text-[11px] font-medium text-white">วันนี้</span>
        </div>

        {!cfg.enabled && (
          <p className="text-center text-[11px] font-medium text-white/90">การ์ดนี้ปิดอยู่ — จะไม่ถูกส่ง</p>
        )}

        <div className="flex items-end gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)] text-[9px] font-bold text-[color:var(--color-bone)]">LC</span>
          <div className="min-w-0 max-w-[80%]">
            {/* flex bubble */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {cfg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.imageUrl} alt="" className="aspect-[20/13] w-full object-cover" />
              )}
              <div className="flex flex-col gap-1.5 p-3">
                {title && <p className="text-sm font-bold leading-snug text-[#2c3327]">{title}</p>}
                {body && <p className="whitespace-pre-line text-[12px] leading-relaxed text-[#555555]">{body}</p>}
                {buttonLabel && (
                  <div className="mt-1.5 rounded-lg bg-[#9a795b] px-3 py-2 text-center text-[12px] font-semibold text-white">
                    {buttonLabel}
                  </div>
                )}
              </div>
            </div>
            <span className="mt-1 block text-[10px] text-white/80">16:39</span>
          </div>
        </div>
      </div>
    </div>
  );
}
