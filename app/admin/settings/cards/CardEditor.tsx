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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
      {children}
    </span>
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

  return (
    <Panel title={title} bodyClassName="flex flex-col gap-5">
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
    </Panel>
  );
}
