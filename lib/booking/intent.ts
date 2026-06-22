// A pending booking the user started before signing in. Google OAuth redirects
// the whole page away and back, so we stash the in-progress form in
// sessionStorage and reopen the modal (pre-filled) on return.

export type BookingIntent = {
  slug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  extraBed: boolean;
  notes?: string;
};

const KEY = "landcamp:booking-intent";

export function saveBookingIntent(intent: BookingIntent): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    // sessionStorage unavailable (private mode / SSR) — non-fatal.
  }
}

export function loadBookingIntent(): BookingIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookingIntent>;
    if (typeof parsed.slug !== "string") return null;
    return {
      slug: parsed.slug,
      checkIn: typeof parsed.checkIn === "string" ? parsed.checkIn : "",
      checkOut: typeof parsed.checkOut === "string" ? parsed.checkOut : "",
      adults: typeof parsed.adults === "number" ? parsed.adults : 1,
      children: typeof parsed.children === "number" ? parsed.children : 0,
      extraBed: Boolean(parsed.extraBed),
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    };
  } catch {
    return null;
  }
}

export function clearBookingIntent(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
