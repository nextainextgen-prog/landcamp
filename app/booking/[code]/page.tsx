import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sarabun } from "next/font/google";
import QRCode from "qrcode";

import { getCustomerSession } from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatTHB, formatThaiDate } from "@/lib/account/format";
import { bahtText } from "@/lib/receipt/baht";
import { siteConfig } from "@/data/siteConfig";
import type { BookingStatus } from "@/types";
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

type TaxSettings = {
  receiptHeader?: string;
  receiptAddress?: string;
  taxId?: string;
  receiptFooter?: string;
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
  let tax: TaxSettings = {};
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
        admin.from("app_settings").select("value").eq("key", "tax").maybeSingle<{ value: TaxSettings }>(),
      ]);
    roomName = room?.name_th ?? "ห้องพัก";
    guestName = customer?.full_name ?? "";
    guestPhone = customer?.phone ?? "";
    slipRef = payment?.trans_ref ?? null;
    paidAt = payment?.paid_at ?? null;
    tax = taxRow?.value ?? {};
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

  const isPaid = booking.status === "confirmed" || booking.status === "completed";

  // เลขที่เอกสาร (รันตามวันที่) + วันที่ออก + QR
  const issuedIso = paidAt ?? booking.created_at;
  const issuedDate = new Date(issuedIso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const issuedTime = new Date(issuedIso).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const ymd = issuedIso.slice(0, 10).replace(/-/g, "");
  const docNo = `RC-${ymd}-${booking.booking_code.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase()}`;

  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const qrSvg = await QRCode.toString(`${proto}://${host}/booking/${booking.booking_code}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#1a1814", light: "#00000000" },
  });

  // ผู้ขาย (snapshot จากตั้งค่าภาษี → fallback siteConfig)
  const sellerName = tax.receiptHeader || siteConfig.brand.nameFull;
  const sellerAddress = tax.receiptAddress || siteConfig.address.full.th;
  const sellerTaxId = (tax.taxId || "").trim();

  return (
    <main className={`${sarabun.className} min-h-screen bg-neutral-100 px-4 py-10`}>
      <div className="mx-auto max-w-[760px]">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <span aria-hidden>←</span> การจองของฉัน
          </Link>
          <PrintButton />
        </div>

        <div className="lcrcpt page">
          <div className="head">
            <h1>ใบยืนยันการจอง</h1>
            <Image
              className="logo"
              src="/images/brand/landcamp-logo.png"
              alt="LandCamp Villa Khaoyai"
              width={2000}
              height={667}
              priority
            />
          </div>

          <div className="cols">
            <div className="seller">
              <p className="sec-label">โดย</p>
              <p>{sellerName}</p>
              <p>{sellerAddress}</p>
              {sellerTaxId && <p>เลขประจำตัวผู้เสียภาษี: {sellerTaxId}</p>}
              <p>โทร. {siteConfig.contact.phone}</p>
              <p>Facebook: LandCamp Villa Khaoyai</p>
            </div>
            <div className="meta">
              <div className="m">
                <div className="mlabel">วันที่ออกเอกสาร</div>
                <div className="mval">
                  {issuedDate} เวลา {issuedTime}
                </div>
              </div>
              <div className="m">
                <div className="mlabel">เลขที่เอกสาร</div>
                <div className="mval">{docNo}</div>
              </div>
            </div>
          </div>

          <div className="block">
            <p className="sec-label">ผู้เข้าพัก</p>
            <dl className="kv">
              {guestName && (
                <>
                  <dt>ชื่อผู้เข้าพัก:</dt>
                  <dd>{guestName}</dd>
                </>
              )}
              {guestPhone && (
                <>
                  <dt>เบอร์โทร:</dt>
                  <dd>{guestPhone}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="block">
            <p className="sec-label">รายละเอียดการเข้าพัก</p>
            <dl className="kv">
              <dt>รหัสการจอง:</dt>
              <dd>{booking.booking_code}</dd>
              <dt>ห้องพัก:</dt>
              <dd>{roomName}</dd>
              <dt>เช็คอิน:</dt>
              <dd>
                {formatThaiDate(booking.check_in)} · {siteConfig.policy.checkIn} น.
              </dd>
              <dt>เช็คเอาท์:</dt>
              <dd>
                {formatThaiDate(booking.check_out)} · {siteConfig.policy.checkOut} น.
              </dd>
              <dt>ผู้เข้าพัก:</dt>
              <dd>
                {booking.adults} ผู้ใหญ่
                {booking.children > 0 ? ` · ${booking.children} เด็ก` : ""} · {booking.nights} คืน
              </dd>
            </dl>
          </div>

          <div className="block">
            <p className="sec-label">ยอดเงิน</p>
            <dl className="kv amount-big">
              <dt>{isPaid ? "ยอดชำระ:" : "ยอดที่ต้องชำระ:"}</dt>
              <dd>{formatTHB(booking.total_amount)}</dd>
            </dl>
          </div>

          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>รายละเอียด</th>
                <th className="right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ค่าห้องพัก</td>
                <td className="detail">
                  <div className="d">
                    {roomName} · {formatThaiDate(booking.check_in)} – {formatThaiDate(booking.check_out)} ({booking.nights} คืน)
                  </div>
                  {booking.extra_bed_amount > 0 && (
                    <div className="d">รวมเตียงเสริม {formatTHB(booking.extra_bed_amount)}</div>
                  )}
                  {isPaid && <div className="d">ชำระโดย: โอนผ่านธนาคาร</div>}
                  {slipRef && <div className="d">เลขอ้างอิงสลิป: {slipRef}</div>}
                </td>
                <td className="right">{formatTHB(booking.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="total-row">
            <span className="tlabel">ยอดรวมทั้งหมด</span>
            <span className="tval">{formatTHB(booking.total_amount)}</span>
          </div>
          <div className="baht-text">จำนวนเงินทั้งสิ้น ({bahtText(booking.total_amount)})</div>

          <div className="pay">
            {isPaid ? (
              <span className="paid">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16.5 6.5 8.5 14.5 4.5 10.5" />
                </svg>
                ชำระเงินแล้ว
              </span>
            ) : (
              <span />
            )}
            <div>
              <div className="qr-box" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <div className="qr-cap">สแกนดูเอกสาร</div>
            </div>
          </div>

          {booking.notes && (
            <div className="block" style={{ marginTop: 18, color: "#6b6862" }}>
              <span style={{ fontWeight: 600 }}>หมายเหตุ: </span>
              {booking.notes}
            </div>
          )}

          <div className="rules">
            <h2>เงื่อนไขการเข้าพัก</h2>
            <ul>
              {siteConfig.policy.houseRules.th.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="thanks">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน</p>
            <p className="issued-by">เอกสารนี้ออกโดยระบบ LandCamp · {tax.receiptFooter || siteConfig.address.full.th}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
