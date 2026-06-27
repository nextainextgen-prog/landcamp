import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sarabun } from "next/font/google";
import QRCode from "qrcode";

import { getCustomerSession } from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingStatus } from "@/types";
import { ReceiptDocument, type ReceiptData, type ReceiptSettings } from "@/components/receipt/ReceiptDocument";
import { PrintButton } from "./PrintButton";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  booking_code: string;
  customer_id: string;
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

export default async function BookingReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ doc?: string }>;
}) {
  const { code } = await params;
  const docKind = (await searchParams)?.doc === "receipt" ? "receipt" : "booking";

  const session = await getCustomerSession();
  // No session (e.g. opened fresh from the LINE card's "ดูใบจอง" button in the
  // in-app browser): kick off LINE login and return here afterwards, so the
  // customer lands straight on their own booking instead of the homepage.
  if (!session) redirect(`/api/auth/line/login?next=/booking/${encodeURIComponent(code)}`);

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("bookings")
    .select(
      "id, booking_code, customer_id, room_id, check_in, check_out, adults, children, extra_bed, nights, base_amount, extra_bed_amount, total_amount, status, notes, created_at",
    )
    .eq("booking_code", code)
    .maybeSingle<BookingRow>();
  const booking = row && row.customer_id === session.id ? row : null;

  let roomName = "";
  let guestName = "";
  let guestPhone = "";
  let slipRef: string | null = null;
  let paidAt: string | null = null;
  let settings: ReceiptSettings = {};
  if (booking) {
    const [{ data: room }, { data: customer }, { data: payment }, { data: taxRow }] =
      await Promise.all([
        admin.from("rooms").select("name_th").eq("id", booking.room_id).maybeSingle<{ name_th: string }>(),
        admin
          .from("customers")
          .select("full_name, phone")
          .eq("id", booking.customer_id)
          .maybeSingle<{ full_name: string | null; phone: string | null }>(),
        admin
          .from("payments")
          .select("trans_ref, paid_at")
          .eq("booking_id", booking.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ trans_ref: string | null; paid_at: string | null }>(),
        admin.from("app_settings").select("value").eq("key", "tax").maybeSingle<{ value: ReceiptSettings }>(),
      ]);
    roomName = room?.name_th ?? "ห้องพัก";
    guestName = customer?.full_name ?? "";
    guestPhone = customer?.phone ?? "";
    slipRef = payment?.trans_ref ?? null;
    paidAt = payment?.paid_at ?? null;
    settings = taxRow?.value ?? {};
  }

  if (!booking) {
    return (
      <main className={`${sarabun.className} min-h-screen bg-neutral-100 px-4 py-12`}>
        <div className="mx-auto max-w-3xl">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <span aria-hidden>←</span> การจองของฉัน
          </Link>
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            ไม่พบใบการจองนี้
          </div>
        </div>
      </main>
    );
  }

  // QR points back at this document (server-side, real host).
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const qrSvg = await QRCode.toString(`${proto}://${host}/booking/${booking.booking_code}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#1a1814", light: "#00000000" },
  });

  const isPaid = booking.status === "confirmed" || booking.status === "completed";

  const data: ReceiptData = {
    docKind,
    bookingCode: booking.booking_code,
    createdAtIso: booking.created_at,
    paidAtIso: paidAt,
    guestName,
    guestPhone,
    roomName,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    adults: booking.adults,
    children: booking.children,
    nights: booking.nights,
    extraBedAmount: booking.extra_bed_amount,
    totalAmount: booking.total_amount,
    status: booking.status,
    notes: booking.notes,
    slipRef,
    qrSvg,
  };

  return (
    <main className={`${sarabun.className} min-h-screen bg-neutral-100 px-4 py-10`}>
      <div className="mx-auto max-w-[760px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <span aria-hidden>←</span> การจองของฉัน
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {/* Document switcher — one card link, two documents to choose from. */}
            <div className="inline-flex rounded-full border border-neutral-300 bg-white p-0.5 text-sm">
              <Link
                href={`/booking/${booking.booking_code}?doc=booking`}
                className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                  docKind === "booking" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                ใบยืนยันการจอง
              </Link>
              {isPaid && (
                <Link
                  href={`/booking/${booking.booking_code}?doc=receipt`}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                    docKind === "receipt" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  ใบเสร็จรับเงิน
                </Link>
              )}
            </div>
            <PrintButton />
          </div>
        </div>

        <ReceiptDocument settings={settings} data={data} />
      </div>
    </main>
  );
}
