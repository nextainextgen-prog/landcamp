"use client";

import { useRef, useState, type ReactNode } from "react";

import { SuccessCheck, Spinner } from "./SuccessCheck";

type Variant = "primary" | "danger" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] hover:bg-[color:var(--color-warm-clay)] disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  secondary:
    "border border-[color:var(--color-forest-deep)]/20 bg-white text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]/60 disabled:opacity-50",
  ghost:
    "text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-bone-soft)]/60 disabled:opacity-40",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

type Status = "idle" | "loading" | "success" | "error";

/**
 * Async-aware button with a built-in idle → loading → success lifecycle.
 *
 *   <ActionButton onClick={async () => { await save(); }}>บันทึก</ActionButton>
 *
 * While the promise runs it shows a spinner + `pendingLabel`; on resolve it
 * shows a green check + `doneLabel` for `successMs`, then returns to idle. On
 * reject it briefly flags an error and calls `onError` (so the caller can show
 * the message). The button is disabled during loading/success to block
 * double-submits.
 */
export function ActionButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  form,
  disabled = false,
  icon,
  pendingLabel = "กำลังบันทึก…",
  doneLabel = "สำเร็จ",
  successMs = 1200,
  onError,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  form?: string;
  disabled?: boolean;
  icon?: ReactNode;
  pendingLabel?: ReactNode;
  doneLabel?: ReactNode;
  successMs?: number;
  onError?: (err: unknown) => void;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function run() {
    if (status === "loading" || status === "success") return;
    if (!onClick) return;
    setStatus("loading");
    try {
      await onClick();
      setStatus("success");
      timer.current = setTimeout(() => setStatus("idle"), successMs);
    } catch (err) {
      setStatus("error");
      onError?.(err);
      timer.current = setTimeout(() => setStatus("idle"), 1600);
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <button
      type={type}
      form={form}
      disabled={disabled || busy}
      onClick={onClick ? run : undefined}
      aria-busy={status === "loading"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {status === "loading" ? (
        <>
          <Spinner className="h-4 w-4" />
          {pendingLabel}
        </>
      ) : status === "success" ? (
        <>
          <SuccessCheck className="h-4 w-4" />
          {doneLabel}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
