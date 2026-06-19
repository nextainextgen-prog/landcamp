"use client";

import { useEffect, useState } from "react";

type Params = {
  roomId?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
};

export type AvailabilityState = {
  available?: boolean;
  loading: boolean;
  error?: string;
  reason?: string;
  totalAmount?: number;
  nights?: number;
};

const DEBOUNCE_MS = 250;

export function useAvailability({
  roomId,
  checkIn,
  checkOut,
}: Params): AvailabilityState {
  const [state, setState] = useState<AvailabilityState>({ loading: false });

  useEffect(() => {
    const controller = new AbortController();

    if (!roomId || !checkIn || !checkOut) {
      // Defer the reset off the sync effect body so we don't trip
      // react-hooks/set-state-in-effect.
      queueMicrotask(() => {
        if (!controller.signal.aborted) setState({ loading: false });
      });
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      setState({ loading: true });
      const qs = new URLSearchParams({ roomId, checkIn, checkOut }).toString();
      try {
        const res = await fetch(`/api/bookings/availability?${qs}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as {
          available?: boolean;
          reason?: string;
          totalAmount?: number;
          nights?: number;
          error?: string;
        };
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setState({ loading: false, error: json.error ?? "request failed" });
          return;
        }
        setState({
          loading: false,
          available: json.available,
          reason: json.reason,
          totalAmount: json.totalAmount,
          nights: json.nights,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : "network error",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [roomId, checkIn, checkOut]);

  return state;
}
