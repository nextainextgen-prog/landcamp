"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Panel } from "@/components/admin/ui";
import { GalleryManager } from "./GalleryManager";
import { StoryManager } from "./StoryManager";
import type { Bilingual, SiteContent } from "@/lib/content/types";

type Version = {
  id: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
};

/* ── immutable path setter ── */
function setPath<T>(obj: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const clone: Record<string | number, unknown> = Array.isArray(obj)
    ? ([...(obj as unknown[])] as unknown as Record<string | number, unknown>)
    : { ...(obj as Record<string, unknown>) };
  clone[head] = setPath(clone[head], rest, value);
  return clone as unknown as T;
}

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

const TABS = [
  { key: "about", label: "เกี่ยวกับเรา" },
  { key: "contactSection", label: "ส่วนติดต่อ" },
  { key: "contact", label: "ข้อมูลติดต่อ" },
  { key: "footer", label: "ส่วนท้าย" },
  { key: "gallery", label: "รูปภาพ (แกลเลอรี)" },
  { key: "versions", label: "ประวัติเวอร์ชัน" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Which part of the live preview to scroll to / highlight when a tab is opened.
const TAB_ANCHOR: Partial<Record<TabKey, string>> = {
  about: "#about",
  contactSection: "#contact",
  contact: "#contact",
  footer: "footer",
  gallery: "#atmosphere",
};

/* ── reusable fields ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
      {children}
    </span>
  );
}

function BiField({
  label,
  value,
  long = false,
  onChange,
}: {
  label: string;
  value: Bilingual;
  long?: boolean;
  onChange: (v: Bilingual) => void;
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[11px] text-[color:var(--color-ink)]/45">ไทย</span>
          {long ? (
            <textarea
              rows={3}
              className={inputCls}
              value={value.th}
              onChange={(e) => onChange({ ...value, th: e.target.value })}
            />
          ) : (
            <input
              className={inputCls}
              value={value.th}
              onChange={(e) => onChange({ ...value, th: e.target.value })}
            />
          )}
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] text-[color:var(--color-ink)]/45">English</span>
          {long ? (
            <textarea
              rows={3}
              className={inputCls}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          ) : (
            <input
              className={inputCls}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          )}
        </label>
      </div>
    </div>
  );
}

function StrField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="text-[11px] text-[color:var(--color-ink)]/40">{hint}</span>}
    </label>
  );
}

const EMPTY_BI: Bilingual = { th: "", en: "" };

export function ContentEditor({
  initialDoc,
  tableMissing,
  initiallyUnpublished,
}: {
  initialDoc: SiteContent;
  tableMissing: boolean;
  initiallyUnpublished: boolean;
}) {
  const [doc, setDoc] = useState<SiteContent>(initialDoc);
  const [tab, setTab] = useState<TabKey>("about");
  const [dirty, setDirty] = useState(false);
  const [unpublished, setUnpublished] = useState(initiallyUnpublished);
  const [busy, setBusy] = useState<null | "save" | "publish">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reloadPreview = useCallback(() => setPreviewKey((k) => k + 1), []);

  const selectTab = useCallback((key: TabKey) => {
    setTab(key);
    const selector = TAB_ANCHOR[key];
    if (selector) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "lc-scroll", selector },
        window.location.origin,
      );
    }
  }, []);

  const update = useCallback((path: (string | number)[], value: unknown) => {
    setDoc((d) => setPath(d, path, value));
    setDirty(true);
    setMsg(null);
  }, []);

  async function saveDraft(): Promise<boolean> {
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draft: doc }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "บันทึกไม่สำเร็จ" });
      return false;
    }
    return true;
  }

  async function handleSave() {
    setBusy("save");
    setMsg(null);
    const ok = await saveDraft();
    if (ok) {
      setDirty(false);
      setUnpublished(true);
      reloadPreview();
      setMsg({ kind: "ok", text: "บันทึกร่างแล้ว — ตัวอย่างทางซ้ายอัปเดตแล้ว กดเผยแพร่เมื่อพร้อม" });
    }
    setBusy(null);
  }

  async function handlePublish() {
    setBusy("publish");
    setMsg(null);
    // Always save the latest edits first so we publish exactly what's on screen.
    if (!(await saveDraft())) {
      setBusy(null);
      return;
    }
    setDirty(false);
    const res = await fetch("/api/admin/content/publish", { method: "POST" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg({ kind: "err", text: data.error ?? "เผยแพร่ไม่สำเร็จ" });
      setBusy(null);
      return;
    }
    setUnpublished(false);
    reloadPreview();
    setMsg({ kind: "ok", text: "เผยแพร่แล้ว — เว็บจริงอัปเดตทันที (รีเฟรชหน้าเว็บเพื่อดู)" });
    setBusy(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,500px)]">
      {/* ── Live preview of the landing page (draft) ── */}
      <div className="order-2 xl:order-1">
        <div className="sticky top-4 overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/12 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-3 py-2">
            <span className="text-xs font-semibold text-[color:var(--color-forest-deep)]">
              ตัวอย่างสด (ร่าง) — คลิกหัวข้อทางขวาเพื่อเลื่อนไปจุดนั้น
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={reloadPreview}
                className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
              >
                รีเฟรช
              </button>
              <a
                href="/content-preview"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
              >
                เต็มจอ ↗
              </a>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            key={previewKey}
            src={`/content-preview?v=${previewKey}`}
            title="ตัวอย่างหน้าเว็บ"
            className="h-[78vh] w-full bg-white"
          />
        </div>
      </div>

      {/* ── Editing controls ── */}
      <div className="order-1 flex flex-col gap-5 xl:order-2">
      {tableMissing && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังไม่ได้รัน migration <strong>011_site_content</strong> ใน Supabase — แก้ไขในหน้านี้ได้
          แต่ <strong>บันทึก/เผยแพร่จะไม่สำเร็จ</strong> จนกว่าจะรัน migration ก่อน
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          {unpublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              ● มีร่างที่ยังไม่เผยแพร่
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              ● เผยแพร่ล่าสุดแล้ว
            </span>
          )}
          {dirty && (
            <span className="text-xs text-[color:var(--color-ink)]/45">มีการแก้ไขที่ยังไม่บันทึก</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
          >
            เปิดดูเว็บจริง ↗
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy !== null}
            className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50"
          >
            {busy === "save" ? "กำลังบันทึก…" : "บันทึกร่าง"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={busy !== null}
            className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
          >
            {busy === "publish" ? "กำลังเผยแพร่…" : "เผยแพร่"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={
            msg.kind === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className={
              tab === t.key
                ? "rounded-full bg-[color:var(--color-forest-deep)] px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-[color:var(--color-forest-deep)]/15 px-4 py-1.5 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === "about" && (
        <Panel title="ส่วน “เกี่ยวกับเรา”" bodyClassName="flex flex-col gap-6">
          <BiField label="หัวข้อย่อย (eyebrow)" value={doc.about.eyebrow} onChange={(v) => update(["about", "eyebrow"], v)} />
          <BiField label="คำอธิบาย" long value={doc.about.description} onChange={(v) => update(["about", "description"], v)} />

          <div className="grid gap-4">
            <FieldLabel>ตัวเลขสถิติ (ไอคอนกำหนดไว้ในโค้ด)</FieldLabel>
            {doc.about.stats.map((stat, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 p-4 sm:grid-cols-[120px_120px_1fr]">
                <label className="grid gap-1.5">
                  <FieldLabel>ค่าตัวเลข</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    className={inputCls}
                    value={stat.value}
                    onChange={(e) => update(["about", "stats", i, "value"], Number(e.target.value))}
                  />
                </label>
                <label className="grid gap-1.5">
                  <FieldLabel>หน่วย (ไทย)</FieldLabel>
                  <input
                    className={inputCls}
                    value={stat.unit?.th ?? ""}
                    onChange={(e) => update(["about", "stats", i, "unit"], { ...(stat.unit ?? EMPTY_BI), th: e.target.value })}
                  />
                </label>
                <BiField
                  label="ป้ายกำกับ"
                  value={stat.label}
                  onChange={(v) => update(["about", "stats", i, "label"], v)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <FieldLabel>จุดเด่น (perks)</FieldLabel>
            {doc.about.perks.map((perk, i) => (
              <BiField
                key={i}
                label={`จุดเด่นที่ ${i + 1}`}
                value={perk.label}
                onChange={(v) => update(["about", "perks", i, "label"], v)}
              />
            ))}
          </div>

          <div className="grid gap-3">
            <FieldLabel>เรื่องราวของเรา (สไลด์ภาพ)</FieldLabel>
            <StoryManager items={doc.about.story} onChange={(items) => update(["about", "story"], items)} />
          </div>
        </Panel>
      )}

      {tab === "contactSection" && (
        <Panel title="ส่วนติดต่อ (ท้ายหน้าเว็บ)" bodyClassName="flex flex-col gap-6">
          <BiField label="หัวข้อย่อย (eyebrow)" value={doc.contactSection.eyebrow} onChange={(v) => update(["contactSection", "eyebrow"], v)} />
          <BiField label="หัวข้อใหญ่" value={doc.contactSection.heading} onChange={(v) => update(["contactSection", "heading"], v)} />
          <BiField label="ข้อความนำ" long value={doc.contactSection.lead} onChange={(v) => update(["contactSection", "lead"], v)} />
        </Panel>
      )}

      {tab === "contact" && (
        <Panel title="ข้อมูลติดต่อ (ใช้ทั้งเว็บ)" bodyClassName="grid gap-5 sm:grid-cols-2">
          <StrField label="เบอร์โทร (แสดง)" value={doc.contact.phone} onChange={(v) => update(["contact", "phone"], v)} />
          <StrField label="เบอร์โทรสำรอง" value={doc.contact.phoneAlt} onChange={(v) => update(["contact", "phoneAlt"], v)} />
          <StrField label="เบอร์โทรแบบสากล" hint="เช่น +66985021695 (ใช้กับปุ่มโทร)" value={doc.contact.phoneE164} onChange={(v) => update(["contact", "phoneE164"], v)} />
          <StrField label="Line ID" hint="เช่น @landcamp" value={doc.contact.line} onChange={(v) => update(["contact", "line"], v)} />
          <StrField label="ลิงก์ Line" hint="ใช้สร้าง QR ด้วย" value={doc.contact.lineUrl} onChange={(v) => update(["contact", "lineUrl"], v)} />
          <StrField label="อีเมล" value={doc.contact.email} onChange={(v) => update(["contact", "email"], v)} />
          <StrField label="Facebook URL" value={doc.contact.facebook} onChange={(v) => update(["contact", "facebook"], v)} />
          <StrField label="Instagram URL" value={doc.contact.instagram} onChange={(v) => update(["contact", "instagram"], v)} />
          <StrField label="Google Maps URL" value={doc.contact.googleMaps} onChange={(v) => update(["contact", "googleMaps"], v)} />
        </Panel>
      )}

      {tab === "footer" && (
        <Panel title="ส่วนท้ายเว็บ (Footer)" bodyClassName="flex flex-col gap-6">
          <BiField label="คำอธิบายแบรนด์" long value={doc.footer.brandDescription} onChange={(v) => update(["footer", "brandDescription"], v)} />
          <BiField label="ข้อความลิขสิทธิ์ท้ายเว็บ" value={doc.footer.copyrightTagline} onChange={(v) => update(["footer", "copyrightTagline"], v)} />
        </Panel>
      )}

      {tab === "gallery" && (
        <Panel title="รูปภาพแกลเลอรี (หน้าแรก)" bodyClassName="flex flex-col gap-4">
          <GalleryManager items={doc.gallery} onChange={(items) => update(["gallery"], items)} />
        </Panel>
      )}

      {tab === "versions" && <VersionsPanel />}

      <p className="text-xs text-[color:var(--color-ink)]/45">
        ส่วน Hero และข้อมูลแบรนด์อื่น ๆ จะเปิดให้แก้ในหน้านี้หลังจากหน้าแรกถูกปรับปรุงเสร็จ
      </p>
      </div>
    </div>
  );
}

function VersionsPanel() {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content/versions")
      .then((r) => r.json())
      .then((d: { versions?: Version[] }) => {
        if (active) setVersions(d.versions ?? []);
      })
      .catch(() => {
        if (active) setVersions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  async function restore(id: string) {
    if (!window.confirm("ย้อนกลับไปใช้เนื้อหาเวอร์ชันนี้? เนื้อหาปัจจุบันจะถูกแทนที่ทันที")) return;
    setRestoring(id);
    setErr(null);
    const res = await fetch(`/api/admin/content/versions/${id}/restore`, { method: "POST" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? "ย้อนเวอร์ชันไม่สำเร็จ");
      setRestoring(null);
      return;
    }
    // Reload so the editor re-reads the restored draft from the server.
    window.location.reload();
  }

  return (
    <Panel title="ประวัติการเผยแพร่" bodyClassName="flex flex-col gap-3">
      <p className="text-xs text-[color:var(--color-ink)]/50">
        ทุกครั้งที่กดเผยแพร่จะถูกบันทึกไว้ที่นี่ — กดย้อนกลับเพื่อใช้เนื้อหาเวอร์ชันก่อนหน้า
      </p>
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}
      {versions === null ? (
        <p className="text-sm text-[color:var(--color-ink)]/45">กำลังโหลด…</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-[color:var(--color-ink)]/45">ยังไม่มีประวัติ — เผยแพร่ครั้งแรกเพื่อเริ่มเก็บประวัติ</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--color-forest-deep)]/8">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[color:var(--color-forest-deep)]">
                  {new Date(v.created_at).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
                <div className="text-xs text-[color:var(--color-ink)]/45">
                  โดย {v.created_by ?? "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => restore(v.id)}
                disabled={restoring !== null}
                className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-3 py-1.5 text-sm font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50"
              >
                {restoring === v.id ? "กำลังย้อน…" : "ย้อนกลับ"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
