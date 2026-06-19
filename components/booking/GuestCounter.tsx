"use client";

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  hint?: string;
};

export function GuestCounter({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  hint,
}: Props) {
  const canDec = value > min;
  const canInc = value < max;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[color:var(--color-ink)]">
          {label}
        </div>
        {hint ? (
          <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`ลด ${label}`}
          onClick={() => canDec && onChange(value - 1)}
          disabled={!canDec}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-lg leading-none text-neutral-700 transition-colors hover:border-[color:var(--color-forest-deep)] hover:text-[color:var(--color-forest-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <div className="w-6 text-center text-base font-medium tabular-nums">
          {value}
        </div>
        <button
          type="button"
          aria-label={`เพิ่ม ${label}`}
          onClick={() => canInc && onChange(value + 1)}
          disabled={!canInc}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-lg leading-none text-neutral-700 transition-colors hover:border-[color:var(--color-forest-deep)] hover:text-[color:var(--color-forest-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
