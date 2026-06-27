"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { SECTIONS, type AdminRole, type SectionKey } from "@/lib/admin/sections";
import { AdminTopbar } from "./AdminTopbar";
import { NavSpinner } from "./NavSpinner";

const SECTION_HREF: Record<SectionKey, string> = {
  bookings: "/admin/bookings",
  rooms: "/admin/rooms",
  content: "/admin/content",
  revenue: "/admin/revenue",
  customers: "/admin/customers",
  "payment-settings": "/admin/payment-settings",
  settings: "/admin/settings",
  users: "/admin/users",
};

// Extra nav entries that aren't permission sections of their own.
const EXTRA_TOP = [
  { key: "dashboard", label: "ภาพรวม", href: "/admin/dashboard" },
  { key: "calendar", label: "ปฏิทินการจอง", href: "/admin/calendar" },
  { key: "occupancy", label: "ห้องว่าง", href: "/admin/occupancy" },
  { key: "walkin", label: "จองห้องพัก", href: "/admin/walk-in" },
] as const;

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const p: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    bookings: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M14 13h3" /></>,
    occupancy: <><path d="M3 21V9l9-6 9 6v12" /><path d="M9 21v-6h6v6" /></>,
    rooms: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01" /></>,
    content: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    revenue: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
    customers: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.4M21 20c0-2.5-1.4-4.7-3.5-5.6" /></>,
    "payment-settings": <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
    users: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
    walkin: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M18 8v6M15 11h6" /></>,
    slips: <><path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" /><path d="M14 2v6h6M9 13l2 2 4-4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name] ?? null}
    </svg>
  );
}

type NavEntry = { key: string; label: string; href: string };

export function AdminShell({
  username,
  role,
  permissions,
  email,
  pendingReview = 0,
  children,
}: {
  username: string;
  role: AdminRole;
  permissions: SectionKey[];
  email?: string | null;
  pendingReview?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const can = (key: SectionKey) => role === "super_admin" || permissions.includes(key);

  // These live under "ตั้งค่าระบบ" instead of the main sidebar.
  const IN_SETTINGS = new Set<SectionKey>(["users", "payment-settings", "content"]);

  // Build nav: extras (dashboard/calendar/occupancy gated by bookings access) + sections.
  const overview: NavEntry[] = can("bookings") ? [...EXTRA_TOP] : [];
  const sectionItems: NavEntry[] = SECTIONS.filter((s) => can(s.key) && !IN_SETTINGS.has(s.key)).map((s) => ({
    key: s.key,
    label: s.label,
    href: SECTION_HREF[s.key],
  }));
  // "ประวัติสลิป" isn't a permission section of its own — gate it on bookings
  // access and slot it directly after "รายได้" (revenue).
  if (can("bookings")) {
    const slips: NavEntry = { key: "slips", label: "ประวัติสลิป", href: "/admin/slips" };
    const revenueIdx = sectionItems.findIndex((s) => s.key === "revenue");
    if (revenueIdx >= 0) sectionItems.splice(revenueIdx + 1, 0, slips);
    else sectionItems.push(slips);
  }
  // Pin "ลูกค้า" (customers) to the top of the "จัดการ" group. Reordered here
  // rather than in lib/admin/sections.ts so the permission checkbox list in
  // UsersManager (which maps over SECTIONS) keeps its original order.
  const customersIdx = sectionItems.findIndex((s) => s.key === "customers");
  if (customersIdx > 0) {
    const [customers] = sectionItems.splice(customersIdx, 1);
    sectionItems.unshift(customers);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const navList = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      <NavGroup label="ภาพรวม" items={overview} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      <NavGroup label="จัดการ" items={sectionItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[color:var(--color-bone)] text-[color:var(--color-ink)]">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] md:flex">
        <SidebarHead />
        {navList}
        <SidebarFoot username={username} role={role} onLogout={logout} />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="close menu" className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)]">
            <SidebarHead />
            {navList}
            <SidebarFoot username={username} role={role} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          username={username}
          role={role}
          email={email}
          canSettings={can("settings")}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );

  function NavGroup({
    label,
    items,
    pathname,
    onNavigate,
  }: {
    label: string;
    items: NavEntry[];
    pathname: string;
    onNavigate: () => void;
  }) {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-1">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-bone)]/35">
          {label}
        </div>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[color:var(--color-warm-clay)] text-white"
                  : "text-[color:var(--color-bone)]/70 hover:bg-white/8 hover:text-[color:var(--color-bone)]",
              )}
            >
              <Icon name={item.key} />
              <span className="flex-1">{item.label}</span>
              {item.key === "bookings" && pendingReview > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] px-1.5 text-[10px] font-semibold text-white">
                  {pendingReview}
                </span>
              )}
              <NavSpinner />
            </Link>
          );
        })}
      </div>
    );
  }
}

function SidebarHead() {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <div className="font-serif text-[1.6rem] font-medium leading-none text-[color:var(--color-bone)]">LandCamp</div>
    </div>
  );
}

function SidebarFoot({
  username,
  role,
  onLogout,
}: {
  username: string;
  role: AdminRole;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-white/10 p-3">
      <div className="mb-1 flex items-center gap-2.5 px-2 py-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[color:var(--color-bone)]">
          {username.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-[color:var(--color-bone)]">{username}</div>
          <div className="text-[10px] text-[color:var(--color-bone)]/40">
            {role === "super_admin" ? "Super Admin" : "Admin"}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[color:var(--color-bone)]/60 transition-colors hover:bg-white/8 hover:text-[color:var(--color-bone)]"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
