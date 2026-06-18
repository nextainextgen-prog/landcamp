"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useT } from "@/app/providers";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useT();
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    const fd = new FormData(e.currentTarget);
    const lead = {
      name: String(fd.get("name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim() || null,
      checkin_date: String(fd.get("checkin") ?? "") || null,
      message: String(fd.get("message") ?? "").trim() || null,
      source: "landing-page",
    };

    if (!lead.name || !lead.phone) {
      setErrorMessage(
        t({ th: "กรุณาระบุชื่อและเบอร์โทร", en: "Name and phone are required." }),
      );
      setState("error");
      return;
    }

    const form = e.currentTarget;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const result = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !result.ok) {
        setErrorMessage(
          result.message ??
            t({
              th: "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง",
              en: "Submission failed. Please try again.",
            }),
        );
        setState("error");
        return;
      }
      setState("success");
      form.reset();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        t({
          th: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
          en: "Could not reach the server.",
        }),
      );
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="rounded-[16px] border border-[color:var(--color-warm-clay)]/35 bg-[color:var(--color-warm-clay)]/10 p-6 sm:p-8 text-[color:var(--color-bone)]"
      >
        <span
          className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {t({ th: "ส่งสำเร็จ", en: "Received" })}
        </span>
        <h3 className="mt-3 font-display text-2xl sm:text-3xl leading-tight">
          {t({
            th: "ขอบคุณครับ — ทีมงานจะติดต่อกลับใน 24 ชม.",
            en: "Thank you — our team will reach out within 24 hours.",
          })}
        </h3>
        <p className="mt-3 text-[color:var(--color-bone)]/75 text-sm leading-relaxed">
          {t({
            th: "หากต้องการสอบถามด่วน แอด Line @landcamp ได้ตลอด 24 ชั่วโมง",
            en: "For anything urgent, message Line @landcamp anytime — we reply within hours.",
          })}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label={t({ th: "ชื่อ", en: "Name" })}
          name="name"
          required
          autoComplete="name"
        />
        <FormField
          label={t({ th: "เบอร์โทร", en: "Phone" })}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label={t({ th: "อีเมล (ไม่บังคับ)", en: "Email (optional)" })}
          name="email"
          type="email"
          autoComplete="email"
        />
        <FormField
          label={t({ th: "วันที่ต้องการเข้าพัก", en: "Preferred check-in" })}
          name="checkin"
          type="date"
        />
      </div>

      <FormField
        label={t({ th: "ข้อความ", en: "Message" })}
        name="message"
        textarea
      />

      {errorMessage && (
        <p
          role="alert"
          className="text-sm text-[color:var(--color-warm-clay)]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className={cn(
          "mt-2 inline-flex items-center justify-center gap-3 rounded-full px-6 py-4 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500",
          "bg-[color:var(--color-bone)] text-[color:var(--color-forest-night)]",
          "hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)]",
          state === "submitting" && "opacity-60 cursor-wait",
        )}
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {state === "submitting"
          ? t({ th: "กำลังส่ง…", en: "Sending…" })
          : t({ th: "ส่งคำขอจอง", en: "Send Request" })}
        <span aria-hidden className="inline-block h-px w-5 bg-current opacity-70" />
      </button>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  textarea = false,
  required = false,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/65"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
        {required && <span className="text-[color:var(--color-warm-clay)] ml-1">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          rows={4}
          className="w-full bg-[color:var(--color-bone)]/5 border border-[color:var(--color-bone)]/15 rounded-[10px] px-4 py-3 text-[color:var(--color-bone)] placeholder:text-[color:var(--color-bone)]/40 focus:border-[color:var(--color-warm-clay)] focus:outline-none transition-colors text-sm leading-relaxed"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-[color:var(--color-bone)]/5 border border-[color:var(--color-bone)]/15 rounded-[10px] px-4 py-3 text-[color:var(--color-bone)] placeholder:text-[color:var(--color-bone)]/40 focus:border-[color:var(--color-warm-clay)] focus:outline-none transition-colors text-sm"
        />
      )}
    </label>
  );
}
