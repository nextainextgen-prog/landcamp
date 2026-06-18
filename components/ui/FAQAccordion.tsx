"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { faqItems } from "@/data/faq";
import { useT } from "@/app/providers";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

type FAQAccordionProps = {
  tone?: "ink" | "bone";
  className?: string;
};

export function FAQAccordion({ tone = "bone", className }: FAQAccordionProps) {
  const t = useT();
  const [open, setOpen] = useState<string | null>(faqItems[0]?.id ?? null);

  const isInk = tone === "ink";

  return (
    <ul className={cn("flex flex-col", className)}>
      {faqItems.map((item, i) => {
        const isOpen = open === item.id;
        return (
          <li
            key={item.id}
            className={cn(
              "border-b",
              isInk
                ? "border-[color:var(--color-ink)]/10"
                : "border-[color:var(--color-bone)]/15",
            )}
          >
            <motion.button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${item.id}`}
              onClick={() => setOpen(isOpen ? null : item.id)}
              className={cn(
                "w-full flex items-baseline justify-between gap-6 py-6 sm:py-7 text-left",
                isInk
                  ? "text-[color:var(--color-forest-deep)]"
                  : "text-[color:var(--color-bone)]",
              )}
            >
              <div className="flex items-baseline gap-4 flex-1">
                <span
                  className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)] pt-1"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl sm:text-[26px] leading-snug">
                  {t(item.question)}
                </h3>
              </div>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={cn(
                  "relative h-4 w-4 flex-shrink-0",
                  isInk ? "text-[color:var(--color-forest-deep)]" : "text-[color:var(--color-bone)]",
                )}
              >
                <span className="absolute inset-0 m-auto h-px w-4 bg-current" />
                <span className="absolute inset-0 m-auto h-4 w-px bg-current" />
              </motion.span>
            </motion.button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  id={`faq-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p
                    className={cn(
                      "pb-8 max-w-[68ch] leading-[1.7] text-[15px] sm:text-base",
                      "pl-11 sm:pl-12",
                      isInk
                        ? "text-[color:var(--color-ink)]/75"
                        : "text-[color:var(--color-bone)]/75",
                    )}
                  >
                    {t(item.answer)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
