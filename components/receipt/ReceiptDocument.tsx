import Image from "next/image";

import { formatTHB, formatThaiDate } from "@/lib/account/format";
import { bahtText } from "@/lib/receipt/baht";
import { siteConfig } from "@/data/siteConfig";
import type { BookingStatus } from "@/types";

/**
 * Editable receipt content (saved under app_settings key "tax"). Every field is
 * optional and falls back to siteConfig, so an empty config still renders a
 * complete document. This is the single source of truth for what the booking /
 * receipt PDF shows — both the live customer page (/booking/[code]) and the admin
 * preview (/admin/settings/tax) render THIS component, so the preview is exact.
 */
export type ReceiptSettings = {
  receiptHeader?: string;
  receiptAddress?: string;
  taxId?: string;
  receiptPhone?: string;
  receiptContact?: string;
  receiptThanks?: string;
  receiptThanksSub?: string;
  receiptFooter?: string;
  /** Newline-separated house rules; falls back to siteConfig when blank. */
  houseRules?: string;
};

/** Per-booking values — raw, formatted inside so callers stay simple. */
export type ReceiptData = {
  docKind: "booking" | "receipt";
  bookingCode: string;
  createdAtIso: string;
  paidAtIso: string | null;
  guestName: string;
  guestPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  extraBedAmount: number;
  totalAmount: number;
  status: BookingStatus;
  notes: string | null;
  slipRef: string | null;
  /** Server-generated QR <svg> markup; blank → a neutral placeholder (preview). */
  qrSvg: string;
};

function resolveHouseRules(raw: string | undefined): readonly string[] {
  const lines = (raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : siteConfig.policy.houseRules.th;
}

export function ReceiptDocument({
  settings,
  data,
}: {
  settings: ReceiptSettings;
  data: ReceiptData;
}) {
  const docTitle = data.docKind === "receipt" ? "ใบเสร็จรับเงิน" : "ใบยืนยันการจอง";
  const isPaid = data.status === "confirmed" || data.status === "completed";

  const issuedIso = data.paidAtIso ?? data.createdAtIso;
  const issued = new Date(issuedIso);
  const issuedDate = issued.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  const issuedTime = issued.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const ymd = issuedIso.slice(0, 10).replace(/-/g, "");
  const docPrefix = data.docKind === "receipt" ? "RC" : "BK";
  const docNo = `${docPrefix}-${ymd}-${data.bookingCode.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase()}`;

  const sellerName = settings.receiptHeader?.trim() || siteConfig.brand.nameFull;
  const sellerAddress = settings.receiptAddress?.trim() || siteConfig.address.full.th;
  const sellerTaxId = (settings.taxId ?? "").trim();
  const sellerPhone = settings.receiptPhone?.trim() || siteConfig.contact.phone;
  const sellerContact = settings.receiptContact?.trim() || "Facebook: LandCamp Villa Khaoyai";
  const thanks = settings.receiptThanks?.trim() || "ขอบคุณที่ใช้บริการ";
  const thanksSub = settings.receiptThanksSub?.trim() || "กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน";
  const footerNote =
    settings.receiptFooter?.trim() ||
    "เอกสารนี้เป็นเพียงหลักฐานการจองและการชำระเงิน ไม่ใช่ใบกำกับภาษี";
  const houseRules = resolveHouseRules(settings.houseRules);

  return (
    <div className="lcrcpt page">
      <div className="head">
        <h1>{docTitle}</h1>
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
          <p>โทร. {sellerPhone}</p>
          {sellerContact && <p>{sellerContact}</p>}
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
          {data.guestName && (
            <>
              <dt>ชื่อผู้เข้าพัก:</dt>
              <dd>{data.guestName}</dd>
            </>
          )}
          {data.guestPhone && (
            <>
              <dt>เบอร์โทร:</dt>
              <dd>{data.guestPhone}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="block">
        <p className="sec-label">รายละเอียดการเข้าพัก</p>
        <dl className="kv">
          <dt>รหัสการจอง:</dt>
          <dd>{data.bookingCode}</dd>
          <dt>ห้องพัก:</dt>
          <dd>{data.roomName}</dd>
          <dt>เช็คอิน:</dt>
          <dd>
            {formatThaiDate(data.checkIn)} · {siteConfig.policy.checkIn} น.
          </dd>
          <dt>เช็คเอาท์:</dt>
          <dd>
            {formatThaiDate(data.checkOut)} · {siteConfig.policy.checkOut} น.
          </dd>
          <dt>ผู้เข้าพัก:</dt>
          <dd>
            {data.adults} ผู้ใหญ่
            {data.children > 0 ? ` · ${data.children} เด็ก` : ""} · {data.nights} คืน
          </dd>
        </dl>
      </div>

      <div className="block">
        <p className="sec-label">ยอดเงิน</p>
        <dl className="kv amount-big">
          <dt>{isPaid ? "ยอดชำระ:" : "ยอดที่ต้องชำระ:"}</dt>
          <dd>{formatTHB(data.totalAmount)}</dd>
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
                {data.roomName} · {formatThaiDate(data.checkIn)} – {formatThaiDate(data.checkOut)} ({data.nights} คืน)
              </div>
              {data.extraBedAmount > 0 && (
                <div className="d">รวมเตียงเสริม {formatTHB(data.extraBedAmount)}</div>
              )}
              {isPaid && <div className="d">ชำระโดย: โอนผ่านธนาคาร</div>}
              {data.slipRef && <div className="d">เลขอ้างอิงสลิป: {data.slipRef}</div>}
            </td>
            <td className="right">{formatTHB(data.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="total-row">
        <span className="tlabel">ยอดรวมทั้งหมด</span>
        <span className="tval">{formatTHB(data.totalAmount)}</span>
      </div>
      <div className="baht-text">จำนวนเงินทั้งสิ้น ({bahtText(data.totalAmount)})</div>

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
          {data.qrSvg ? (
            <div className="qr-box" dangerouslySetInnerHTML={{ __html: data.qrSvg }} />
          ) : (
            <div
              className="qr-box"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed #b9b3a7",
                color: "#9a8f7d",
                fontSize: 11,
                aspectRatio: "1 / 1",
                width: 96,
              }}
            >
              QR
            </div>
          )}
          <div className="qr-cap">สแกนดูเอกสาร</div>
        </div>
      </div>

      {data.notes && (
        <div className="block" style={{ marginTop: 18, color: "#6b6862" }}>
          <span style={{ fontWeight: 600 }}>หมายเหตุ: </span>
          {data.notes}
        </div>
      )}

      <div className="rules">
        <h2>เงื่อนไขการเข้าพัก</h2>
        <ul>
          {houseRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      <div className="thanks">
        <p>{thanks}</p>
        {thanksSub && <p>{thanksSub}</p>}
      </div>

      <div className="note-box">
        <p className="nl">หมายเหตุ</p>
        <p className="nt">{footerNote}</p>
      </div>
    </div>
  );
}
