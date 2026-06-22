"use client";

import { useEffect, useState } from "react";

export type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "available"; nights: number }
  | { status: "unavailable"; reason: string }
  | { status: "error"; message: string };

const DEBOUNCE_MS = 350;

/**
 * Checks whether a room's dates are free via /api/bookings/availability.
 * Debounced and abortable so rapid date edits don't race. Pricing is computed
 * client-side from the room rates (so extra-bed shows instantly); this hook
 * only answers "are these dates bookable?".
 *
 * The fetched result is keyed by its query. idle/loading are *derived* from
 * the current query (not written synchronously in the effect) so a stale
 * result never leaks onto a newly-changed date range.
 */
export function useAvailability(
  roomId: string | null,
  checkIn: string,
  checkOut: string,
): AvailabilityState {
  const valid = Boolean(roomId && checkIn && checkOut && checkOut > checkIn);
  const queryKey = valid ? `${roomId}|${checkIn}|${checkOut}` : "";

  const [remote, setRemote] = useState<{ key: string; state: AvailabilityState }>({
    key: "",
    state: { status: "idle" },
  });

  useEffect(() => {
    if (!queryKey) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ roomId: roomId!, checkIn, checkOut });
        const res = await fetch(`/api/bookings/availability?${params}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          available?: boolean;
          nights?: number;
          reason?: string;
          error?: string;
        };

        if (!res.ok) {
          setRemote({ key: queryKey, state: { status: "error", message: data.error ?? "request failed" } });
          return;
        }
        setRemote({
          key: queryKey,
          state: data.available
            ? { status: "available", nights: data.nights ?? 0 }
            : { status: "unavailable", reason: data.reason ?? "unavailable" },
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setRemote({
          key: queryKey,
          state: { status: "error", message: err instanceof Error ? err.message : "network error" },
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [queryKey, roomId, checkIn, checkOut]);

  if (!valid) return { status: "idle" };
  if (remote.key !== queryKey) return { status: "loading" };
  return remote.state;
}
