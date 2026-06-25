"use client";

import { useRef, useState } from "react";

type Bi = { th: string; en: string };
type RoomImage = { src: string; alt: Bi };
type RoomDetails = {
  startingPrice?: number;
  bedSize?: Bi;
  roomSize?: Bi;
  layout?: Bi;
  breakfast?: Bi;
  extraBed?: Bi;
  services?: Bi[];
  checkIn?: string;
  checkOut?: string;
  badge?: Bi;
};

export type AdminRoom = {
  id: string;
  slug: string;
  room_type: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  price_weekday: number;
  price_weekend: number;
  max_guests: number;
  is_available: boolean;
  display_order: number;
  amenities?: unknown;
  images?: unknown;
  details?: unknown;
};

const ROOM_TYPES = [
  { key: "villa-1bed", label: "วิลล่า 1 ห้องนอน" },
  { key: "villa-2bed", label: "วิลล่า 2 ห้องนอน" },
  { key: "train", label: "บ้านรถไฟ" },
  { key: "camper", label: "รถบ้าน" },
];
const TYPE_LABEL = Object.fromEntries(ROOM_TYPES.map((t) => [t.key, t.label]));

const EMPTY_BI: Bi = { th: "", en: "" };
const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

function asBi(v: unknown): Bi {
  if (v && typeof v === "object" && "th" in v) return { th: String((v as Bi).th ?? ""), en: String((v as Bi).en ?? "") };
  return { ...EMPTY_BI };
}
function asBiList(v: unknown): Bi[] {
  return Array.isArray(v) ? v.map(asBi) : [];
}
function asImages(v: unknown): RoomImage[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x === "object" && typeof (x as { src?: unknown }).src === "string")
    .map((x) => ({ src: (x as RoomImage).src, alt: asBi((x as RoomImage).alt) }));
}

/* ── draft model ── */
type Draft = {
  slug: string;
  room_type: string;
  name: Bi;
  description: Bi;
  price_weekday: string;
  price_weekend: string;
  max_guests: string;
  display_order: string;
  is_available: boolean;
  images: RoomImage[];
  amenities: Bi[];
  details: RoomDetails;
};

function toDraft(r?: AdminRoom): Draft {
  const d = (r?.details && typeof r.details === "object" ? r.details : {}) as RoomDetails;
  return {
    slug: r?.slug ?? "",
    room_type: r?.room_type ?? "villa-1bed",
    name: { th: r?.name_th ?? "", en: r?.name_en ?? "" },
    description: { th: r?.description_th ?? "", en: r?.description_en ?? "" },
    price_weekday: String(r?.price_weekday ?? ""),
    price_weekend: String(r?.price_weekend ?? ""),
    max_guests: String(r?.max_guests ?? ""),
    display_order: String(r?.display_order ?? 0),
    is_available: r?.is_available ?? true,
    images: asImages(r?.images),
    amenities: asBiList(r?.amenities),
    details: {
      startingPrice: typeof d.startingPrice === "number" ? d.startingPrice : undefined,
      bedSize: asBi(d.bedSize),
      roomSize: asBi(d.roomSize),
      layout: asBi(d.layout),
      breakfast: asBi(d.breakfast),
      extraBed: asBi(d.extraBed),
      services: asBiList(d.services),
      checkIn: d.checkIn ?? "14:00",
      checkOut: d.checkOut ?? "12:00",
      badge: asBi(d.badge),
    },
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">{children}</span>;
}
function BiField({ label, value, onChange }: { label: string; value: Bi; onChange: (v: Bi) => void }) {
  return (
    <div className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={value.th} placeholder="ไทย" onChange={(e) => onChange({ ...value, th: e.target.value })} />
        <input className={inputCls} value={value.en} placeholder="English" onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </div>
    </div>
  );
}

function BiListEditor({ label, items, onChange }: { label: string; items: Bi[]; onChange: (v: Bi[]) => void }) {
  return (
    <div className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input className={inputCls} value={it.th} placeholder="ไทย" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, th: e.target.value } : x)))} />
          <input className={inputCls} value={it.en} placeholder="English" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ลบ</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { ...EMPTY_BI }])} className="self-start rounded-lg border border-[color:var(--color-forest-deep)]/20 px-3 py-1.5 text-xs font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">+ เพิ่ม</button>
    </div>
  );
}

function ImagesEditor({ images, onChange }: { images: RoomImage[]; onChange: (v: RoomImage[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErr(null);
    const added: RoomImage[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/admin/rooms/media", { method: "POST", body: form });
        const data = (await res.json()) as { url?: string; error?: string };
        if (res.ok && data.url) added.push({ src: data.url, alt: { ...EMPTY_BI } });
        else setErr(data.error ?? "อัปโหลดบางรูปไม่สำเร็จ");
      } catch {
        setErr("อัปโหลดไม่สำเร็จ (เครือข่าย)");
      }
    }
    if (added.length) onChange([...images, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  function move(i: number, dir: -1 | 1) {
    const to = i + dir;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <FieldLabel>รูปห้อง (แสดงบนเว็บ)</FieldLabel>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg bg-[color:var(--color-warm-clay)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50">
          {uploading ? "กำลังอัปโหลด…" : "+ เพิ่มรูป"}
        </button>
        <span className="text-xs text-[color:var(--color-ink)]/45">{images.length} รูป · รูปแรก = ปก</span>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{err}</div>}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`} className="overflow-hidden rounded-lg border border-[color:var(--color-forest-deep)]/10">
            <div className="relative aspect-[4/3] bg-[color:var(--color-bone-soft)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt.th} className="absolute inset-0 h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-[color:var(--color-forest-deep)]/85 px-1.5 py-0.5 text-[9px] text-white">ปก</span>}
            </div>
            <div className="flex items-center gap-1 p-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">◀</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded px-1.5 text-xs text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30">▶</button>
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="ml-auto rounded px-1.5 text-xs text-red-600 hover:bg-red-50">ลบ</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoomsManager({ initialRooms }: { initialRooms: AdminRoom[] }) {
  const [rooms, setRooms] = useState<AdminRoom[]>(initialRooms);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setDraft(toDraft());
    setErr(null);
  }
  function openEdit(r: AdminRoom) {
    setEditing(r);
    setDraft(toDraft(r));
    setErr(null);
  }
  function close() {
    setDraft(null);
    setEditing(null);
  }
  const upd = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updDetails = (patch: Partial<RoomDetails>) => setDraft((d) => (d ? { ...d, details: { ...d.details, ...patch } } : d));

  async function toggleAvailable(room: AdminRoom, next: boolean) {
    setBusyId(room.id);
    setRooms((l) => l.map((r) => (r.id === room.id ? { ...r, is_available: next } : r)));
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ is_available: next }) });
      if (!res.ok) throw new Error();
    } catch {
      setRooms((l) => l.map((r) => (r.id === room.id ? { ...r, is_available: !next } : r)));
    } finally {
      setBusyId(null);
    }
  }

  function payloadFrom(d: Draft, includeSlug: boolean) {
    const details: RoomDetails = {
      startingPrice: Number(d.price_weekday) || undefined,
      bedSize: d.details.bedSize,
      roomSize: d.details.roomSize,
      layout: d.details.layout,
      breakfast: d.details.breakfast,
      extraBed: d.details.extraBed,
      services: d.details.services,
      checkIn: d.details.checkIn,
      checkOut: d.details.checkOut,
      badge: d.details.badge,
    };
    if (typeof d.details.startingPrice === "number") details.startingPrice = d.details.startingPrice;
    return {
      ...(includeSlug ? { slug: d.slug.trim() } : {}),
      room_type: d.room_type,
      name_th: d.name.th,
      name_en: d.name.en,
      description_th: d.description.th,
      description_en: d.description.en,
      price_weekday: Number(d.price_weekday),
      price_weekend: Number(d.price_weekend),
      max_guests: Number(d.max_guests),
      display_order: Number(d.display_order) || 0,
      is_available: d.is_available,
      images: d.images,
      amenities: d.amenities,
      details,
    };
  }

  async function save() {
    if (!draft) return;
    setErr(null);
    if (!draft.name.th || !draft.name.en || !draft.price_weekday || !draft.price_weekend || !draft.max_guests) {
      setErr("กรอกชื่อ (ไทย/อังกฤษ) ราคา และจำนวนผู้เข้าพักให้ครบ");
      return;
    }
    if (!editing && !draft.slug.trim()) {
      setErr("กรอก slug (ตัวระบุห้อง เช่น villa-1)");
      return;
    }
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/rooms/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payloadFrom(draft, false)) })
        : await fetch(`/api/admin/rooms`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payloadFrom(draft, true)) });
      const data = (await res.json()) as { room?: AdminRoom; error?: string; fields?: Record<string, string> };
      if (!res.ok || !data.room) {
        setErr(data.error ? `${data.error}${data.fields ? " — " + Object.values(data.fields).join(", ") : ""}` : "บันทึกไม่สำเร็จ");
        setSaving(false);
        return;
      }
      const saved = data.room;
      setRooms((l) => (editing ? l.map((r) => (r.id === editing.id ? saved : r)) : [...l, saved]));
      close();
    } catch {
      setErr("บันทึกไม่สำเร็จ ลองใหม่");
    }
    setSaving(false);
  }

  async function duplicate(r: AdminRoom) {
    const d = toDraft(r);
    const base = payloadFrom({ ...d, slug: "" }, true);
    const body = { ...base, slug: `${r.slug}-copy-${Date.now().toString().slice(-4)}`, name_th: `${r.name_th} (สำเนา)`, name_en: `${r.name_en} (copy)` };
    const res = await fetch("/api/admin/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const saved = ((await res.json()) as { room: AdminRoom }).room;
      setRooms((l) => [...l, saved]);
    }
  }

  async function remove(r: AdminRoom) {
    if (!window.confirm(`ลบห้อง "${r.name_th}"? การกระทำนี้ย้อนกลับไม่ได้`)) return;
    const res = await fetch(`/api/admin/rooms/${r.id}`, { method: "DELETE" });
    if (res.ok) setRooms((l) => l.filter((x) => x.id !== r.id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[color:var(--color-ink)]/55">{rooms.length} ห้อง</span>
        <button type="button" onClick={openCreate} className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-forest-deep)]">+ เพิ่มห้อง</button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((r) => {
          const imgs = asImages(r.images);
          const det = (r.details && typeof r.details === "object" ? r.details : {}) as RoomDetails;
          const amen = asBiList(r.amenities);
          const badge = asBi(det.badge);
          return (
            <article key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-sm">
              <div className="relative aspect-[16/10] bg-[color:var(--color-bone-soft)]">
                {imgs[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgs[0].src} alt={r.name_th} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[color:var(--color-ink)]/40">ยังไม่มีรูป</div>
                )}
                {badge.th && <span className="absolute bottom-2 left-2 rounded-full bg-[color:var(--color-warm-clay)] px-2.5 py-1 text-[11px] font-semibold text-white">{badge.th}</span>}
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.is_available ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>{r.is_available ? "เปิดจอง" : "ปิด"}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{r.name_th}</h3>
                  <p className="text-xs text-[color:var(--color-ink)]/45">{r.slug} · {TYPE_LABEL[r.room_type] ?? r.room_type}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-ink)]/70">
                  <span>฿{r.price_weekday.toLocaleString("en-US")} / ฿{r.price_weekend.toLocaleString("en-US")}</span>
                  <span>· พักได้ {r.max_guests}</span>
                  <span>· {imgs.length} รูป</span>
                </div>
                {amen.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {amen.slice(0, 4).map((a, i) => (
                      <span key={i} className="rounded-full bg-[color:var(--color-bone-soft)] px-2 py-0.5 text-[11px] text-[color:var(--color-forest-deep)]/80">{a.th}</span>
                    ))}
                    {amen.length > 4 && <span className="text-[11px] text-[color:var(--color-ink)]/40">+{amen.length - 4}</span>}
                  </div>
                )}
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => openEdit(r)} className="rounded-lg bg-[color:var(--color-forest-deep)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">แก้ไข</button>
                  <button type="button" onClick={() => duplicate(r)} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-3 py-1.5 text-sm text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">ทำซ้ำ</button>
                  <button type="button" onClick={() => remove(r)} className="ml-auto rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">ลบ</button>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={r.is_available} disabled={busyId === r.id} onChange={(e) => toggleAvailable(r, e.target.checked)} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" />
                  </label>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Editor modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-[color:var(--color-forest-deep)]/10 bg-white px-5 py-3">
              <h2 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{editing ? "แก้ไขห้อง" : "เพิ่มห้องใหม่"}</h2>
              <button type="button" onClick={close} className="rounded p-1 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]">✕</button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <FieldLabel>ประเภท</FieldLabel>
                  <select className={inputCls} value={draft.room_type} onChange={(e) => upd({ room_type: e.target.value })}>
                    {ROOM_TYPES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <FieldLabel>slug (ตัวระบุห้อง)</FieldLabel>
                  <input className={inputCls} value={draft.slug} disabled={!!editing} onChange={(e) => upd({ slug: e.target.value })} placeholder="villa-1" />
                </label>
              </div>

              <BiField label="ชื่อห้อง" value={draft.name} onChange={(v) => upd({ name: v })} />
              <BiField label="คำอธิบาย" value={draft.description} onChange={(v) => upd({ description: v })} />
              <BiField label="ป้ายโปรโมชัน (เช่น เหลือ 1 ห้องสุดท้าย) — เว้นว่างได้" value={draft.details.badge ?? EMPTY_BI} onChange={(v) => updDetails({ badge: v })} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-1.5"><FieldLabel>ราคาธรรมดา</FieldLabel><input type="number" className={inputCls} value={draft.price_weekday} onChange={(e) => upd({ price_weekday: e.target.value })} /></label>
                <label className="grid gap-1.5"><FieldLabel>ราคาวันหยุด</FieldLabel><input type="number" className={inputCls} value={draft.price_weekend} onChange={(e) => upd({ price_weekend: e.target.value })} /></label>
                <label className="grid gap-1.5"><FieldLabel>พักได้ (คน)</FieldLabel><input type="number" className={inputCls} value={draft.max_guests} onChange={(e) => upd({ max_guests: e.target.value })} /></label>
              </div>

              <ImagesEditor images={draft.images} onChange={(v) => upd({ images: v })} />

              <div className="grid gap-4 sm:grid-cols-2">
                <BiField label="ขนาดเตียง" value={draft.details.bedSize ?? EMPTY_BI} onChange={(v) => updDetails({ bedSize: v })} />
                <BiField label="ขนาดห้อง" value={draft.details.roomSize ?? EMPTY_BI} onChange={(v) => updDetails({ roomSize: v })} />
                <BiField label="เลย์เอาต์" value={draft.details.layout ?? EMPTY_BI} onChange={(v) => updDetails({ layout: v })} />
                <BiField label="อาหารเช้า" value={draft.details.breakfast ?? EMPTY_BI} onChange={(v) => updDetails({ breakfast: v })} />
                <BiField label="เตียงเสริม" value={draft.details.extraBed ?? EMPTY_BI} onChange={(v) => updDetails({ extraBed: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5"><FieldLabel>เช็คอิน</FieldLabel><input className={inputCls} value={draft.details.checkIn ?? ""} onChange={(e) => updDetails({ checkIn: e.target.value })} /></label>
                  <label className="grid gap-1.5"><FieldLabel>เช็คเอาท์</FieldLabel><input className={inputCls} value={draft.details.checkOut ?? ""} onChange={(e) => updDetails({ checkOut: e.target.value })} /></label>
                </div>
              </div>

              <BiListEditor label="บริการ (services)" items={draft.details.services ?? []} onChange={(v) => updDetails({ services: v })} />
              <BiListEditor label="สิ่งอำนวยความสะดวก (amenities)" items={draft.amenities} onChange={(v) => upd({ amenities: v })} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5"><FieldLabel>ลำดับแสดง</FieldLabel><input type="number" className={inputCls} value={draft.display_order} onChange={(e) => upd({ display_order: e.target.value })} /></label>
                <label className="flex items-center gap-2.5 pt-6"><input type="checkbox" checked={draft.is_available} onChange={(e) => upd({ is_available: e.target.checked })} className="h-4 w-4 accent-[color:var(--color-warm-clay)]" /><span className="text-sm">เปิดให้จอง</span></label>
              </div>

              {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 rounded-b-2xl border-t border-[color:var(--color-forest-deep)]/10 bg-white px-5 py-3">
              <button type="button" onClick={close} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">ยกเลิก</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50">{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
