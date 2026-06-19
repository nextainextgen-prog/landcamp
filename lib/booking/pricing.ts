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

const EXTRA_BED_PER_NIGHT = 1500;
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
