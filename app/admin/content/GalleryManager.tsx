"use client";

import { useRef, useState } from "react";

import type { GalleryImage } from "@/lib/content/types";

/**
 * Gallery image manager — upload, drag-to-reorder (with up/down fallback),
 * remove, and edit alt text. Reports the full ordered list up via onChange so
 * it saves as part of the CMS draft/publish flow.
 */
export function GalleryManager({
  items,
  onChange,
}: {
  items: GalleryImage[];
  onChange: (items: GalleryImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function setAlt(i: number, alt: string) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, alt } : it)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    const added: GalleryImage[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/admin/content/media", { method: "POST", body: form });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setErr(data.error ?? "อัปโหลดบางรูปไม่สำเร็จ");
          continue;
        }
        added.push({ src: data.url, alt: file.name.replace(/\.[^.]+$/, "") });
      } catch {
        setErr("อัปโหลดไม่สำเร็จ (เครือข่าย)");
      }
    }
    if (added.length) onChange([...items, ...added]);
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
          {uploading ? "กำลังอัปโหลด…" : "+ เพิ่มรูป"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-xs text-[color:var(--color-ink)]/45">
          {items.length} รูป · ลากเพื่อสลับลำดับ (หรือใช้ปุ่มลูกศร)
        </span>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[color:var(--color-forest-deep)]/20 p-6 text-center text-sm text-[color:var(--color-ink)]/45">
          ยังไม่มีรูป — กด “เพิ่มรูป” เพื่ออัปโหลด
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={`${item.src}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white ${
                dragIndex === i
                  ? "border-[color:var(--color-warm-clay)] opacity-60"
                  : "border-[color:var(--color-forest-deep)]/10"
              }`}
            >
              <div className="relative aspect-[4/3] cursor-grab bg-[color:var(--color-bone-soft)] active:cursor-grabbing">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="ลบรูป"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="เลื่อนซ้าย"
                  className="rounded px-1.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30"
                >
                  ◀
                </button>
                <input
                  value={item.alt}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder="คำอธิบายรูป"
                  className="min-w-0 flex-1 rounded border border-transparent bg-[color:var(--color-bone-soft)]/50 px-2 py-1 text-xs text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-warm-clay)]"
                />
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === items.length - 1}
                  aria-label="เลื่อนขวา"
                  className="rounded px-1.5 py-1 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30"
                >
                  ▶
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
