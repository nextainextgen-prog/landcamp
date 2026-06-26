"use client";

import { useMemo, useState, type ReactNode } from "react";

import { ActionButton } from "@/components/admin/ActionButton";
import { useConfirmAction } from "@/components/admin/useConfirmAction";

export type TaskStatus = "pending" | "in_progress" | "done";
export type Task = {
  id: string;
  roomName: string;
  bookingCode: string | null;
  status: TaskStatus;
  assignee: string;
  note: string;
  dueDate: string | null;
  createdAt: string;
};
export type RoomOption = { id: string; name: string };

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "pending", label: "รอทำความสะอาด", dot: "#cf9b46" },
  { key: "in_progress", label: "กำลังทำ", dot: "#5b8baf" },
  { key: "done", label: "เสร็จแล้ว", dot: "#3fa173" },
];

const CARD = "rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]";

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const p: Record<string, ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>,
    broom: <><path d="M19 4 9 14M6 21l3-3M4 16l4 4M8 14l2 2" /><path d="M14 9l5 5-3 3-5-5z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{p[name]}</svg>;
}

export function HousekeepingBoard({ initial, rooms }: { initial: Task[]; rooms: RoomOption[] }) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmAction();

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] };
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);

  async function patch(id: string, body: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/housekeeping/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setTasks((l) => l.map((t) => (t.id === id ? { ...t, ...body } as Task : t)));
    } catch {
      flash("อัปเดตไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  function askRemove(t: Task) {
    confirm({
      title: "ลบงาน",
      message: `ลบงานทำความสะอาดของ "${t.roomName}"?`,
      danger: true,
      confirmLabel: "ลบ",
      run: async () => {
        const res = await fetch(`/api/admin/housekeeping/${t.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      },
      onSuccess: () => setTasks((l) => l.filter((x) => x.id !== t.id)),
    });
  }
  async function create(form: { room_id: string; note: string; assignee: string; due_date: string }) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/housekeeping", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const d = (await res.json()) as { task?: { id: string; created_at: string } };
      if (!res.ok || !d.task) throw new Error("เพิ่มงานไม่สำเร็จ");
      setTasks((l) => [
        {
          id: d.task!.id,
          roomName: rooms.find((r) => r.id === form.room_id)?.name ?? "—",
          bookingCode: null,
          status: "pending",
          assignee: form.assignee,
          note: form.note,
          dueDate: form.due_date || null,
          createdAt: d.task!.created_at,
        },
        ...l,
      ]);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[color:var(--color-forest-deep)]">กระดานแม่บ้าน</h1>
          <p className="text-sm text-[color:var(--color-ink)]/50">มอบหมายและติดตามงานทำความสะอาดห้องพัก</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-warm-clay)]">
          <Icon name="plus" /> เพิ่มงาน
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.key} className={`${CARD} flex flex-col`}>
            <header className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/8 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-forest-deep)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} /> {col.label}
              </span>
              <span className="rounded-full bg-[color:var(--color-bone-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-ink)]/55">{grouped[col.key].length}</span>
            </header>
            <div className="flex flex-col gap-2.5 p-3">
              {grouped[col.key].length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-[color:var(--color-ink)]/35">ไม่มีงาน</p>
              ) : (
                grouped[col.key].map((t) => (
                  <article key={t.id} className="rounded-xl border border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/25 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-forest-deep)]"><Icon name="broom" className="h-3.5 w-3.5 text-[color:var(--color-warm-clay)]" /> {t.roomName}</span>
                      <button type="button" onClick={() => askRemove(t)} className="text-[color:var(--color-ink)]/30 hover:text-red-500"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                    </div>
                    {t.bookingCode && <div className="mt-0.5 font-mono text-[10px] text-[color:var(--color-ink)]/40">{t.bookingCode}</div>}
                    {t.note && <p className="mt-1 text-xs text-[color:var(--color-ink)]/70">{t.note}</p>}
                    <input
                      defaultValue={t.assignee}
                      onBlur={(e) => { if (e.target.value.trim() !== t.assignee) patch(t.id, { assignee: e.target.value.trim() }); }}
                      placeholder="ผู้รับผิดชอบ…"
                      className="mt-2 w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[color:var(--color-warm-clay)]"
                    />
                    {t.dueDate && <div className="mt-1.5 text-[11px] text-[color:var(--color-ink)]/45">กำหนด {new Date(t.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</div>}
                    <div className="mt-2 flex gap-1.5">
                      {col.key !== "pending" && <button type="button" disabled={busy} onClick={() => patch(t.id, { status: prevStatus(col.key) })} className="rounded-md border border-[color:var(--color-forest-deep)]/20 px-2 py-1 text-[11px] text-[color:var(--color-forest-deep)] hover:bg-white disabled:opacity-50">ย้อน</button>}
                      {col.key !== "done" && <button type="button" disabled={busy} onClick={() => patch(t.id, { status: nextStatus(col.key) })} className="rounded-md bg-[color:var(--color-forest-deep)] px-2 py-1 text-[11px] font-medium text-white hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50">{col.key === "pending" ? "เริ่มทำ" : "เสร็จแล้ว"}</button>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {adding && <AddDialog rooms={rooms} busy={busy} onClose={() => setAdding(false)} onSave={create} />}
      {dialog}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[color:var(--color-forest-deep)] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function nextStatus(s: TaskStatus): TaskStatus {
  return s === "pending" ? "in_progress" : "done";
}
function prevStatus(s: TaskStatus): TaskStatus {
  return s === "done" ? "in_progress" : "pending";
}

function AddDialog({ rooms, busy, onClose, onSave }: { rooms: RoomOption[]; busy: boolean; onClose: () => void; onSave: (f: { room_id: string; note: string; assignee: string; due_date: string }) => Promise<void> }) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const inputCls = "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[color:var(--color-forest-deep)]">เพิ่มงานทำความสะอาด</h3>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ห้อง
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputCls}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">รายละเอียด
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ทำความสะอาดหลังเช็คเอาท์" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">ผู้รับผิดชอบ
            <input value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[color:var(--color-ink)]/55">กำหนดเสร็จ
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2 text-sm text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]">ยกเลิก</button>
          <ActionButton variant="primary" disabled={busy || !roomId} onClick={() => onSave({ room_id: roomId, note, assignee, due_date: due })} pendingLabel="กำลังเพิ่ม…" doneLabel="เพิ่มแล้ว">เพิ่มงาน</ActionButton>
        </div>
      </div>
    </div>
  );
}
