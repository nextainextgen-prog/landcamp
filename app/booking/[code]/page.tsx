import Link from "next/link";
import { redirect } from "next/navigation";

import { getCustomerSession } from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BOOKING_STATUS_TH, formatTHB, formatThaiDate } from "@/lib/account/format";
import { siteConfig } from "@/data/siteConfig";
import type { BookingStatus } from "@/types";

export const dynamic = "force-dynamic";

type BookingRow = {
  booking_code: string;
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  extra_bed: boolean;
  nights: number;
  base_amount: number;
  extra_bed_amount: number;
  total_amount: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending_payment:
    "bg-[color:var(--color-warm-clay)]/12 text-[color:var(--color-warm-clay)] ring-[color:var(--color-warm-clay)]/30",
  payment_review:
    "bg-blue-50 text-blue-700 ring-blue-200",
  confirmed:
    "bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)] ring-[color:var(--color-forest-deep)]/25",
  cancelled: "bg-neutral-200 text-neutral-600 ring-neutral-300",
  completed:
    "bg-[color:var(--color-sage-mid)]/15 text-[color:var(--color-sage-mid)] ring-[color:var(--color-sage-mid)]/30",
  no_show: "bg-red-100 text-red-700 ring-red-200",
};

export default async function BookingReceiptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const session = await getCustomerSession();
  if (!session) redirect("/");

  const admin = createSupabaseAdminClient();
  // Fetch by code, then confirm it belongs to the signed-in customer.
  const { data: row } = await admin
    .from("bookings")
    .select(
      "booking_code, customer_id, room_id, check_in, check_out, adults, children, extra_bed, nights, base_amount, extra_bed_amount, total_amount, status, notes, created_at",
    )
    .eq("booking_code", code)
    .maybeSingle<BookingRow & { customer_id: string }>();
  const booking = row && row.customer_id === session.id ? row : null;

  let roomName = "";
  let guestName = "";
  let guestPhone = "";
  if (booking) {
    const [{ data: room }, { data: customer }] = await Promise.all([
      admin.from("rooms").select("name_th").eq("id", booking.room_id).maybeSingle<{ name_th: string }>(),
      admin
        .from("customers")
        .select("full_name, phone")
        .eq("id", row!.customer_id)
        .maybeSingle<{ full_name: string | null; phone: string | null }>(),
    ]);
    roomName = room?.name_th ?? "";
    guestName = customer?.full_name ?? "";
    guestPhone = customer?.phone ?? "";
  }

  const isPaid = booking?.status === "confirmed" || booking?.status === "completed";

  return (
    <main className="min-h-screen bg-[color:var(--color-bone)] px-5 py-12 text-[color:var(--color-ink)]">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-forest-deep)]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          <span aria-hidden>←</span> การจองของฉัน
        </Link>

        {!booking ? (
          <div className="mt-8 rounded-[20px] border border-dashed border-[color:var(--color-forest-deep)]/20 bg-white/60 p-10 text-center">
            <p className="text-base text-[color:var(--color-ink)]/65">ไม่พบใบการจองนี้</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[22px] bg-white/80 ring-1 ring-[color:var(--color-forest-deep)]/10 shadow-[0_24px_60px_-30px_rgba(45,55,40,0.35)]">
            {/* Brand mark — TODO: แทนที่ด้วย <Image> โลโก้จริงเมื่อได้รับไฟล์โลโก้ */}
            <div className="flex flex-col items-center gap-1 border-b border-[color:var(--color-ink)]/10 px-7 pt-7 pb-5">
              <span className="font-display text-2xl leading-none text-[color:var(--color-forest-deep)]">
                Landcamp
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-sage-mid)]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Villa Khaoyai
              </span>
            </div>

            <div className="border-b border-[color:var(--color-ink)]/10 px-7 py-6">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  LandCamp · ใบการจอง
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${STATUS_BADGE[booking.status]}`}
                >
                  {BOOKING_STATUS_TH[booking.status]}
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl leading-tight text-[color:var(--color-forest-deep)]">
                {roomName || "ห้องพัก"}
              </h1>
              <p className="mt-1 font-mono text-sm text-[color:var(--color-ink)]/60">
                {booking.booking_code}
              </p>
            </div>

            {/* Guest details */}
            {(guestName || guestPhone) && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-[color:var(--color-ink)]/10 px-7 py-6 text-sm">
                {guestName && <Row label="ชื่อผู้เข้าพัก" value={guestName} />}
                {guestPhone && <Row label="เบอร์โทร" value={guestPhone} />}
              </dl>
            )}

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-7 py-6 text-sm">
              <Row
                label="เช็คอิน"
                value={`${formatThaiDate(booking.check_in)} · ${siteConfig.policy.checkIn} น.`}
              />
              <Row
                label="เช็คเอาท์"
                value={`${formatThaiDate(booking.check_out)} · ${siteConfig.policy.checkOut} น.`}
              />
              <Row label="จำนวนคืน" value={`${booking.nights} คืน`} />
              <Row
                label="ผู้เข้าพัก"
                value={`${booking.adults} ผู้ใหญ่${booking.children > 0 ? ` · ${booking.children} เด็ก` : ""}`}
              />
              <Row label="เตียงเสริม" value={booking.extra_bed ? "มี" : "ไม่มี"} />
            </dl>

            <div className="border-t border-[color:var(--color-ink)]/10 px-7 py-6">
              <PriceRow label="ค่าห้อง" value={formatTHB(booking.base_amount)} />
              {booking.extra_bed_amount > 0 && (
                <PriceRow label="เตียงเสริม" value={formatTHB(booking.extra_bed_amount)} />
              )}
              <div className="my-2 h-px bg-[color:var(--color-ink)]/10" />
              <PriceRow label="ยอดรวม" value={formatTHB(booking.total_amount)} strong />
              {isPaid && (
                <div className="mt-2 flex items-center justify-end gap-1.5 text-xs font-medium text-[color:var(--color-forest-deep)]">
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16.5 6.5 8.5 14.5 4.5 10.5" />
                  </svg>
                  ชำระเงินแล้ว
                </div>
              )}
            </div>

            {/* House rules / เงื่อนไขการเข้าพัก */}
            <div className="border-t border-[color:var(--color-ink)]/10 px-7 py-6">
              <h2
                className="mb-4 text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                เงื่อนไขการเข้าพัก
              </h2>
              <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-[color:var(--color-ink)]/70">
                {siteConfig.policy.houseRules.th.map((rule) => (
                  <li key={rule} className="flex gap-2.5">
                    <svg
                      aria-hidden
                      viewBox="0 0 20 20"
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--color-warm-clay)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16.5 6.5 8.5 14.5 4.5 10.5" />
                    </svg>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {booking.notes && (
              <div className="border-t border-[color:var(--color-ink)]/10 px-7 py-5 text-sm text-[color:var(--color-ink)]/70">
                <span className="text-[color:var(--color-ink)]/50">หมายเหตุ: </span>
                {booking.notes}
              </div>
            )}

            {booking.status === "payment_review" && (
              <div className="border-t border-[color:var(--color-ink)]/10 bg-blue-50/50 px-7 py-5 text-sm text-blue-800">
                เราได้รับสลิปของคุณแล้ว ทีมงานกำลังตรวจสอบการชำระเงิน
                จะอัปเดตสถานะให้เร็วที่สุด
              </div>
            )}

            {/* Footer — contact */}
            <div className="border-t border-[color:var(--color-ink)]/10 bg-[color:var(--color-forest-deep)]/[0.03] px-7 py-5 text-center text-sm text-[color:var(--color-ink)]/65">
              <p>
                ติดต่อสอบถามเพิ่มเติม โทร{" "}
                <span className="font-medium text-[color:var(--color-forest-deep)]">
                  {siteConfig.contact.phone}
                </span>
              </p>
              <p className="mt-1">Facebook : LandCamp Villa Khaoyai</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink)]/50"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
      </dt>
      <dd className="font-medium text-[color:var(--color-forest-deep)]">{value}</dd>
    </div>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[color:var(--color-ink)]/60">{label}</span>
      <span
        className={
          strong
            ? "text-base font-semibold text-[color:var(--color-forest-deep)]"
            : "font-medium text-[color:var(--color-forest-deep)]"
        }
      >
        {value}
      </span>
    </div>
  );
}
