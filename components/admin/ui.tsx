import type { ReactNode } from "react";

/**
 * Shared backoffice UI primitives, themed with the LandCamp CI palette
 * (forest / sage / warm-clay / bone). Pure presentational — safe in both
 * server and client components.
 */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[color:var(--color-forest-deep)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[color:var(--color-ink)]/55">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  icon,
  actions,
  children,
  bodyClassName = "",
  className = "",
}: {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)] ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-[color:var(--color-forest-deep)]/8 bg-[color:var(--color-bone-soft)]/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-[color:var(--color-warm-clay)]">{icon}</span>}
            <h2 className="text-sm font-semibold text-[color:var(--color-forest-deep)]">{title}</h2>
          </div>
          {actions}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "forest",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "forest" | "clay" | "sage" | "ink";
}) {
  const toneBar: Record<string, string> = {
    forest: "bg-[color:var(--color-forest-deep)]",
    clay: "bg-[color:var(--color-warm-clay)]",
    sage: "bg-[color:var(--color-sage-mid)]",
    ink: "bg-[color:var(--color-ink)]",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-white p-5 shadow-[0_18px_44px_-30px_rgba(45,55,40,0.35)]">
      <span className={`absolute inset-y-0 left-0 w-1 ${toneBar[tone]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink)]/45">
            {label}
          </span>
          <span className="font-display text-[28px] font-semibold leading-none text-[color:var(--color-forest-deep)]">
            {value}
          </span>
          {sub && <span className="mt-1 text-xs text-[color:var(--color-ink)]/55">{sub}</span>}
        </div>
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-bone-soft)]/70 text-[color:var(--color-warm-clay)]">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  clay: "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)] ring-[color:var(--color-warm-clay)]/25",
  forest: "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)] ring-[color:var(--color-forest-deep)]/20",
  sage: "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)] ring-[color:var(--color-sage-mid)]/30",
  neutral: "bg-[color:var(--color-ink)]/8 text-[color:var(--color-ink)]/60 ring-[color:var(--color-ink)]/15",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  blue: "bg-blue-100 text-blue-800 ring-blue-200",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-forest-deep)]/20 bg-[color:var(--color-bone-soft)]/30 px-6 py-12 text-center text-sm text-[color:var(--color-ink)]/55">
      {children}
    </div>
  );
}

/** Thin styled wrapper around a native table for consistent admin tables. */
export function DataTable({
  head,
  children,
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[color:var(--color-forest-deep)]/10">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--color-bone-soft)]/50 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-forest-deep)]/65">
          {head}
        </thead>
        <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">{children}</tbody>
      </table>
    </div>
  );
}
