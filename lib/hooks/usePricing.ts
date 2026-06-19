"use client";

import { useMemo } from "react";
import { calculateTotal, type PricingResult } from "@/lib/booking/pricing";

type Params = {
  basePrice: number;
  nights: number;
  adults: number;
  children: number;
  extraBed: boolean;
  isWeekendNights?: number;
};

export function usePricing({
  basePrice,
  nights,
  adults,
  children,
  extraBed,
  isWeekendNights = 0,
}: Params): PricingResult {
  return useMemo(
    () =>
      calculateTotal({
        basePrice,
        nights,
        adults,
        children,
        extraBed,
        isWeekendNights,
      }),
    [basePrice, nights, adults, children, extraBed, isWeekendNights],
  );
}
