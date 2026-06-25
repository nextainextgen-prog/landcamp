import type { ReactNode } from "react";

export type TimelineItem = {
  kind: "booking" | "contact" | "note";
  at: string;
  title: string;
  detail?: string;
};

const META: Record<TimelineItem["kind"], { label: string; dot: string; icon: ReactNode }> = {
  booking: {
    label: "การจอง",
    dot: "bg-[color:var(--color-forest-deep)]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-3.5 w-3.5">
        <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
  },
  contact: {
    label: "ติดต่อ",
    dot: "bg-[color:var(--color-warm-clay)]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-3.5 w-3.5">
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  note: {
    label: "โน้ต",
    dot: "bg-[color:var(--color-sage-mid)]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-3.5 w-3.5">
        <path d="M4 4h16v12l-4 4H4z" /><path d="M16 20v-4h4" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col gap-0 p-5">
      {items.map((it, i) => {
        const meta = META[it.kind];
        const last = i === items.length - 1;
        return (
          <li key={`${it.kind}-${it.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute left-[11px] top-6 h-full w-px bg-[color:var(--color-forest-deep)]/10" aria-hidden />}
            <span className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white ${meta.dot}`}>
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[color:var(--color-ink)]/85">{it.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[color:var(--color-ink)]/45">
                <span className="font-medium text-[color:var(--color-ink)]/55">{meta.label}</span>
                {it.detail && <span>· {it.detail}</span>}
                <span>· {when(it.at)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
