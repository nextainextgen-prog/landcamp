"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { SuccessCheck, Spinner } from "./SuccessCheck";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  /** Confirm button label (default "ยืนยัน"; for danger, e.g. "ลบ"). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red styling + warning icon for destructive actions. */
  danger?: boolean;
  /** The async work; throw to surface an error in the dialog. */
  run: () => void | Promise<void>;
  /** Text shown next to the success check (default "สำเร็จ"). */
  successText?: string;
  /** Called after the success animation, once the dialog closes. */
  onSuccess?: () => void;
};

type Phase = "confirm" | "running" | "success" | "error";

/**
 * Pop-up confirm + run + success flow for destructive / important actions.
 *
 *   const { confirm, dialog } = useConfirmAction();
 *   <button onClick={() => confirm({ title, message, danger: true,
 *     confirmLabel: "ลบ", run: () => deleteThing(), onSuccess: refresh })}>ลบ</button>
 *   ...
 *   return <>{...}{dialog}</>;
 *
 * Lifecycle inside the same modal:
 *   confirm → (ยืนยัน) → running spinner → success check (auto-close) → onSuccess
 *                                       └ error → message + "ลองใหม่"
 */
export function useConfirmAction() {
  const [cfg, setCfg] = useState<ConfirmOptions | null>(null);
  const [phase, setPhase] = useState<Phase>("confirm");
  const [errMsg, setErrMsg] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setErrMsg("");
    setPhase("confirm");
    setCfg(opts);
  }, []);

  const close = useCallback(() => {
    setCfg(null);
    setPhase("confirm");
    setErrMsg("");
  }, []);

  const onConfirm = useCallback(async () => {
    if (!cfg) return;
    setPhase("running");
    try {
      await cfg.run();
      setPhase("success");
      closeTimer.current = setTimeout(() => {
        close();
        cfg.onSuccess?.();
      }, 1000);
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ ลองใหม่อีกครั้ง");
      setPhase("error");
    }
  }, [cfg, close]);

  const danger = cfg?.danger ?? false;
  const busy = phase === "running" || phase === "success";

  const dialog = cfg ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !busy && close()}
      style={{ animation: "fadeIn 120ms ease-out" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-6 text-center">
          {/* Icon reflects phase */}
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              phase === "success"
                ? "text-emerald-600"
                : phase === "error"
                  ? "bg-red-100 text-red-600"
                  : danger
                    ? "bg-red-100 text-red-600"
                    : "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]"
            }`}
          >
            {phase === "running" ? (
              <Spinner className="h-6 w-6" />
            ) : phase === "success" ? (
              <SuccessCheck className="h-12 w-12" />
            ) : phase === "error" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
            ) : danger ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            )}
          </span>

          <h3 className="text-base font-semibold text-[color:var(--color-forest-deep)]">
            {phase === "success" ? (cfg.successText ?? "สำเร็จ") : phase === "error" ? "เกิดข้อผิดพลาด" : cfg.title}
          </h3>

          {phase === "error" ? (
            <p className="text-sm text-red-600">{errMsg}</p>
          ) : phase === "confirm" && cfg.message ? (
            <p className="text-sm text-[color:var(--color-ink)]/60">{cfg.message}</p>
          ) : phase === "running" ? (
            <p className="text-sm text-[color:var(--color-ink)]/50">กำลังดำเนินการ…</p>
          ) : null}
        </div>

        {/* Actions — hidden during running/success */}
        {(phase === "confirm" || phase === "error") && (
          <div className="flex gap-2 px-6 pb-6 pt-4">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-[color:var(--color-forest-deep)]/15 px-4 py-2.5 text-sm font-medium text-[color:var(--color-ink)]/70 transition-colors hover:bg-[color:var(--color-bone-soft)]/60"
            >
              {phase === "error" ? "ปิด" : cfg.cancelLabel ?? "ยกเลิก"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                danger ? "bg-red-600 hover:bg-red-700" : "bg-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-warm-clay)]"
              }`}
            >
              {phase === "error" ? "ลองใหม่" : cfg.confirmLabel ?? "ยืนยัน"}
            </button>
          </div>
        )}
        {busy && <div className="pb-6" />}
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
