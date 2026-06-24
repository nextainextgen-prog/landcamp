"use client";

import { useState, type FormEvent } from "react";
import { Panel, Badge } from "@/components/admin/ui";

export type CrmNote = {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

export type CrmContact = {
  id: string;
  channel: "phone" | "email" | "line" | "chat" | "other";
  direction: "inbound" | "outbound";
  summary: string;
  author_name: string | null;
  created_at: string;
};

const inputClass =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-forest-deep)] focus:ring-1 focus:ring-[color:var(--color-forest-deep)]/30";

const CHANNEL_TH: Record<CrmContact["channel"], string> = {
  phone: "โทร",
  email: "อีเมล",
  line: "LINE",
  chat: "แชต",
  other: "อื่นๆ",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerCrm({
  customerId,
  initialIsVip,
  initialTags,
  initialNotes,
  initialContacts,
}: {
  customerId: string;
  initialIsVip: boolean;
  initialTags: string[];
  initialNotes: CrmNote[];
  initialContacts: CrmContact[];
}) {
  return (
    <>
      <VipTagsPanel customerId={customerId} initialIsVip={initialIsVip} initialTags={initialTags} />
      <NotesPanel customerId={customerId} initialNotes={initialNotes} />
      <ContactsPanel customerId={customerId} initialContacts={initialContacts} />
    </>
  );
}

// ── VIP flag + tags ──
function VipTagsPanel({
  customerId,
  initialIsVip,
  initialTags,
}: {
  customerId: string;
  initialIsVip: boolean;
  initialTags: string[];
}) {
  const [isVip, setIsVip] = useState(initialIsVip);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: { isVip?: boolean; tags?: string[] }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "บันทึกไม่สำเร็จ");
      }
      const d = (await res.json()) as { isVip: boolean; tags: string[] };
      setIsVip(d.isVip);
      setTags(d.tags);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function addTag(e: FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t || tags.includes(t)) {
      setDraft("");
      return;
    }
    setDraft("");
    void persist({ tags: [...tags, t] });
  }

  function removeTag(t: string) {
    void persist({ tags: tags.filter((x) => x !== t) });
  }

  return (
    <Panel title="CRM">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color:var(--color-ink)]/70">ลูกค้า VIP</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void persist({ isVip: !isVip })}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
              isVip
                ? "bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)]"
                : "border border-[color:var(--color-forest-deep)]/20 text-[color:var(--color-ink)]/60"
            }`}
          >
            {isVip ? "★ VIP" : "ตั้งเป็น VIP"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--color-ink)]/50">แท็ก</span>
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <span className="text-xs text-[color:var(--color-ink)]/40">ยังไม่มีแท็ก</span>
            )}
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                disabled={busy}
                onClick={() => removeTag(t)}
                title="คลิกเพื่อลบ"
                className="group inline-flex items-center gap-1"
              >
                <Badge tone="sage">
                  {t}
                  <span className="ml-1 text-[color:var(--color-ink)]/40 group-hover:text-red-500">×</span>
                </Badge>
              </button>
            ))}
          </div>
          <form onSubmit={addTag} className="flex gap-2">
            <input
              className={inputClass}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="เพิ่มแท็ก เช่น ลูกค้าประจำ"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="shrink-0 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-3 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] disabled:opacity-50"
            >
              เพิ่ม
            </button>
          </form>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Panel>
  );
}

// ── Notes timeline ──
function NotesPanel({ customerId, initialNotes }: { customerId: string; initialNotes: CrmNote[] }) {
  const [notes, setNotes] = useState<CrmNote[]>(initialNotes);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "บันทึกไม่สำเร็จ");
      }
      const d = (await res.json()) as { note: CrmNote };
      setNotes((prev) => [d.note, ...prev]);
      setBody("");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/admin/customers/${customerId}/notes/${id}`, { method: "DELETE" });
  }

  return (
    <Panel title="โน้ต / บันทึก">
      <form onSubmit={add} className="flex flex-col gap-2">
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="เพิ่มโน้ตเกี่ยวกับลูกค้า…"
        />
        <div className="flex items-center justify-between">
          {error ? <span className="text-xs text-red-600">{error}</span> : <span />}
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-medium text-[color:var(--color-bone)] hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก…" : "เพิ่มโน้ต"}
          </button>
        </div>
      </form>

      <ul className="mt-4 flex flex-col gap-3">
        {notes.length === 0 && (
          <li className="text-xs text-[color:var(--color-ink)]/40">ยังไม่มีโน้ต</li>
        )}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/30 px-3 py-2.5">
            <p className="whitespace-pre-wrap text-sm text-[color:var(--color-ink)]/85">{n.body}</p>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[color:var(--color-ink)]/40">
              <span>{n.author_name ?? "—"} · {when(n.created_at)}</span>
              <button type="button" onClick={() => remove(n.id)} className="hover:text-red-500">
                ลบ
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── Contact log ──
function ContactsPanel({
  customerId,
  initialContacts,
}: {
  customerId: string;
  initialContacts: CrmContact[];
}) {
  const [contacts, setContacts] = useState<CrmContact[]>(initialContacts);
  const [channel, setChannel] = useState<CrmContact["channel"]>("phone");
  const [direction, setDirection] = useState<CrmContact["direction"]>("outbound");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const text = summary.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, direction, summary: text }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "บันทึกไม่สำเร็จ");
      }
      const d = (await res.json()) as { contact: CrmContact };
      setContacts((prev) => [d.contact, ...prev]);
      setSummary("");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="ประวัติการติดต่อ">
      <form onSubmit={add} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <select className={inputClass} value={channel} onChange={(e) => setChannel(e.target.value as CrmContact["channel"])}>
            {(Object.keys(CHANNEL_TH) as CrmContact["channel"][]).map((c) => (
              <option key={c} value={c}>{CHANNEL_TH[c]}</option>
            ))}
          </select>
          <select className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value as CrmContact["direction"])}>
            <option value="outbound">เราติดต่อไป</option>
            <option value="inbound">ลูกค้าติดต่อมา</option>
          </select>
        </div>
        <input
          className={inputClass}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="สรุปสั้นๆ เช่น โทรยืนยันวันเข้าพัก"
        />
        <div className="flex items-center justify-between">
          {error ? <span className="text-xs text-red-600">{error}</span> : <span />}
          <button
            type="submit"
            disabled={busy || !summary.trim()}
            className="rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-medium text-[color:var(--color-bone)] hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก…" : "บันทึกการติดต่อ"}
          </button>
        </div>
      </form>

      <ul className="mt-4 flex flex-col gap-3">
        {contacts.length === 0 && (
          <li className="text-xs text-[color:var(--color-ink)]/40">ยังไม่มีประวัติการติดต่อ</li>
        )}
        {contacts.map((c) => (
          <li key={c.id} className="rounded-lg border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Badge tone={c.direction === "inbound" ? "blue" : "forest"}>
                {CHANNEL_TH[c.channel]} · {c.direction === "inbound" ? "เข้า" : "ออก"}
              </Badge>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-[color:var(--color-ink)]/85">{c.summary}</p>
            <p className="mt-1 text-[11px] text-[color:var(--color-ink)]/40">
              {c.author_name ?? "—"} · {when(c.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
