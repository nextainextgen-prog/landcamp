import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BOOKING_STATUS_TH,
  formatTHB,
  formatThaiDate,
} from "@/lib/account/format";
import type { BookingStatus } from "@/types";

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  booking_code: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_amount: number;
  room_id: string;
  adults: number;
  children: number;
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending_payment:
    "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)] ring-[color:var(--color-warm-clay)]/30",
  payment_review: "bg-blue-50 text-blue-700 ring-blue-200",
  confirmed:
    "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)] ring-[color:var(--color-forest-deep)]/25",
  cancelled: "bg-neutral-200 text-neutral-600 ring-neutral-300",
  completed:
    "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)] ring-[color:var(--color-sage-mid)]/30",
  no_show: "bg-red-100 text-red-700 ring-red-200",
};

export default async function AccountBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string }>();

  let bookings: BookingRow[] = [];
  if (customer?.id) {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, booking_code, check_in, check_out, status, total_amount, room_id, adults, children",
      )
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    bookings = (data ?? []) as BookingRow[];
  }

  return (
    <div className="space-y-10">
      <div
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] sm:text-[11px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        <span className="text-[color:var(--color-warm-clay)]">02</span>
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/35" />
        <span className="text-[color:var(--color-forest-deep)]/65">การจองของฉัน</span>
      </div>

      <h1 className="font-display text-[32px] leading-tight text-[color:var(--color-forest-deep)] sm:text-[42px]">
        ประวัติการจอง
      </h1>

      {bookings.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[color:var(--color-forest-deep)]/20 bg-white/60 p-10 text-center">
          <p className="text-base text-[color:var(--color-ink)]/65">
            ยังไม่มีการจอง
          </p>
          <Link
            href="/#rooms"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-warm-clay)] hover:text-[color:var(--color-forest-deep)]"
          >
            เลือกห้องพัก
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <BookingsList bookings={bookings} />
      )}
    </div>
  );
}

function BookingsList({ bookings }: { bookings: BookingRow[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[18px] border border-[color:var(--color-forest-deep)]/10 bg-white/70 md:block">
        <table className="w-full text-sm">
          <thead
            className="bg-[color:var(--color-bone-soft)]/70 text-left text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-forest-deep)]/65"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <tr>
              <th className="px-5 py-3 font-medium">รหัสจอง</th>
              <th className="px-5 py-3 font-medium">ห้อง</th>
              <th className="px-5 py-3 font-medium">วันเข้า–ออก</th>
              <th className="px-5 py-3 font-medium">สถานะ</th>
              <th className="px-5 py-3 text-right font-medium">ยอด</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr
                key={b.id}
                className="border-t border-[color:var(--color-forest-deep)]/8 transition-colors hover:bg-[color:var(--color-bone-soft)]/40"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/booking/${b.booking_code}`}
                    className="font-mono text-[13px] text-[color:var(--color-forest-deep)] hover:text-[color:var(--color-warm-clay)]"
                  >
                    {b.booking_code}
                  </Link>
                </td>
                <td className="px-5 py-4 text-[color:var(--color-ink)]/80">
                  {/* TODO: resolve to room name post-seed */}
                  <span className="font-mono text-xs text-[color:var(--color-ink)]/60">
                    {b.room_id.slice(0, 8)}
                  </span>
                </td>
                <td className="px-5 py-4 text-[color:var(--color-ink)]/80">
                  {formatThaiDate(b.check_in)} – {formatThaiDate(b.check_out)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${STATUS_BADGE[b.status]}`}
                  >
                    {BOOKING_STATUS_TH[b.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-medium text-[color:var(--color-forest-deep)]">
                  {formatTHB(b.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-4 md:hidden">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/booking/${b.booking_code}`}
              className="block rounded-[18px] border border-[color:var(--color-forest-deep)]/10 bg-white/70 p-5 shadow-[0_12px_32px_-22px_rgba(45,55,40,0.25)] transition-colors hover:border-[color:var(--color-warm-clay)]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-sm text-[color:var(--color-forest-deep)]">
                  {b.booking_code}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] ring-1 ${STATUS_BADGE[b.status]}`}
                >
                  {BOOKING_STATUS_TH[b.status]}
                </span>
              </div>
              <div className="mt-3 text-sm text-[color:var(--color-ink)]/75">
                {formatThaiDate(b.check_in)} – {formatThaiDate(b.check_out)}
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-ink)]/55">
                {/* TODO: resolve to room name post-seed */}
                ห้อง:{" "}
                <span className="font-mono">{b.room_id.slice(0, 8)}</span>
                <span className="mx-2">·</span>
                {b.adults} ผู้ใหญ่
                {b.children > 0 ? ` · ${b.children} เด็ก` : null}
              </div>
              <div className="mt-3 text-right font-medium text-[color:var(--color-forest-deep)]">
                {formatTHB(b.total_amount)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
