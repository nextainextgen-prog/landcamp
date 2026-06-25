"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { AdminRole } from "@/lib/admin/sections";
import { topbarMeta } from "@/lib/admin/topbar";

const SEEN_KEY = "lc_admin_notif_seen";
const POLL_MS = 60_000;

type Notice = {
  id: string;
  kind: "payment" | "booking" | "checkin" | "customer" | "lead";
  title: string;
  body: string;
  href: string;
  ts: string;
  priority?: boolean;
};

type Hit = {
  id: string;
  kind: "customer" | "booking";
  title: string;
  subtitle: string;
  href: string;
};

/* ── tiny inline icons ───────────────────────────────────────── */
function I({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    payment: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>,
    booking: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    checkin: <><path d="M20 6 9 17l-5-5" /></>,
    customer: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
    lead: <><path d="M4 4h16v12H5.2L4 17.2V4Z" /><path d="M8 9h8M8 12h5" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name] ?? null}
    </svg>
  );
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

const KIND_TINT: Record<Notice["kind"], string> = {
  payment: "bg-amber-100 text-amber-700",
  booking: "bg-emerald-100 text-emerald-700",
  checkin: "bg-sky-100 text-sky-700",
  customer: "bg-indigo-100 text-indigo-700",
  lead: "bg-rose-100 text-rose-700",
};

export function AdminTopbar({
  username,
  role,
  email,
  canSettings,
  onOpenMobileNav,
}: {
  username: string;
  role: AdminRole;
  email?: string | null;
  canSettings: boolean;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = topbarMeta(pathname);
  const roleLabel = role === "super_admin" ? "Super Admin" : "Admin";

  /* ── which dropdown is open ── */
  const [panel, setPanel] = useState<null | "bell" | "user" | "search">(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  /* ── notifications ── */
  const [notices, setNotices] = useState<Notice[]>([]);
  const [seenAt, setSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const stored = Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
    return Number.isFinite(stored) ? stored : 0;
  });

  const loadNotices = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store", signal });
      if (!res.ok) return;
      const json = (await res.json()) as { items?: Notice[] };
      setNotices(json.items ?? []);
    } catch {
      /* offline / transient — keep last good list */
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const id = window.setInterval(() => loadNotices(ctrl.signal), POLL_MS);
    // Initial fetch deferred to a microtask so no setState fires synchronously.
    queueMicrotask(() => loadNotices(ctrl.signal));
    return () => {
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [loadNotices]);

  const unread = useMemo(
    () => notices.filter((n) => new Date(n.ts).getTime() > seenAt).length,
    [notices, seenAt],
  );

  const openBell = () => {
    setPanel((p) => (p === "bell" ? null : "bell"));
    const now = Date.now();
    window.localStorage.setItem(SEEN_KEY, String(now));
    setSeenAt(now);
  };

  /* ── search ── */
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      if (q.length < 1) {
        setHits([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { items?: Hit[] };
          setHits(json.items ?? []);
        }
      } catch {
        /* aborted / transient */
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  const go = (href: string) => {
    setPanel(null);
    setQuery("");
    router.push(href);
  };

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const iconBtn =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]";

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-30 border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone)]/85 backdrop-blur-md"
    >
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        {/* mobile hamburger */}
        <button
          type="button"
          aria-label="menu"
          onClick={onOpenMobileNav}
          className="rounded-md p-2 text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)] md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
        </button>

        {/* title + subtitle */}
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-semibold leading-tight text-[color:var(--color-forest-deep)] md:text-lg">
            {meta.title}
          </h1>
          <p className="hidden truncate text-[12px] text-[color:var(--color-ink)]/50 sm:block">
            {meta.subtitle}
          </p>
        </div>

        {/* search */}
        <div className="relative ml-auto hidden md:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
            <I name="search" className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPanel("search");
            }}
            onFocus={() => setPanel("search")}
            placeholder="ค้นหาลูกค้า ชื่อ / เบอร์ / Email..."
            className="w-[260px] rounded-full border border-[color:var(--color-forest-deep)]/12 bg-white/70 py-2 pl-9 pr-3 text-sm text-[color:var(--color-ink)] outline-none transition-[width,box-shadow] placeholder:text-[color:var(--color-ink)]/35 focus:w-[320px] focus:border-[color:var(--color-warm-clay)]/40 focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15 lg:w-[300px]"
          />
          {panel === "search" && query.trim().length > 0 && (
            <div className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-xl shadow-black/5">
              {searching && hits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[color:var(--color-ink)]/45">กำลังค้นหา…</div>
              ) : hits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[color:var(--color-ink)]/45">ไม่พบผลลัพธ์</div>
              ) : (
                <ul className="max-h-[60vh] overflow-y-auto py-1">
                  {hits.map((h) => (
                    <li key={`${h.kind}-${h.id}`}>
                      <button
                        type="button"
                        onClick={() => go(h.href)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[color:var(--color-bone-soft)]"
                      >
                        <span className={clsx("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full", h.kind === "customer" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700")}>
                          <I name={h.kind} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{h.title}</span>
                          <span className="block truncate text-[12px] text-[color:var(--color-ink)]/50">{h.subtitle}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* bell */}
        <div className="relative md:ml-1">
          <button type="button" aria-label="การแจ้งเตือน" onClick={openBell} className={iconBtn}>
            <I name="bell" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-warm-clay)] px-1 text-[10px] font-semibold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {panel === "bell" && (
            <div className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-xl shadow-black/5">
              <div className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/8 px-4 py-3">
                <span className="text-sm font-semibold text-[color:var(--color-forest-deep)]">การแจ้งเตือน</span>
                {notices.length > 0 && (
                  <span className="text-[11px] text-[color:var(--color-ink)]/45">{notices.length} รายการ</span>
                )}
              </div>
              {notices.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[color:var(--color-ink)]/45">ยังไม่มีการแจ้งเตือน</div>
              ) : (
                <ul className="max-h-[68vh] overflow-y-auto py-1">
                  {notices.map((n) => {
                    const isUnread = new Date(n.ts).getTime() > seenAt;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => go(n.href)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--color-bone-soft)]"
                        >
                          <span className={clsx("mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full", KIND_TINT[n.kind])}>
                            <I name={n.kind} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{n.title}</span>
                              {isUnread && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--color-warm-clay)]" />}
                            </span>
                            <span className="block truncate text-[12px] text-[color:var(--color-ink)]/55">{n.body}</span>
                            <span className="mt-0.5 block text-[11px] text-[color:var(--color-ink)]/35">{relTime(n.ts)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* settings */}
        {canSettings && (
          <Link href="/admin/settings" aria-label="ตั้งค่าระบบ" className={clsx(iconBtn, "hidden sm:inline-flex")}>
            <I name="gear" />
          </Link>
        )}

        {/* user chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "user" ? null : "user"))}
            className={clsx(
              "flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-2.5 transition-all",
              panel === "user"
                ? "border-[color:var(--color-warm-clay)]/30 bg-[color:var(--color-warm-clay)]/[0.06]"
                : "border-[color:var(--color-forest-deep)]/10 bg-white/70 hover:bg-[color:var(--color-bone-soft)] hover:shadow-sm",
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-forest-deep)] to-[color:var(--color-forest-night)] text-sm font-semibold text-[color:var(--color-bone)] ring-1 ring-white/30">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[140px] truncate text-sm font-semibold text-[color:var(--color-forest-deep)]">{username}</span>
              <span className="block text-[11px] font-medium text-[color:var(--color-warm-clay)]">{roleLabel}</span>
            </span>
            <span className="text-[color:var(--color-ink)]/40">
              <I name="chevron" className={clsx("h-4 w-4 transition-transform", panel === "user" && "rotate-180")} />
            </span>
          </button>

          {panel === "user" && (
            <div className="absolute right-0 mt-2 w-[260px] overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-xl shadow-black/5">
              <div className="flex items-center gap-3 border-b border-[color:var(--color-forest-deep)]/8 px-4 py-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-forest-deep)] to-[color:var(--color-forest-night)] text-sm font-semibold text-[color:var(--color-bone)] ring-1 ring-white/30">
                  {username.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[color:var(--color-forest-deep)]">{username}</div>
                  {email && <div className="truncate text-[12px] text-[color:var(--color-ink)]/50">{email}</div>}
                  <span className="mt-1 inline-flex items-center rounded-full bg-[color:var(--color-warm-clay)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-warm-clay)]">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <div className="py-1">
                {canSettings && (
                  <Link href="/admin/settings/security" onClick={() => setPanel(null)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-ink)]/80 transition-colors hover:bg-[color:var(--color-bone-soft)]">
                    <I name="user" className="h-[17px] w-[17px]" />
                    บัญชีของฉัน
                  </Link>
                )}
                {canSettings && (
                  <Link href="/admin/settings" onClick={() => setPanel(null)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-ink)]/80 transition-colors hover:bg-[color:var(--color-bone-soft)]">
                    <I name="gear" className="h-[17px] w-[17px]" />
                    ตั้งค่าระบบ
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 border-t border-[color:var(--color-forest-deep)]/8 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <I name="logout" className="h-[17px] w-[17px]" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
