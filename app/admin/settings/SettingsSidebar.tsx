"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AdminRole } from "@/lib/admin/sections";
import { SettingIcon } from "./settings-icons";
import { SETTINGS_GROUPS, type SettingCard } from "./settings-config";

function isExternal(href?: string) {
  return Boolean(href) && !href!.startsWith("/admin/settings");
}

/** True when `href` is the current settings section (exact or nested). */
function useActiveHref(pathname: string) {
  return (href?: string) => {
    if (!href) return false;
    if (href === "/admin/settings") return pathname === "/admin/settings";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

/**
 * Persistent settings navigation. Rendered by app/admin/settings/layout.tsx so
 * it stays visible on every settings sub-page (no more bouncing back to the hub
 * to switch sections). Desktop = sticky sidebar; mobile = horizontal tab strip.
 */
export function SettingsSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const isActive = useActiveHref(pathname);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const norm = q.trim().toLowerCase();

  const groups = useMemo(() => {
    return SETTINGS_GROUPS.map((g, i) => ({
      label: g.label,
      id: `set-grp-${i}`,
      cards: g.cards
        .filter((c) => role === "super_admin" || !c.superAdminOnly)
        .filter((c) => !norm || `${c.title} ${c.desc}`.toLowerCase().includes(norm)),
    })).filter((g) => g.cards.length > 0);
  }, [norm, role]);

  // ⌘K / Ctrl+K focuses the search box (matches the old hub behaviour).
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

  const overviewActive = pathname === "/admin/settings";

  return (
    <>
      {/* ── Mobile: horizontal tab strip ── */}
      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="หมวดการตั้งค่า">
        <MobileTab href="/admin/settings" icon="gear" label="ภาพรวม" active={overviewActive} />
        {groups.flatMap((g) =>
          g.cards.map((c) => (
            <MobileTab key={c.title} href={c.href} icon={c.icon} label={c.title} active={isActive(c.href)} external={isExternal(c.href)} />
          )),
        )}
      </nav>

      {/* ── Desktop: sticky sidebar ── */}
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
          {/* Overview / hub link */}
          <Link
            href="/admin/settings"
            title="ภาพรวมทั้งหมด"
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors ${collapsed ? "justify-center" : ""} ${
              overviewActive
                ? "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]"
                : "text-[color:var(--color-ink)]/65 hover:bg-[color:var(--color-bone-soft)]/60 hover:text-[color:var(--color-forest-deep)]"
            }`}
          >
            <SettingIcon name="gear" className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="flex-1 truncate">ภาพรวมทั้งหมด</span>}
          </Link>

          {groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-0.5">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]/35">
                  {g.label}
                </div>
              )}
              {g.cards.map((c) => (
                <SidebarItem key={c.title} card={c} active={isActive(c.href)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarItem({ card: c, active, collapsed }: { card: SettingCard; active: boolean; collapsed: boolean }) {
  const cls = `group/navitem flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors ${
    collapsed ? "justify-center" : ""
  } ${active ? "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]" : "text-[color:var(--color-ink)]/65 hover:bg-[color:var(--color-bone-soft)]/60 hover:text-[color:var(--color-forest-deep)]"}`;
  const label = !collapsed && (
    <>
      <span className="flex-1 truncate">{c.title}</span>
      {isExternal(c.href) && <SettingIcon name="external" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/30" />}
      {c.superAdminOnly && <SettingIcon name="lock" className="h-3.5 w-3.5 text-[color:var(--color-ink)]/30" />}
    </>
  );
  if (!c.href) {
    return (
      <span title={`${c.title} — เร็ว ๆ นี้`} className={`${cls} cursor-not-allowed opacity-50`}>
        <SettingIcon name={c.icon} className="h-[18px] w-[18px] shrink-0" />
        {label}
      </span>
    );
  }
  return (
    <Link href={c.href} title={c.title} className={cls}>
      <SettingIcon name={c.icon} className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}

function MobileTab({
  href,
  icon,
  label,
  active,
  external,
}: {
  href?: string;
  icon: string;
  label: string;
  active?: boolean;
  external?: boolean;
}) {
  const cls = `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "border-[color:var(--color-warm-clay)]/40 bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)]"
      : "border-[color:var(--color-forest-deep)]/12 bg-white text-[color:var(--color-ink)]/65"
  }`;
  if (!href) return <span className={`${cls} cursor-not-allowed opacity-50`}><SettingIcon name={icon} className="h-4 w-4" />{label}</span>;
  return (
    <Link href={href} className={cls}>
      <SettingIcon name={icon} className="h-4 w-4" />
      {label}
      {external && <SettingIcon name="external" className="h-3 w-3 opacity-50" />}
    </Link>
  );
}
