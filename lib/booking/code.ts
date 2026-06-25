import type { SupabaseClient } from "@supabase/supabase-js";

const YEAR_LENGTH = 4;
const SEQ_LENGTH = 4;

function format(year: number, seq: number): string {
  return `LC-${year}-${String(seq).padStart(SEQ_LENGTH, "0")}`;
}

export function generateBookingCode(seq: number): string;
export function generateBookingCode(admin: SupabaseClient): Promise<string>;
export function generateBookingCode(
  arg: number | SupabaseClient,
): string | Promise<string> {
  const year = new Date().getFullYear();

  if (typeof arg === "number") {
    return format(year, arg);
  }

  return (async () => {
    const prefix = `LC-${String(year).padStart(YEAR_LENGTH, "0")}-`;
    const { count } = await arg
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .like("booking_code", `${prefix}%`);

    const next = (count ?? 0) + 1;
    return format(year, next);
  })();
}
