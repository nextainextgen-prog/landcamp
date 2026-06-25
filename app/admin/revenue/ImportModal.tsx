"use client";

import { useRef, useState } from "react";

type Field =
  | "occurred_at"
  | "amount"
  | "label"
  | "category"
  | "method"
  | "customer_name"
  | "room"
  | "note";

const FIELD_LABELS: { key: Field; label: string; required?: boolean }[] = [
  { key: "occurred_at", label: "วันที่", required: true },
  { key: "amount", label: "ยอดเงิน", required: true },
  { key: "label", label: "รายการ" },
  { key: "category", label: "ประเภท" },
  { key: "method", label: "ช่องทางชำระ" },
  { key: "customer_name", label: "ลูกค้า" },
  { key: "room", label: "ห้อง" },
  { key: "note", label: "หมายเหตุ" },
];

type Preview = {
  headers: string[];
  detectedMapping: Partial<Record<Field, string>>;
  sampleRows: string[][];
  totalRows: number;
};

type CommitResult = { inserted: number; skipped: number; errors: { row: number; reason: string }[] };

const TEMPLATE = `วันที่,รายการ,ประเภท,ยอดเงิน,ช่องทางชำระ,ลูกค้า,ห้อง,หมายเหตุ
2026-06-01,ค่ากิจกรรมแคมป์ไฟ,activity,1500,เงินสด,คุณสมชาย,,กลุ่ม 5 คน
2026-06-02,ค่าห้องพัก walk-in,walk_in,2400,โอนเงิน,คุณมานี,Pine House,`;

function downloadTemplate() {
  const blob = new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "landcamp-revenue-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function inspect(f: File) {
    setError(null);
    setBusy(true);
    setFile(f);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("dryRun", "1");
      const res = await fetch("/api/admin/revenue/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "อ่านไฟล์ไม่สำเร็จ");
      setPreview(json);
      setMapping(json.detectedMapping ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      const res = await fetch("/api/admin/revenue/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "นำเข้าไม่สำเร็จ");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  const headerOptions = preview?.headers ?? [];
  const canCommit = Boolean(mapping.occurred_at && mapping.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-ink)]/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/40 px-5 py-4">
          <h2 className="text-base font-semibold text-[color:var(--color-forest-deep)]">นำเข้าข้อมูลรายได้</h2>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1.5 text-[color:var(--color-ink)]/50 hover:bg-[color:var(--color-bone-soft)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
          )}

          {/* ── Step 3: result ── */}
          {result ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-forest-deep)]/10 text-[color:var(--color-forest-deep)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="m20 6-11 11-5-5" /></svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-[color:var(--color-forest-deep)]">นำเข้าสำเร็จ {result.inserted.toLocaleString()} แถว</p>
                {result.skipped > 0 && <p className="mt-1 text-sm text-[color:var(--color-ink)]/55">ข้าม {result.skipped} แถวที่ไม่ถูกต้อง</p>}
              </div>
              {result.errors.length > 0 && (
                <ul className="max-h-32 w-full overflow-y-auto rounded-lg bg-[color:var(--color-bone-soft)]/40 px-4 py-2 text-left text-xs text-[color:var(--color-ink)]/60">
                  {result.errors.map((e) => (
                    <li key={e.row}>แถว {e.row}: {e.reason}</li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={onDone} className="rounded-xl bg-[color:var(--color-forest-deep)] px-6 py-2.5 text-sm font-semibold text-[color:var(--color-bone)] hover:bg-[color:var(--color-warm-clay)]">
                เสร็จสิ้น
              </button>
            </div>
          ) : !preview ? (
            /* ── Step 1: upload ── */
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) inspect(f); }}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 transition-colors ${
                  dragOver ? "border-[color:var(--color-warm-clay)] bg-[color:var(--color-warm-clay)]/5" : "border-[color:var(--color-forest-deep)]/20 hover:border-[color:var(--color-warm-clay)]/50"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-[color:var(--color-warm-clay)]"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                <span className="text-sm font-medium text-[color:var(--color-forest-deep)]">{busy ? "กำลังอ่านไฟล์…" : "ลากไฟล์มาวาง หรือคลิกเพื่อเลือก"}</span>
                <span className="text-xs text-[color:var(--color-ink)]/45">รองรับ .csv, .xlsx, .xls (สูงสุด 5MB)</span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) inspect(f); }}
              />
              <button type="button" onClick={downloadTemplate} className="self-center text-xs font-medium text-[color:var(--color-warm-clay)] underline-offset-2 hover:underline">
                ดาวน์โหลดไฟล์ตัวอย่าง (template)
              </button>
            </div>
          ) : (
            /* ── Step 2: map columns + preview ── */
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-1 text-sm font-medium text-[color:var(--color-forest-deep)]">จับคู่คอลัมน์</p>
                <p className="mb-3 text-xs text-[color:var(--color-ink)]/50">พบ {preview.totalRows.toLocaleString()} แถวในไฟล์ <span className="font-medium">{file?.name}</span></p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {FIELD_LABELS.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1 text-xs">
                      <span className="font-medium text-[color:var(--color-ink)]/70">
                        {f.label}{f.required && <span className="text-red-500"> *</span>}
                      </span>
                      <select
                        value={mapping[f.key] ?? ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}
                        className="rounded-lg border border-[color:var(--color-forest-deep)]/15 bg-white px-2 py-1.5 text-[13px] text-[color:var(--color-ink)] focus:border-[color:var(--color-warm-clay)] focus:outline-none"
                      >
                        <option value="">— ไม่ใช้ —</option>
                        {headerOptions.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--color-forest-deep)]">ตัวอย่างข้อมูล</p>
                <div className="overflow-x-auto rounded-xl border border-[color:var(--color-forest-deep)]/10">
                  <table className="w-full text-xs">
                    <thead className="bg-[color:var(--color-bone-soft)]/50 text-left text-[color:var(--color-forest-deep)]/65">
                      <tr>{preview.headers.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--color-forest-deep)]/8">
                      {preview.sampleRows.map((row, i) => (
                        <tr key={i}>{row.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-1.5 text-[color:var(--color-ink)]/70">{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {preview && !result && (
          <footer className="flex items-center justify-between gap-3 border-t border-[color:var(--color-forest-deep)]/10 px-5 py-4">
            <button type="button" onClick={() => { setPreview(null); setFile(null); }} className="text-sm text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]">
              ← เลือกไฟล์ใหม่
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={!canCommit || busy}
              className="rounded-xl bg-[color:var(--color-forest-deep)] px-6 py-2.5 text-sm font-semibold text-[color:var(--color-bone)] transition-colors hover:bg-[color:var(--color-warm-clay)] disabled:opacity-40"
            >
              {busy ? "กำลังนำเข้า…" : `นำเข้า ${preview.totalRows.toLocaleString()} แถว`}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
