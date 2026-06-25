"use client";

import { useRef, useState } from "react";

import type { Bilingual, VideoClip } from "@/lib/content/types";

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

const EMPTY_BI: Bilingual = { th: "", en: "" };

/** Editor for guest video reels — upload .mp4, edit title/handle/tag, reorder. */
export function VideoManager({
  items,
  onChange,
}: {
  items: VideoClip[];
  onChange: (items: VideoClip[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<number | null>(null);

  function patch(i: number, next: Partial<VideoClip>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...next } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    const to = i + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  async function upload(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/content/media", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return null;
      }
      return data.url;
    } catch {
      setErr("อัปโหลดไม่สำเร็จ (เครือข่าย)");
      return null;
    }
  }

  async function onFile(file: File) {
    setUploading(true);
    setErr(null);
    const url = await upload(file);
    if (url) {
      const target = replaceRef.current;
      if (target !== null) {
        patch(target, { src: url });
      } else {
        onChange([...items, { src: url, title: { ...EMPTY_BI }, handle: "@landcamp_khaoyai", tag: { ...EMPTY_BI } }]);
      }
    }
    replaceRef.current = null;
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            replaceRef.current = null;
            fileRef.current?.click();
          }}
          disabled={uploading}
          className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
        >
          {uploading ? "กำลังอัปโหลด…" : "+ เพิ่มคลิป"}
        </button>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <span className="text-xs text-[color:var(--color-ink)]/45">{items.length} คลิป · ไฟล์วิดีโอไม่เกิน 50MB</span>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <ul className="flex flex-col gap-3">
        {items.map((clip, i) => (
          <li key={`${clip.src}-${i}`} className="flex gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white p-3">
            <div className="flex w-28 flex-shrink-0 flex-col gap-1.5">
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
                <video src={clip.src} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => {
                  replaceRef.current = i;
                  fileRef.current?.click();
                }}
                disabled={uploading}
                className="rounded border border-[color:var(--color-forest-deep)]/20 px-1.5 py-1 text-[11px] text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50"
              >
                เปลี่ยนคลิป
              </button>
            </div>
            <div className="grid min-w-0 flex-1 content-start gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={clip.title.th} onChange={(e) => patch(i, { title: { ...clip.title, th: e.target.value } })} placeholder="ชื่อ (ไทย)" className={inputCls} />
                <input value={clip.title.en} onChange={(e) => patch(i, { title: { ...clip.title, en: e.target.value } })} placeholder="ชื่อ (อังกฤษ)" className={inputCls} />
                <input value={clip.tag.th} onChange={(e) => patch(i, { tag: { ...clip.tag, th: e.target.value } })} placeholder="ป้าย (ไทย)" className={inputCls} />
                <input value={clip.tag.en} onChange={(e) => patch(i, { tag: { ...clip.tag, en: e.target.value } })} placeholder="ป้าย (อังกฤษ)" className={inputCls} />
              </div>
              <input value={clip.handle} onChange={(e) => patch(i, { handle: e.target.value })} placeholder="@handle" className={inputCls} />
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="ขึ้น" className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="ลง" className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">▼</button>
                <button type="button" onClick={() => remove(i)} className="ml-auto rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ลบ</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
