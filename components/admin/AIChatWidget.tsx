"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ReportPayload } from "@/lib/ai/generatePDF";

/**
 * "น้องแคมป์" — embedded admin AI assistant. A floating launcher (bottom-right)
 * opens a chat panel that talks to /api/admin/ai/chat (Gemini + function
 * calling). On first mount it pulls a proactive summary from
 * /api/admin/ai/report and shows it as น้องแคมป์'s opening message.
 *
 * Conversation lives in this component's state. It's mounted by the persistent
 * admin layout, so the thread survives route changes without localStorage.
 * Icons are inline SVG only; colours follow the admin theme (forest / clay).
 */

type ChatMsg = {
  id: string;
  role: "user" | "model";
  content: string;
  report?: ReportPayload | null;
};

const MAX_HISTORY = 20;
let msgSeq = 0;
const newId = () => `m${++msgSeq}`;

/** Quick-ask chips shown above the input — one tap sends the question. */
const SUGGESTIONS = [
  "สรุปภาพรวมวันนี้",
  "รายได้เดือนนี้",
  "ห้องว่างคืนนี้",
  "สลิปที่รอตรวจ",
  "เช็คอินวันนี้",
  "ลูกค้าใหม่เดือนนี้",
];

export function AIChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch the proactive opening report once on mount (drives the unread badge).
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetch(`/api/admin/ai/report?page=${encodeURIComponent(pathname)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { message?: { content: string }; report?: ReportPayload | null } | null) => {
        if (!d?.message) return;
        setMessages([{ id: newId(), role: "model", content: d.message.content, report: d.report ?? null }]);
        setUnread(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the view pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  function toggle() {
    setOpen((v) => {
      if (!v) setUnread(false);
      return !v;
    });
  }

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    const userMsg: ChatMsg = { id: newId(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
          currentPage: pathname,
        }),
      });
      const data = (await res.json()) as { reply?: string; report?: ReportPayload | null; error?: string };
      const content = res.ok ? data.reply ?? "ขออภัยครับ ตอบไม่ได้ในตอนนี้" : data.error ?? "เกิดข้อผิดพลาด";
      setMessages((m) => [...m, { id: newId(), role: "model", content, report: res.ok ? data.report ?? null : null }]);
    } catch {
      setMessages((m) => [...m, { id: newId(), role: "model", content: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้งครับ" }]);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
  }

  async function downloadPdf(report: ReportPayload) {
    try {
      const { generateReportPDF } = await import("@/lib/ai/generatePDF");
      await generateReportPDF(report);
    } catch {
      // non-fatal — surfaced as no download
    }
  }

  return (
    <>
      {/* ── Launcher ── */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "ปิดน้องแคมป์" : "เปิดน้องแคมป์ ผู้ช่วย AI"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] text-white shadow-[0_12px_30px_-8px_rgba(45,55,40,0.5)] transition-transform hover:scale-105"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
            <path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20" />
          </svg>
        )}
        {!open && unread && (
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" aria-hidden />
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[calc(100vh-7rem)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_30px_70px_-30px_rgba(45,55,40,0.55)]">
          {/* Header */}
          <header className="flex items-center gap-2.5 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/50 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)]/15 text-[color:var(--color-warm-clay)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20" />
              </svg>
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[color:var(--color-forest-deep)]">น้องแคมป์</div>
              <div className="text-[10px] text-[color:var(--color-ink)]/45">ผู้ช่วย AI · LandCamp Villa</div>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-lg px-2 py-1 text-[11px] text-[color:var(--color-ink)]/55 transition-colors hover:bg-white hover:text-[color:var(--color-warm-clay)]"
            >
              ล้างประวัติ
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิด"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--color-ink)]/45 transition-colors hover:bg-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--color-bone-soft)]/20 px-3.5 py-4">
            {messages.length === 0 && !loading && (
              <p className="mt-8 text-center text-xs text-[color:var(--color-ink)]/40">เริ่มถามน้องแคมป์ได้เลยครับ</p>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-br-sm bg-[color:var(--color-warm-clay)] px-3.5 py-2 text-sm text-white">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex flex-col items-start gap-1">
                  <span className="pl-1 text-[10px] font-medium text-[color:var(--color-ink)]/40">น้องแคมป์</span>
                  <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-[color:var(--color-forest-deep)]/8 bg-white px-3.5 py-2 text-sm text-[color:var(--color-ink)]">
                    {m.content}
                  </div>
                  {m.report && (
                    <button
                      type="button"
                      onClick={() => downloadPdf(m.report!)}
                      className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]/60"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M12 3v12M12 15l-4-4M12 15l4-4" />
                        <path d="M5 19h14" />
                      </svg>
                      ดาวน์โหลด PDF
                    </button>
                  )}
                </div>
              ),
            )}
            {loading && (
              <div className="flex flex-col items-start gap-1">
                <span className="pl-1 text-[10px] font-medium text-[color:var(--color-ink)]/40">น้องแคมป์</span>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-[color:var(--color-forest-deep)]/8 bg-white px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-ink)]/35"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick-ask chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-[color:var(--color-forest-deep)]/8 bg-white px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => void send(s)}
                className="whitespace-nowrap rounded-full border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)]/40 px-3 py-1.5 text-xs text-[color:var(--color-forest-deep)] transition-colors hover:border-[color:var(--color-warm-clay)]/40 hover:bg-[color:var(--color-warm-clay)]/10 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-white px-3 py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="พิมพ์คำถาม…"
              className="flex-1 rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-[color:var(--color-bone-soft)]/40 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]/45 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              aria-label="ส่ง"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-warm-clay)] text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
