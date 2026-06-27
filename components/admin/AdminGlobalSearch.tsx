"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  filterAdminIndex,
  highlightMatch,
  type SearchEntry,
} from "@/lib/admin/search-index";

/* Record-level hit from /api/admin/search (customers + bookings). */
type DataHit = {
  id: string;
  kind: "customer" | "booking";
  title: string;
  subtitle: string;
  href: string;
};

/* A single keyboard-navigable row — either a page from the static index or a
   customer/booking record. The two streams share one selection cursor. */
type Flat =
  | { type: "page"; entry: SearchEntry }
  | { type: "data"; hit: DataHit };

const MAX_PAGES = 8;
const MAX_DATA = 6;

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    page: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    customer: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
    booking: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    enter: <><path d="M9 10 5 14l4 4" /><path d="M5 14h11a4 4 0 0 0 4-4V6" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name] ?? null}
    </svg>
  );
}

/* Shared search state: page index (instant) + record search (debounced API). */
function useGlobalSearch(onNavigate?: () => void) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DataHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);

  const pages = useMemo(() => filterAdminIndex(query, MAX_PAGES), [query]);

  // Debounced customer/booking lookup — same endpoint the topbar used before.
  // Stale hits are cleared in the query setters, so the effect body never calls
  // setState synchronously (only inside the async timeout below).
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { items?: DataHit[] };
          setHits((json.items ?? []).slice(0, MAX_DATA));
        }
      } catch {
        /* aborted / transient — keep last good list */
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  // Group pages by section while assigning each a running index that matches the
  // visual order, so Arrow Up/Down lines up with what the eye sees.
  const pageGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, SearchEntry[]>();
    for (const e of pages) {
      if (!map.has(e.section)) {
        map.set(e.section, []);
        order.push(e.section);
      }
      map.get(e.section)!.push(e);
    }
    let i = 0;
    return order.map((section) => ({
      section,
      items: map.get(section)!.map((entry) => ({ entry, idx: i++ })),
    }));
  }, [pages]);

  const pageCount = useMemo(
    () => pageGroups.reduce((n, g) => n + g.items.length, 0),
    [pageGroups],
  );

  const flat: Flat[] = useMemo(
    () => [
      ...pageGroups.flatMap((g) => g.items.map((it) => ({ type: "page" as const, entry: it.entry }))),
      ...hits.map((hit) => ({ type: "data" as const, hit })),
    ],
    [pageGroups, hits],
  );

  // Cursor is reset to the top whenever the query changes (handled in the query
  // setters below), so no setState-in-effect is needed to keep it in range.
  const changeQuery = useCallback((value: string) => {
    setQuery(value);
    setActive(0);
    setHits([]); // drop stale records immediately; the effect refetches after debounce
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setActive(0);
    setHits([]);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setQuery("");
      setHits([]);
      setActive(0);
      onNavigate?.();
      router.push(href);
    },
    [router, onNavigate],
  );

  const navigateActive = useCallback(() => {
    const item = flat[Math.min(active, flat.length - 1)];
    if (!item) return;
    navigate(item.type === "page" ? item.entry.href : item.hit.href);
  }, [flat, active, navigate]);

  return {
    query,
    changeQuery,
    clearQuery,
    pageGroups,
    pageCount,
    hits,
    flat,
    active,
    setActive,
    searching,
    navigate,
    navigateActive,
  };
}

type SearchCore = ReturnType<typeof useGlobalSearch>;

/* The results dropdown body, shared by the desktop dropdown and mobile sheet. */
function Results({ core }: { core: SearchCore }) {
  const { query, pageGroups, pageCount, hits, active, setActive, searching, navigate } = core;
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the highlighted row in view while arrow-keying.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!query.trim()) return null;

  const empty = pageCount === 0 && hits.length === 0;

  return (
    <div className="max-h-[min(70vh,520px)] overflow-y-auto py-1.5">
      {empty ? (
        <div className="px-4 py-8 text-center text-sm text-[color:var(--color-ink)]/45">
          {searching ? "กำลังค้นหา…" : "ไม่พบผลลัพธ์"}
        </div>
      ) : (
        <>
          {pageGroups.map((g) => (
            <div key={g.section} className="mb-1 last:mb-0">
              <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]/40">
                {g.section}
              </div>
              {g.items.map(({ entry, idx }) => (
                <button
                  key={entry.href}
                  ref={idx === active ? activeRef : undefined}
                  type="button"
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => navigate(entry.href)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    idx === active ? "bg-[color:var(--color-bone-soft)]" : "hover:bg-[color:var(--color-bone-soft)]/60",
                  )}
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)]/[0.06] text-[color:var(--color-warm-clay)]">
                    <Icon name="page" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--color-forest-deep)]">
                    {highlightMatch(entry.label, query).map((c, i) =>
                      c.hit ? (
                        <mark key={i} className="rounded bg-[color:var(--color-warm-clay)]/20 px-0.5 text-[color:var(--color-warm-clay)]">
                          {c.text}
                        </mark>
                      ) : (
                        <span key={i}>{c.text}</span>
                      ),
                    )}
                  </span>
                  {idx === active && (
                    <Icon name="enter" className="h-4 w-4 flex-shrink-0 text-[color:var(--color-ink)]/30" />
                  )}
                </button>
              ))}
            </div>
          ))}

          {hits.length > 0 && (
            <div className="mt-1 border-t border-[color:var(--color-forest-deep)]/8 pt-1">
              <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]/40">
                ลูกค้า / การจอง
              </div>
              {hits.map((h, j) => {
                const idx = pageCount + j;
                return (
                  <button
                    key={`${h.kind}-${h.id}`}
                    ref={idx === active ? activeRef : undefined}
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => navigate(h.href)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      idx === active ? "bg-[color:var(--color-bone-soft)]" : "hover:bg-[color:var(--color-bone-soft)]/60",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        h.kind === "customer" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      <Icon name={h.kind} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[color:var(--color-forest-deep)]">{h.title}</span>
                      <span className="block truncate text-[12px] text-[color:var(--color-ink)]/50">{h.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Global admin search. `variant="desktop"` renders an inline input with a
 * floating dropdown; `variant="mobile"` renders a search icon that opens a
 * full-width sheet under the topbar.
 */
export function AdminGlobalSearch({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const core = useGlobalSearch(close);
  const { query, changeQuery, clearQuery, navigateActive, flat, setActive } = core;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigateActive();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const inputCls =
    "w-full rounded-full border border-[color:var(--color-forest-deep)]/12 bg-white/70 py-2 pl-9 pr-3 text-sm text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink)]/35 focus:border-[color:var(--color-warm-clay)]/40 focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/15";

  /* ── Mobile: icon button → full-width sheet under the header ── */
  if (variant === "mobile") {
    return (
      <div ref={rootRef}>
        <button
          type="button"
          aria-label="ค้นหา"
          onClick={() => {
            setOpen((v) => !v);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-forest-deep)] transition-colors hover:bg-[color:var(--color-bone-soft)]"
        >
          <Icon name="search" />
        </button>
        {open && (
          <div className="absolute inset-x-0 top-16 z-50 border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone)]/95 px-4 py-3 backdrop-blur-md motion-safe:animate-[fadeIn_.15s_ease-out]">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
                <Icon name="search" className="h-4 w-4" />
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ค้นหาหน้า เมนู ลูกค้า การจอง…"
                className={inputCls}
              />
              <button
                type="button"
                aria-label="ปิด"
                onClick={() => {
                  clearQuery();
                  setOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--color-ink)]/45 hover:bg-[color:var(--color-bone-soft)]"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            {query.trim().length > 0 && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-xl shadow-black/5">
                <Results core={core} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop: inline input with floating dropdown ── */
  return (
    <div ref={rootRef} className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
        <Icon name="search" className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          changeQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="ค้นหาหน้า เมนู ลูกค้า การจอง…"
        className={clsx(inputCls, "w-[260px] transition-[width] focus:w-[320px] lg:w-[300px]")}
      />
      {open && query.trim().length > 0 && (
        <div className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-xl shadow-black/5 motion-safe:animate-[fadeIn_.15s_ease-out]">
          <Results core={core} />
        </div>
      )}
    </div>
  );
}
