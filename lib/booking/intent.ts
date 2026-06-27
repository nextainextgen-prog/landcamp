// A pending booking the user started before signing in. LINE login redirects the
// whole page away (and on mobile often returns in a different tab/webview), so we
// stash the in-progress form in localStorage — which is origin-scoped, not
// tab-scoped like sessionStorage — and reopen the modal (pre-filled) on return.

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
// Ignore intents older than this so an abandoned booking doesn't reopen the modal
// on an unrelated later visit.
const TTL_MS = 30 * 60 * 1000;

type StoredIntent = BookingIntent & { savedAt: number };

export function saveBookingIntent(intent: BookingIntent): void {
  try {
    const payload: StoredIntent = { ...intent, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode / SSR) — non-fatal.
  }
}

export function loadBookingIntent(): BookingIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredIntent>;
    if (typeof parsed.slug !== "string") return null;
    if (typeof parsed.savedAt === "number" && Date.now() - parsed.savedAt > TTL_MS) {
      clearBookingIntent();
      return null;
    }
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
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
