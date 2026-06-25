"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SETTINGS_GROUPS } from "./settings-config";

const ICON_PATHS: Record<string, React.ReactNode> = {
  finance: <><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10.5h19M16 14.5h2.5" /></>,
  receipt: <><path d="M6 2.5h12v19l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z" /><path d="M9 8h6M9 12h6" /></>,
  kpi: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
  users: <><circle cx="9" cy="8" r="3.3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.3 3.3 0 0 1 0 6.4M21 20c0-2.5-1.4-4.7-3.5-5.6" /></>,
  customer: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" /><path d="M9 12l2 2 4-4" /></>,
  chat: <><path d="M21 11.4c0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L4 20.5l1.2-3.7A7.3 7.3 0 0 1 3 11.4C3 7.2 7 3.8 12 3.8s9 3.4 9 7.6Z" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.4" /><path d="M21 16l-5-5-8 8" /></>,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7.5 9 6 9-6" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  template: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  cms: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  audit: <><path d="M4 6h9M4 12h6M4 18h6" /><circle cx="17.5" cy="15.5" r="3.5" /><path d="M17.5 14v1.6l1.2 1" /></>,
  privacy: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" /><circle cx="12" cy="11" r="1.6" /><path d="M12 12.6V15" /></>,
  backup: <><path d="M12 3v11M12 14l-3.5-3.5M12 14l3.5-3.5" /><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
};

function CardIcon({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-forest-deep)]/8 text-[color:var(--color-forest-deep)]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        {ICON_PATHS[name] ?? ICON_PATHS.clock}
      </svg>
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
                  <CardIcon name={c.icon} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{c.title}</span>
                      {c.superAdminOnly && <span aria-hidden className="text-xs">🔒</span>}
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
