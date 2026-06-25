"use client";

import { useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/admin/ui";

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
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)] focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15";

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
const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;

/* ── icons (inline, stroke 1.6 — matches admin topbar) ───────────── */
type IconProps = { className?: string };
const Ico = ({ className = "h-4 w-4", d }: IconProps & { d: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const IconSearch = (p: IconProps) => <Ico {...p} d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3" />;
const IconPlus = (p: IconProps) => <Ico {...p} d="M12 5v14M5 12h14" />;
const IconEdit = (p: IconProps) => <Ico {...p} d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />;
const IconDots = (p: IconProps) => <Ico {...p} d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />;
const IconCopy = (p: IconProps) => <Ico {...p} d="M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />;
const IconTrash = (p: IconProps) => <Ico {...p} d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />;
const IconUsers = (p: IconProps) => <Ico {...p} d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />;
const IconImage = (p: IconProps) => <Ico {...p} d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6" />;
const IconGrip = (p: IconProps) => <Ico {...p} d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" />;
const IconClose = (p: IconProps) => <Ico {...p} d="M6 6l12 12M18 6 6 18" />;
const IconChevL = (p: IconProps) => <Ico {...p} d="M15 18l-6-6 6-6" />;
const IconChevR = (p: IconProps) => <Ico {...p} d="M9 18l6-6-6-6" />;

/* ── button system (4 variants) ──────────────────────────────────── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-[color:var(--color-warm-clay)] text-white hover:bg-[color:var(--color-forest-deep)]",
  secondary: "border border-[color:var(--color-forest-deep)]/20 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]",
  ghost: "text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]",
  danger: "text-red-600 hover:bg-red-50",
};
function Btn({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: { variant?: BtnVariant; size?: "sm" | "md" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]/40 ${sz} ${BTN[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
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

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-neutral-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
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
  const setAlt = (i: number, alt: Bi) => onChange(images.map((x, j) => (j === i ? { ...x, alt } : x)));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FieldLabel>รูปห้อง (แสดงบนเว็บ)</FieldLabel>
        <Btn type="button" variant="primary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <IconPlus className="h-3.5 w-3.5" />
          {uploading ? "กำลังอัปโหลด…" : "เพิ่มรูป"}
        </Btn>
        <span className="text-xs text-[color:var(--color-ink)]/45">{images.length} รูป · รูปแรก = ปก</span>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{err}</div>}
      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--color-forest-deep)]/20 bg-[color:var(--color-bone-soft)]/30 px-4 py-8 text-center text-xs text-[color:var(--color-ink)]/50">
          ยังไม่มีรูป — กด “เพิ่มรูป” เพื่ออัปโหลด
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((img, i) => (
            <li key={`${img.src}-${i}`} className="flex gap-3 rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-white p-2">
              <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-[color:var(--color-bone-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt.th} className="absolute inset-0 h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-[color:var(--color-forest-deep)]/85 px-1.5 py-0.5 text-[9px] text-white">ปก</span>}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <input className={`${inputCls} py-1.5 text-xs`} value={img.alt.th} placeholder="คำอธิบายรูป (ไทย)" onChange={(e) => setAlt(i, { ...img.alt, th: e.target.value })} />
                <input className={`${inputCls} py-1.5 text-xs`} value={img.alt.en} placeholder="alt text (English)" onChange={(e) => setAlt(i, { ...img.alt, en: e.target.value })} />
                <div className="mt-auto flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30"><IconChevL className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded p-1 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-30"><IconChevR className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"><IconTrash className="h-3.5 w-3.5" />ลบ</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── per-card kebab menu ──────────────────────────────────────────── */
function CardMenu({ onDuplicate, onDelete }: { onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="ตัวเลือกเพิ่มเติม"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
      >
        <IconDots className="h-5 w-5" />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-white py-1 shadow-[0_18px_44px_-20px_rgba(45,55,40,0.45)]">
            <button type="button" onClick={() => { setOpen(false); onDuplicate(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
              <IconCopy className="h-4 w-4" />ทำซ้ำ
            </button>
            <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50">
              <IconTrash className="h-4 w-4" />ลบห้อง
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RoomsManager({ initialRooms }: { initialRooms: AdminRoom[] }) {
  const [rooms, setRooms] = useState<AdminRoom[]>(initialRooms);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"basic" | "images" | "details">("basic");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // toolbar state
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [availOnly, setAvailOnly] = useState(false);
  const [sort, setSort] = useState<"order" | "price-asc" | "price-desc" | "name">("order");

  // drag-reorder
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setDraft(toDraft());
    setTab("basic");
    setErr(null);
  }
  function openEdit(r: AdminRoom) {
    setEditing(r);
    setDraft(toDraft(r));
    setTab("basic");
    setErr(null);
  }
  function close() {
    setDraft(null);
    setEditing(null);
  }
  const upd = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updDetails = (patch: Partial<RoomDetails>) => setDraft((d) => (d ? { ...d, details: { ...d.details, ...patch } } : d));

  /* derived: filtered + sorted list */
  const reorderable = sort === "order" && q.trim() === "" && typeFilter === "all" && !availOnly;
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = rooms.filter((r) => {
      if (typeFilter !== "all" && r.room_type !== typeFilter) return false;
      if (availOnly && !r.is_available) return false;
      if (term && !`${r.name_th} ${r.name_en} ${r.slug}`.toLowerCase().includes(term)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "order") sorted.sort((a, b) => a.display_order - b.display_order);
    else if (sort === "price-asc") sorted.sort((a, b) => a.price_weekday - b.price_weekday);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price_weekday - a.price_weekday);
    else sorted.sort((a, b) => a.name_th.localeCompare(b.name_th, "th"));
    return sorted;
  }, [rooms, q, typeFilter, availOnly, sort]);

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

  /* drag-reorder: persists display_order for the rooms that moved */
  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ordered = [...rooms].sort((a, b) => a.display_order - b.display_order);
    const from = ordered.findIndex((r) => r.id === dragId);
    const to = ordered.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) { setDragId(null); setOverId(null); return; }
    const prev = rooms;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    const renumbered = ordered.map((r, i) => ({ ...r, display_order: i }));
    setRooms(renumbered);
    setDragId(null);
    setOverId(null);
    const changed = renumbered.filter((r) => prev.find((p) => p.id === r.id)?.display_order !== r.display_order);
    try {
      await Promise.all(
        changed.map((r) =>
          fetch(`/api/admin/rooms/${r.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ display_order: r.display_order }) }),
        ),
      );
    } catch {
      setRooms(prev); // revert on failure
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
      setTab("basic");
      return;
    }
    if (!editing && !draft.slug.trim()) {
      setErr("กรอก slug (ตัวระบุห้อง เช่น villa-1)");
      setTab("basic");
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
      {/* ── toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink)]/35" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาห้อง — ชื่อ / slug"
            className="w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)]/30 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[color:var(--color-warm-clay)] focus:bg-white focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[{ key: "all", label: "ทั้งหมด" }, ...ROOM_TYPES].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTypeFilter(t.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === t.key ? "bg-[color:var(--color-forest-deep)] text-white" : "bg-[color:var(--color-bone-soft)]/60 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[color:var(--color-ink)]/65">
            <Toggle checked={availOnly} onChange={setAvailOnly} />
            เฉพาะที่เปิดจอง
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-2.5 py-2 text-xs text-[color:var(--color-forest-deep)] outline-none focus:border-[color:var(--color-warm-clay)]">
            <option value="order">เรียงตามลำดับแสดง</option>
            <option value="price-asc">ราคาน้อย → มาก</option>
            <option value="price-desc">ราคามาก → น้อย</option>
            <option value="name">ชื่อ ก → ฮ</option>
          </select>
          <Btn type="button" variant="primary" onClick={openCreate}>
            <IconPlus className="h-4 w-4" />เพิ่มห้อง
          </Btn>
        </div>
      </div>

      {reorderable && rooms.length > 1 && (
        <p className="flex items-center gap-1.5 text-xs text-[color:var(--color-ink)]/45">
          <IconGrip className="h-3.5 w-3.5" />ลากการ์ดเพื่อจัดลำดับการแสดงบนหน้าเว็บ
        </p>
      )}

      {/* ── card grid ── */}
      {visible.length === 0 ? (
        <EmptyState>
          {rooms.length === 0 ? "ยังไม่มีห้องพัก — กด “เพิ่มห้อง” เพื่อสร้างห้องแรก" : "ไม่พบห้องที่ตรงกับตัวกรอง — ลองล้างคำค้นหรือเปลี่ยนตัวกรอง"}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => {
            const imgs = asImages(r.images);
            const det = (r.details && typeof r.details === "object" ? r.details : {}) as RoomDetails;
            const amen = asBiList(r.amenities);
            const badge = asBi(det.badge);
            const isOver = overId === r.id && dragId !== r.id;
            return (
              <article
                key={r.id}
                draggable={reorderable}
                onDragStart={() => reorderable && setDragId(r.id)}
                onDragOver={(e) => { if (reorderable && dragId) { e.preventDefault(); setOverId(r.id); } }}
                onDragLeave={() => setOverId((id) => (id === r.id ? null : id))}
                onDrop={() => handleDrop(r.id)}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-30px_rgba(45,55,40,0.5)] ${isOver ? "border-[color:var(--color-warm-clay)] ring-2 ring-[color:var(--color-warm-clay)]/30" : "border-[color:var(--color-forest-deep)]/10"} ${dragId === r.id ? "opacity-50" : ""}`}
              >
                <div className="relative aspect-[16/10] bg-[color:var(--color-bone-soft)]">
                  {imgs[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgs[0].src} alt={imgs[0].alt.th || r.name_th} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-[color:var(--color-ink)]/35">
                      <IconImage className="h-6 w-6" />
                      <span className="text-xs">ยังไม่มีรูป</span>
                    </div>
                  )}
                  {reorderable && (
                    <span className="absolute left-2 top-2 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-lg bg-white/85 text-[color:var(--color-forest-deep)] opacity-0 backdrop-blur transition-opacity group-hover:opacity-100" title="ลากเพื่อจัดลำดับ">
                      <IconGrip className="h-4 w-4" />
                    </span>
                  )}
                  {/* availability = single clickable pill (status + toggle merged) */}
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => toggleAvailable(r, !r.is_available)}
                    className={`absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur transition-colors disabled:opacity-60 ${r.is_available ? "bg-emerald-500/90 text-white hover:bg-emerald-600" : "bg-white/85 text-neutral-600 hover:bg-white"}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${r.is_available ? "bg-white" : "bg-neutral-400"}`} />
                    {r.is_available ? "เปิดจอง" : "ปิดอยู่"}
                  </button>
                  {badge.th && <span className="absolute bottom-2 left-2 rounded-full bg-[color:var(--color-warm-clay)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">{badge.th}</span>}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{r.name_th}</h3>
                    <p className="text-xs text-[color:var(--color-ink)]/45">{r.slug} · {TYPE_LABEL[r.room_type] ?? r.room_type}</p>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="flex items-baseline gap-1 text-sm text-[color:var(--color-ink)]/75">
                      <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-ink)]/40">ธรรมดา</span>
                      <span className="font-semibold text-[color:var(--color-forest-deep)]">{baht(r.price_weekday)}</span>
                    </span>
                    <span className="flex items-baseline gap-1 text-sm text-[color:var(--color-ink)]/75">
                      <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-ink)]/40">วันหยุด</span>
                      <span className="font-semibold text-[color:var(--color-forest-deep)]">{baht(r.price_weekend)}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-ink)]/55">
                    <span className="inline-flex items-center gap-1"><IconUsers className="h-3.5 w-3.5" />พักได้ {r.max_guests}</span>
                    <span className="inline-flex items-center gap-1"><IconImage className="h-3.5 w-3.5" />{imgs.length} รูป</span>
                  </div>

                  {amen.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {amen.slice(0, 4).map((a, i) => (
                        <span key={i} className="rounded-full bg-[color:var(--color-bone-soft)] px-2 py-0.5 text-[11px] text-[color:var(--color-forest-deep)]/80">{a.th}</span>
                      ))}
                      {amen.length > 4 && <span className="text-[11px] text-[color:var(--color-ink)]/40">+{amen.length - 4}</span>}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2 border-t border-[color:var(--color-forest-deep)]/8 pt-3">
                    <Btn type="button" variant="primary" size="sm" className="flex-1" onClick={() => openEdit(r)}>
                      <IconEdit className="h-3.5 w-3.5" />แก้ไข
                    </Btn>
                    <CardMenu onDuplicate={() => duplicate(r)} onDelete={() => remove(r)} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── editor modal ── */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:p-8" onClick={close}>
          <div className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-[color:var(--color-forest-deep)]/10 bg-white">
              <div className="flex items-center justify-between px-5 pt-4">
                <h2 className="font-display text-lg font-semibold text-[color:var(--color-forest-deep)]">{editing ? `แก้ไข — ${editing.name_th}` : "เพิ่มห้องใหม่"}</h2>
                <button type="button" onClick={close} className="rounded-lg p-1.5 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]"><IconClose className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-1 px-4 pt-3">
                {([["basic", "ข้อมูลพื้นฐาน"], ["images", "รูปภาพ"], ["details", "รายละเอียด"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? "border-b-2 border-[color:var(--color-warm-clay)] text-[color:var(--color-forest-deep)]" : "text-[color:var(--color-ink)]/50 hover:text-[color:var(--color-forest-deep)]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {tab === "basic" && (
                <>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5"><FieldLabel>ลำดับแสดง</FieldLabel><input type="number" className={inputCls} value={draft.display_order} onChange={(e) => upd({ display_order: e.target.value })} /></label>
                    <div className="flex items-center gap-2.5 pt-6"><Toggle checked={draft.is_available} onChange={(v) => upd({ is_available: v })} /><span className="text-sm">เปิดให้จอง</span></div>
                  </div>
                </>
              )}

              {tab === "images" && <ImagesEditor images={draft.images} onChange={(v) => upd({ images: v })} />}

              {tab === "details" && (
                <>
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
                </>
              )}

              {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 rounded-b-2xl border-t border-[color:var(--color-forest-deep)]/10 bg-white px-5 py-3">
              <Btn type="button" variant="ghost" onClick={close} disabled={saving}>ยกเลิก</Btn>
              <Btn type="button" variant="primary" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึก"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
