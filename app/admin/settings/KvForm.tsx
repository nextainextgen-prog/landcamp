"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/admin/ui";
import { useSettingsToast } from "./useSettingsToast";

export type KvField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "switch" | "image";
  hint?: string;
  placeholder?: string;
  /** image type: POST endpoint that accepts `file` and returns `{ url }`. */
  upload?: string;
  /** image type: preview aspect-ratio, e.g. "16/9" (default). */
  aspect?: string;
};

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

/** Generic settings form backed by /api/admin/settings/kv/[key]. */
export function KvForm({
  settingKey,
  title,
  fields,
  defaults,
  note,
}: {
  settingKey: string;
  title: string;
  fields: KvField[];
  defaults: Record<string, unknown>;
  note?: string;
}) {
  const [value, setValue] = useState<Record<string, unknown>>(defaults);
  // Last value loaded from / saved to the server — the baseline for "คืนค่า".
  const [saved, setSaved] = useState<Record<string, unknown>>(defaults);
  const [unavailable, setUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { show, toastNode } = useSettingsToast();

  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(saved), [value, saved]);

  useEffect(() => {
    fetch(`/api/admin/settings/kv/${settingKey}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        const next = { ...defaults, ...(data.value ?? {}) };
        setValue(next);
        setSaved(next);
      })
      .catch(() => setUnavailable(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey]);

  function set(name: string, v: unknown) {
    setValue((p) => ({ ...p, [name]: v }));
  }

  async function uploadImage(f: KvField, file: File) {
    if (!f.upload) return;
    setUploading(f.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(f.upload, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        show("err", data.error ?? "อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      set(f.name, data.url);
    } catch {
      show("err", "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(null);
    }
  }

  function reset() {
    setValue(saved);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/settings/kv/${settingKey}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      show("err", data.error ?? "บันทึกไม่สำเร็จ");
      setSaving(false);
      return;
    }
    setSaved(value);
    show("ok", "บันทึกแล้ว");
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านค่าจากฐานข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>016_settings_kv_audit</strong> แล้ว
        </div>
      )}

      <Panel title={title} bodyClassName="flex flex-col gap-5">
        {note && (
          <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
            {note}
          </div>
        )}

        {fields.map((f) => {
          if (f.type === "checkbox") {
            return (
              <label key={f.name} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(value[f.name])}
                  onChange={(e) => set(f.name, e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-warm-clay)]"
                />
                <span className="text-sm text-[color:var(--color-ink)]">{f.label}</span>
              </label>
            );
          }
          if (f.type === "switch") {
            const on = Boolean(value[f.name]);
            return (
              <div key={f.name} className="flex items-center justify-between gap-4">
                <span className="text-sm text-[color:var(--color-ink)]">{f.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => set(f.name, !on)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    on
                      ? "bg-[color:var(--color-warm-clay)]"
                      : "bg-[color:var(--color-forest-deep)]/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      on ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          }
          if (f.type === "image") {
            const url = String(value[f.name] ?? "");
            const busy = uploading === f.name;
            return (
              <div key={f.name} className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
                  {f.label}
                </span>
                {url ? (
                  <div
                    className="relative w-full max-w-[280px] overflow-hidden rounded-lg border border-[color:var(--color-forest-deep)]/15"
                    style={{ aspectRatio: f.aspect ?? "16/9" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="ตัวอย่างรูปประกาศ" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set(f.name, "")}
                      className="absolute right-2 top-2 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/75"
                    >
                      ลบรูป
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex w-full max-w-[280px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[color:var(--color-forest-deep)]/25 bg-[color:var(--color-bone-soft)]/30 text-sm text-[color:var(--color-ink)]/60 transition-colors hover:border-[color:var(--color-warm-clay)]"
                    style={{ aspectRatio: f.aspect ?? "16/9" }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(f, file);
                        e.target.value = "";
                      }}
                    />
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-[color:var(--color-forest-deep)]/40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    {busy ? "กำลังอัปโหลด…" : "คลิกเพื่ออัปโหลดรูป"}
                  </label>
                )}
                {f.hint && <span className="text-[11px] text-[color:var(--color-ink)]/40">{f.hint}</span>}
              </div>
            );
          }
          return (
            <label key={f.name} className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
                {f.label}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  rows={4}
                  className={inputCls}
                  value={String(value[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  className={inputCls}
                  value={String(value[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                />
              )}
              {f.hint && <span className="text-[11px] text-[color:var(--color-ink)]/40">{f.hint}</span>}
            </label>
          );
        })}

        <div className="flex items-center gap-2.5 border-t border-[color:var(--color-forest-deep)]/8 pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={saving || !dirty}
            className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-4 py-2 text-sm font-medium text-[color:var(--color-ink)]/70 transition-colors hover:bg-[color:var(--color-bone-soft)]/60 disabled:opacity-40"
          >
            คืนค่า
          </button>
          {dirty && <span className="text-xs text-[color:var(--color-ink)]/40">มีการแก้ไขที่ยังไม่บันทึก</span>}
        </div>
      </Panel>
      {toastNode}
    </div>
  );
}
