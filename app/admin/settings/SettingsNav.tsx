"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SETTINGS_GROUPS } from "./settings-config";

/** Settings-specific left navigation (grouped list + search + active state). */
export function SettingsNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
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
    <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาการตั้งค่า…"
        className="w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)]/40 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-warm-clay)]"
      />

      <nav className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]/40">
              {g.label}
            </div>
            {g.cards.map((c) => {
              const active = c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`));
              if (!c.href) {
                return (
                  <span
                    key={c.title}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-[color:var(--color-ink)]/35"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                      เร็ว ๆ นี้
                    </span>
                  </span>
                );
              }
              return (
                <Link
                  key={c.title}
                  href={c.href}
                  className={
                    active
                      ? "flex items-center gap-2 rounded-lg bg-[color:var(--color-warm-clay)]/12 px-2 py-1.5 text-sm font-medium text-[color:var(--color-warm-clay)]"
                      : "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[color:var(--color-forest-deep)]/80 hover:bg-[color:var(--color-bone-soft)]"
                  }
                >
                  <span className="truncate">{c.title}</span>
                  {c.superAdminOnly && <span aria-hidden className="ml-auto text-xs">🔒</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
