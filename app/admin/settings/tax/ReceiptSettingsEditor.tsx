"use client";

import { useEffect, useMemo, useState } from "react";
import { Sarabun } from "next/font/google";

import { Panel } from "@/components/admin/ui";
import { useSettingsToast } from "../useSettingsToast";
import {
  ReceiptDocument,
  type ReceiptData,
  type ReceiptSettings,
} from "@/components/receipt/ReceiptDocument";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition-colors focus:border-[color:var(--color-warm-clay)]";

// Sample booking used only to render the live preview — never saved.
const SAMPLE: ReceiptData = {
  docKind: "receipt",
  bookingCode: "LC-2026-0042",
  createdAtIso: "2026-06-20T10:30:00+07:00",
  paidAtIso: "2026-06-20T10:30:00+07:00",
  guestName: "คุณตัวอย่าง ใจดี",
  guestPhone: "081-234-5678",
  roomName: "วิลล่า 1 · Villa 1",
  checkIn: "2026-07-01",
  checkOut: "2026-07-03",
  adults: 2,
  children: 1,
  nights: 2,
  extraBedAmount: 0,
  totalAmount: 9000,
  status: "confirmed",
  notes: null,
  slipRef: "0123456789ABCD",
  qrSvg: "",
};

type Field = {
  name: keyof ReceiptSettings;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
  hint?: string;
};

const FIELDS: Field[] = [
  { name: "receiptHeader", label: "ชื่อบนใบเสร็จ (ผู้ขาย)", type: "text", placeholder: "LandCamp Villa Khao Yai" },
  { name: "receiptAddress", label: "ที่อยู่ผู้ขาย", type: "textarea", placeholder: "ต.ขนงพระ อ.ปากช่อง จ.นครราชสีมา 30130" },
  { name: "taxId", label: "เลขประจำตัวผู้เสียภาษี", type: "text", placeholder: "0-0000-00000-00-0", hint: "เว้นว่างได้ถ้าไม่ต้องการแสดง" },
  { name: "receiptPhone", label: "เบอร์โทรบนใบเสร็จ", type: "text", placeholder: "098-502-1695" },
  { name: "receiptContact", label: "ช่องทางติดต่อ (บรรทัดเพิ่ม)", type: "text", placeholder: "Facebook: LandCamp Villa Khaoyai" },
  { name: "receiptThanks", label: "ข้อความขอบคุณ (บรรทัด 1)", type: "text", placeholder: "ขอบคุณที่ใช้บริการ" },
  { name: "receiptThanksSub", label: "ข้อความขอบคุณ (บรรทัด 2)", type: "text", placeholder: "กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน" },
  { name: "receiptFooter", label: "หมายเหตุท้ายเอกสาร", type: "textarea", placeholder: "เอกสารนี้เป็นเพียงหลักฐานการจองและการชำระเงิน ไม่ใช่ใบกำกับภาษี" },
  { name: "houseRules", label: "เงื่อนไขการเข้าพัก (บรรทัดละ 1 ข้อ)", type: "textarea", hint: "เว้นว่าง = ใช้เงื่อนไขมาตรฐานของระบบ" },
];

/** Receipt-content editor with a live, exact preview of the real PDF document. */
export function ReceiptSettingsEditor() {
  const [value, setValue] = useState<ReceiptSettings>({});
  const [saved, setSaved] = useState<ReceiptSettings>({});
  const [unavailable, setUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const { show, toastNode } = useSettingsToast();

  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(saved), [value, saved]);

  useEffect(() => {
    fetch("/api/admin/settings/kv/tax")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setUnavailable(true);
          return;
        }
        const next = (data.value ?? {}) as ReceiptSettings;
        setValue(next);
        setSaved(next);
      })
      .catch(() => setUnavailable(true));
  }, []);

  function set(name: keyof ReceiptSettings, v: string) {
    setValue((p) => ({ ...p, [name]: v }));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings/kv/tax", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      show("err", data.error ?? "บันทึกไม่สำเร็จ");
      setSaving(false);
      return;
    }
    setSaved(value);
    show("ok", "บันทึกแล้ว");
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านค่าจากฐานข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>016_settings_kv_audit</strong> แล้ว
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <Panel title="แก้ไขข้อความบนใบเสร็จ" bodyClassName="flex flex-col gap-4">
          <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-3 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
            ข้อความที่แก้ที่นี่จะแสดงบนเอกสาร <strong>ใบเสร็จรับเงิน / ใบยืนยันการจอง</strong> ที่ลูกค้าเปิดดูและบันทึกเป็น PDF
            — ดูตัวอย่างจริงทางขวา เว้นช่องว่างไว้เพื่อใช้ค่ามาตรฐาน
          </div>

          {FIELDS.map((f) => (
            <label key={f.name} className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
                {f.label}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  rows={f.name === "houseRules" ? 8 : 3}
                  className={inputCls}
                  value={String(value[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={inputCls}
                  value={String(value[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.hint && <span className="text-[11px] text-[color:var(--color-ink)]/40">{f.hint}</span>}
            </label>
          ))}

          <div className="flex items-center gap-2.5 border-t border-[color:var(--color-forest-deep)]/8 pt-4">
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="rounded-lg bg-[color:var(--color-warm-clay)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--color-forest-deep)] disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={() => setValue(saved)}
              disabled={saving || !dirty}
              className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-4 py-2 text-sm font-medium text-[color:var(--color-ink)]/70 transition-colors hover:bg-[color:var(--color-bone-soft)]/60 disabled:opacity-40"
            >
              คืนค่า
            </button>
            {dirty && <span className="text-xs text-[color:var(--color-ink)]/40">มีการแก้ไขที่ยังไม่บันทึก</span>}
          </div>
        </Panel>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-forest-deep)]/70">
            ตัวอย่างเอกสารจริง (อัปเดตสดตามที่แก้)
          </span>
          <div className="overflow-auto rounded-2xl border border-[color:var(--color-forest-deep)]/10 bg-neutral-100 p-4">
            <div className={`${sarabun.className} receipt-preview`}>
              <ReceiptDocument settings={value} data={SAMPLE} />
            </div>
          </div>
        </div>
      </div>
      {toastNode}
    </div>
  );
}
