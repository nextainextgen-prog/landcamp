"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SETTINGS_GROUPS } from "./settings-config";

function CardIcon({ locked }: { locked?: boolean }) {
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]">
      {locked ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
          <rect x="4.5" y="11" width="15" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.3-2.6H10.8l-.3 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.3 2.6h2.4l.3-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
        </svg>
      )}
    </span>
  );
}

export function SettingsHub({ role }: { role: AdminRole }) {
  const [q, setQ] = useState("");
  const norm = q.trim().toLowerCase();

  const groups = useMemo(() => {
    return SETTINGS_GROUPS.map((g) => ({
      ...g,
      cards: g.cards
        .filter((c) => role === "super_admin" || !c.superAdminOnly)
        .filter((c) => !norm || `${c.title} ${c.desc}`.toLowerCase().includes(norm)),
    })).filter((g) => g.cards.length > 0);
  }, [norm, role]);

  return (
    <div className="flex flex-col gap-7">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาการตั้งค่า…"
        className="w-full max-w-md rounded-xl border border-[color:var(--color-forest-deep)]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-warm-clay)]"
      />

      {groups.length === 0 && (
        <p className="text-sm text-[color:var(--color-ink)]/45">ไม่พบการตั้งค่าที่ค้นหา</p>
      )}

      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink)]/45">
            {g.label}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.cards.map((c) => {
              const inner = (
                <>
                  <CardIcon locked={c.superAdminOnly} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{c.title}</span>
                      {!c.href && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          เร็ว ๆ นี้
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[color:var(--color-ink)]/55">{c.desc}</p>
                  </div>
                </>
              );
              const base =
                "flex items-start gap-3.5 rounded-2xl border bg-white p-4 transition-colors";
              return c.href ? (
                <Link
                  key={c.title}
                  href={c.href}
                  className={`${base} border-[color:var(--color-forest-deep)]/10 hover:border-[color:var(--color-warm-clay)]/40 hover:bg-[color:var(--color-bone-soft)]/40`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={c.title} className={`${base} cursor-not-allowed border-dashed border-[color:var(--color-forest-deep)]/12 opacity-70`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
