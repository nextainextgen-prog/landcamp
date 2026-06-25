"use client";

import { useEffect, useState } from "react";

import { Panel } from "@/components/admin/ui";

export type KvField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox";
  hint?: string;
  placeholder?: string;
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
  const [unavailable, setUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/settings/kv/${settingKey}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        setValue({ ...defaults, ...(data.value ?? {}) });
      })
      .catch(() => setUnavailable(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey]);

  function set(name: string, v: unknown) {
    setValue((p) => ({ ...p, [name]: v }));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/settings/kv/${settingKey}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
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
