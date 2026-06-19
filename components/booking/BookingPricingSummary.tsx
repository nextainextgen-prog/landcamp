"use client";

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export const EXTRA_BED_PER_NIGHT = 1500;

type Props = {
  basePrice: number;
  nights: number;
  extraBed: boolean;
};

export function BookingPricingSummary({ basePrice, nights, extraBed }: Props) {
  // Wave 3 placeholder math. codex-2 will replace with a real pricing hook
  // that handles weekday/weekend split and live tax/fee logic.
  const baseTotal = basePrice * Math.max(0, nights);
  const extraBedTotal = extraBed ? EXTRA_BED_PER_NIGHT * Math.max(0, nights) : 0;
  const grandTotal = baseTotal + extraBedTotal;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-[color:var(--color-bone-soft)]/40 p-5">
      <div className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/65">
        สรุปราคา
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-[color:var(--color-ink)]/75">
            {THB.format(basePrice)} × {nights || 0} คืน
          </dt>
          <dd className="font-medium tabular-nums">{THB.format(baseTotal)}</dd>
        </div>
        {extraBed ? (
          <div className="flex items-center justify-between">
            <dt className="text-[color:var(--color-ink)]/75">
              เตียงเสริม {THB.format(EXTRA_BED_PER_NIGHT)} × {nights || 0} คืน
            </dt>
            <dd className="font-medium tabular-nums">
              {THB.format(extraBedTotal)}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3">
        <span className="text-sm font-medium text-[color:var(--color-forest-deep)]">
          รวมทั้งหมด
        </span>
        <span className="font-display text-xl text-[color:var(--color-forest-deep)] tabular-nums">
          {THB.format(grandTotal)}
        </span>
      </div>
    </div>
  );
}
