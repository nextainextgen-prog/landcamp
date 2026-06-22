export type PricingInput = {
  basePrice: number;
  nights: number;
  adults: number;
  children: number;
  extraBed: boolean;
  isWeekendNights?: number;
};

export type PricingResult = {
  subtotal: number;
  extraBedTotal: number;
  weekendSurcharge: number;
  total: number;
};

const EXTRA_BED_PER_NIGHT = 750;
const WEEKEND_SURCHARGE_RATE = 0.2;

export function calculateTotal({
  basePrice,
  nights,
  extraBed,
  isWeekendNights = 0,
}: PricingInput): PricingResult {
  const subtotal = basePrice * nights;
  const extraBedTotal = extraBed ? EXTRA_BED_PER_NIGHT * nights : 0;
  const weekendSurcharge = basePrice * WEEKEND_SURCHARGE_RATE * isWeekendNights;
  const total = subtotal + extraBedTotal + weekendSurcharge;

  return { subtotal, extraBedTotal, weekendSurcharge, total };
}

// ─────────────────────────────────────────────
// Two-tier nightly pricing (matches rooms.price_weekday / price_weekend)
// ─────────────────────────────────────────────

export type BookingPricingInput = {
  priceWeekday: number;
  priceWeekend: number;
  /** YYYY-MM-DD, inclusive */
  checkIn: string;
  /** YYYY-MM-DD, exclusive (hotel checkout day is not charged) */
  checkOut: string;
  extraBed: boolean;
};

export type BookingPricingResult = {
  nights: number;
  weekendNights: number;
  baseAmount: number;
  extraBedAmount: number;
  totalAmount: number;
};

function toUtcDate(iso: string): number {
  return Date.UTC(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8, 10)),
  );
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * A "weekend night" is a stay night beginning on Friday or Saturday — the
 * higher-priced nights in Thai resort pricing. `getUTCDay()`: Fri = 5, Sat = 6.
 */
function isWeekendNight(utcMs: number): boolean {
  const day = new Date(utcMs).getUTCDay();
  return day === 5 || day === 6;
}

/**
 * Prices a stay night-by-night using the room's weekday/weekend rates, plus a
 * flat extra-bed charge per night. All amounts are integer THB to match the
 * `bookings` money columns.
 */
export function calculateBookingTotal({
  priceWeekday,
  priceWeekend,
  checkIn,
  checkOut,
  extraBed,
}: BookingPricingInput): BookingPricingResult {
  const start = toUtcDate(checkIn);
  const end = toUtcDate(checkOut);

  let baseAmount = 0;
  let nights = 0;
  let weekendNights = 0;

  for (let cursor = start; cursor < end; cursor += MS_PER_DAY) {
    if (isWeekendNight(cursor)) {
      baseAmount += priceWeekend;
      weekendNights += 1;
    } else {
      baseAmount += priceWeekday;
    }
    nights += 1;
  }

  const extraBedAmount = extraBed ? EXTRA_BED_PER_NIGHT * nights : 0;

  return {
    nights,
    weekendNights,
    baseAmount,
    extraBedAmount,
    totalAmount: baseAmount + extraBedAmount,
  };
}
