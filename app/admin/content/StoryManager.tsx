"use client";

import { useRef, useState } from "react";

import type { Bilingual, StorySlide } from "@/lib/content/types";

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

const EMPTY_BI: Bilingual = { th: "", en: "" };

/** Editor for the About "story" slides — image + bilingual title/subtitle. */
export function StoryManager({
  items,
  onChange,
}: {
  items: StorySlide[];
  onChange: (items: StorySlide[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function patch(i: number, next: Partial<StorySlide>) {
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

  async function addImage(file: File) {
    setUploading(true);
    setErr(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/content/media", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
      } else {
        onChange([
          ...items,
          { src: data.url, alt: file.name.replace(/\.[^.]+$/, ""), title: { ...EMPTY_BI }, subtitle: { ...EMPTY_BI } },
        ]);
      }
    } catch {
      setErr("อัปโหลดไม่สำเร็จ (เครือข่าย)");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
        >
          {uploading ? "กำลังอัปโหลด…" : "+ เพิ่มสไลด์"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])}
        />
        <span className="text-xs text-[color:var(--color-ink)]/45">{items.length} สไลด์</span>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <ul className="flex flex-col gap-3">
        {items.map((slide, i) => (
          <li
            key={`${slide.src}-${i}`}
            className="flex gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white p-3"
          >
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[color:var(--color-bone-soft)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.src} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="grid min-w-0 flex-1 gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={slide.title.th} onChange={(e) => patch(i, { title: { ...slide.title, th: e.target.value } })} placeholder="หัวข้อ (ไทย)" className={inputCls} />
                <input value={slide.title.en} onChange={(e) => patch(i, { title: { ...slide.title, en: e.target.value } })} placeholder="หัวข้อ (อังกฤษ)" className={inputCls} />
                <input value={slide.subtitle.th} onChange={(e) => patch(i, { subtitle: { ...slide.subtitle, th: e.target.value } })} placeholder="คำบรรยาย (ไทย)" className={inputCls} />
                <input value={slide.subtitle.en} onChange={(e) => patch(i, { subtitle: { ...slide.subtitle, en: e.target.value } })} placeholder="คำบรรยาย (อังกฤษ)" className={inputCls} />
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น" className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="เลื่อนลง" className="rounded px-2 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">▼</button>
                <button type="button" onClick={() => remove(i)} className="ml-auto rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ลบ</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
