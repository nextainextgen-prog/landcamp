"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SETTINGS_GROUPS } from "./settings-config";
import { SettingIcon } from "./settings-icons";

/**
 * Settings landing / overview. The persistent section sidebar now lives in
 * app/admin/settings/layout.tsx, so this is purely the welcome card grid shown
 * at /admin/settings — a visual index of every section.
 */
export function SettingsHub({ role }: { role: AdminRole }) {
  const [q, setQ] = useState("");
  const norm = q.trim().toLowerCase();

  const groups = useMemo(() => {
    return SETTINGS_GROUPS.map((g, i) => ({
      ...g,
      id: `set-grp-${i}`,
      cards: g.cards
        .filter((c) => role === "super_admin" || !c.superAdminOnly)
        .filter((c) => !norm || `${c.title} ${c.desc}`.toLowerCase().includes(norm)),
    })).filter((g) => g.cards.length > 0);
  }, [norm, role]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-7">
      <header className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-ink)]/45">
          <SettingIcon name="gear" className="h-3.5 w-3.5" /> ตั้งค่าระบบ
        </span>
        <h1 className="font-display text-3xl font-semibold leading-tight text-[color:var(--color-forest-deep)]">ตั้งค่าระบบ</h1>
        <p className="text-sm text-[color:var(--color-ink)]/55">
          การเงิน · ผู้ใช้ &amp; สิทธิ์ · แจ้งเตือน · เนื้อหาเว็บ · เชื่อมต่อ — เลือกหมวดจากแถบด้านซ้าย หรือกดที่การ์ดด้านล่าง
        </p>
      </header>

      {/* Quick filter for the overview cards */}
      <div className="relative">
        <SettingIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink)]/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาการตั้งค่า…"
          className="w-full rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--color-warm-clay)]/45 sm:max-w-md"
        />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-forest-deep)]/15 bg-white px-6 py-16 text-center text-sm text-[color:var(--color-ink)]/45">
          ไม่พบการตั้งค่าที่ค้นหา “{q}”
        </div>
      ) : (
        // One unified white panel (matches the shared <Panel> look used on every
        // other admin page) instead of a grid of floating cards. rounded-2xl +
        // border width are kept exactly as the cards used.
        <div className="overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
          {groups.map((g, gi) => (
            <section key={g.id} id={g.id} className="scroll-mt-24">
              <h3
                className={`border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink)]/40 ${
                  gi > 0 ? "border-t" : ""
                }`}
              >
                {g.label}
              </h3>
              <div>
                {g.cards.map((c) => (
                  <SettingCard key={c.title} card={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingCard({ card: c }: { card: (typeof SETTINGS_GROUPS)[number]["cards"][number] }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-forest-deep)]/[0.06] text-[color:var(--color-warm-clay)] transition-colors group-hover/card:bg-[color:var(--color-warm-clay)]/12">
        <SettingIcon name={c.icon} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{c.title}</span>
          {c.superAdminOnly && <SettingIcon name="lock" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/35" />}
          {!c.href && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">เร็ว ๆ นี้</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-[color:var(--color-ink)]/55">{c.desc}</p>
      </div>
    </>
  );
  // A continuous row inside the unified panel: no per-card border/radius/shadow;
  // a hairline border-t divides rows (the first row in each group has none, so it
  // tucks under the group header).
  const base =
    "group/card flex items-start gap-3.5 border-t border-[color:var(--color-forest-deep)]/8 bg-white px-5 py-4 first:border-t-0";
  return c.href ? (
    <Link
      href={c.href}
      className={`${base} transition-colors hover:bg-[color:var(--color-bone-soft)]/40`}
    >
      {inner}
    </Link>
  ) : (
    <div className={`${base} cursor-not-allowed opacity-70`}>{inner}</div>
  );
}
