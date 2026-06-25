"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SETTINGS_GROUPS } from "./settings-config";

const ICON_PATHS: Record<string, ReactNode> = {
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
  // chrome
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 8 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 14H4a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 5.7 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 16 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
};

function SettingIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {ICON_PATHS[name] ?? ICON_PATHS.clock}
    </svg>
  );
}

export function SettingsHub({ role }: { role: AdminRole }) {
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
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

  // ⌘K / Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCollapsed(false);
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll-spy: highlight the sub-nav group nearest the top of the viewport.
  useEffect(() => {
    const ids = groups.map((g) => g.id);
    if (ids.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [groups]);

  return (
    <div className="flex gap-6">
      {/* ── Left sub-sidebar ── */}
      <aside
        className={`sticky top-4 hidden max-h-[calc(100vh-2rem)] shrink-0 flex-col self-start overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white/70 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)] backdrop-blur transition-[width] duration-200 lg:flex ${collapsed ? "w-[64px]" : "w-60"}`}
      >
        <div className="flex items-center gap-2 border-b border-[color:var(--color-forest-deep)]/8 p-2.5">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="ค้นหา"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--color-ink)]/45 hover:bg-[color:var(--color-bone-soft)]/60"
            >
              <SettingIcon name="search" className="h-4 w-4" />
            </button>
          ) : (
            <div className="relative flex-1">
              <SettingIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink)]/35" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหา settings (⌘K)"
                className="w-full rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-[color:var(--color-bone-soft)]/40 py-2 pl-8 pr-2.5 text-xs outline-none focus:border-[color:var(--color-warm-clay)]/45 focus:bg-white"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--color-ink)]/40 hover:bg-[color:var(--color-bone-soft)]/60"
          >
            <SettingIcon name={collapsed ? "chevronRight" : "chevronLeft"} className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-4 overflow-y-auto p-2.5">
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-0.5">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]/35">
                  {g.label}
                </div>
              )}
              {g.cards.map((c) => {
                const isActive = active === g.id;
                const cls = `group/navitem flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${isActive ? "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-ink)]/65 hover:bg-[color:var(--color-bone-soft)]/60 hover:text-[color:var(--color-forest-deep)]"}`;
                const label = !collapsed && (
                  <>
                    <span className="flex-1 truncate">{c.title}</span>
                    {c.superAdminOnly && <SettingIcon name="lock" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/30" />}
                  </>
                );
                return c.href ? (
                  <Link key={c.title} href={c.href} title={c.title} className={cls}>
                    <SettingIcon name={c.icon} className="h-[18px] w-[18px] shrink-0" />
                    {label}
                  </Link>
                ) : (
                  <span key={c.title} title={`${c.title} — เร็ว ๆ นี้`} className={`${cls} cursor-not-allowed opacity-50`}>
                    <SettingIcon name={c.icon} className="h-[18px] w-[18px] shrink-0" />
                    {label}
                  </span>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Right content ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-7">
        <header className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-ink)]/45">
            <SettingIcon name="gear" className="h-3.5 w-3.5" /> ตั้งค่าระบบ
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[color:var(--color-forest-deep)]">ตั้งค่าระบบ</h1>
          <p className="text-sm text-[color:var(--color-ink)]/55">
            การเงิน · ผู้ใช้ &amp; สิทธิ์ · แจ้งเตือน · เนื้อหาเว็บ · เชื่อมต่อ — กดที่การ์ดเพื่อเปิดหน้าตั้งค่านั้น
          </p>
        </header>

        {/* Mobile search (sub-sidebar is hidden on small screens) */}
        <div className="relative lg:hidden">
          <SettingIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink)]/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาการตั้งค่า…"
            className="w-full rounded-xl border border-[color:var(--color-forest-deep)]/12 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--color-warm-clay)]/45"
          />
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-forest-deep)]/15 bg-white/50 px-6 py-16 text-center text-sm text-[color:var(--color-ink)]/45">
            ไม่พบการตั้งค่าที่ค้นหา “{q}”
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.id} id={g.id} className="flex scroll-mt-24 flex-col gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink)]/40">{g.label}</h3>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {g.cards.map((c) => (
                  <SettingCard key={c.title} card={c} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
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
  const base =
    "group/card flex items-start gap-3.5 rounded-2xl border bg-white p-4 shadow-[0_14px_36px_-28px_rgba(45,55,40,0.4)]";
  return c.href ? (
    <Link
      href={c.href}
      className={`${base} border-[color:var(--color-forest-deep)]/8 transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-warm-clay)]/40 hover:shadow-[0_22px_50px_-30px_rgba(45,55,40,0.5)]`}
    >
      {inner}
    </Link>
  ) : (
    <div className={`${base} cursor-not-allowed border-dashed border-[color:var(--color-forest-deep)]/12 opacity-70`}>{inner}</div>
  );
}
