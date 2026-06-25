import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB spreadsheet
const MAX_ROWS = 5000;
const ALLOWED_EXT = new Set(["csv", "xlsx", "xls"]);
const CATEGORIES = new Set(["room", "activity", "food", "walk_in", "deposit", "refund", "other"]);

type Field =
  | "occurred_at"
  | "amount"
  | "label"
  | "category"
  | "method"
  | "customer_name"
  | "room"
  | "note";

/** Header keywords (Thai + English) used to auto-detect the column mapping. */
const FIELD_HINTS: Record<Field, string[]> = {
  occurred_at: ["date", "วันที่", "วัน", "occurred", "time"],
  amount: ["amount", "ยอด", "รายได้", "เงิน", "จำนวน", "total", "price", "ราคา"],
  label: ["label", "รายการ", "description", "desc", "รายละเอียด", "detail", "item", "ชื่อรายการ"],
  category: ["category", "ประเภท", "หมวด", "type"],
  method: ["method", "ช่องทาง", "วิธี", "payment", "จ่าย"],
  customer_name: ["customer", "ลูกค้า", "ชื่อลูกค้า"],
  room: ["room", "ห้อง"],
  note: ["note", "หมายเหตุ", "remark", "comment"],
};

const METHOD_MAP: Record<string, string> = {
  เงินสด: "cash", cash: "cash",
  โอน: "transfer", โอนเงิน: "transfer", transfer: "transfer", bank: "transfer",
  พร้อมเพย์: "promptpay", promptpay: "promptpay", qr: "promptpay",
  บัตร: "card", card: "card", credit: "card",
};

const CATEGORY_MAP: Record<string, string> = {
  ห้อง: "room", ห้องพัก: "room", room: "room",
  กิจกรรม: "activity", activity: "activity",
  อาหาร: "food", food: "food",
  "walk-in": "walk_in", walkin: "walk_in", walk_in: "walk_in",
  มัดจำ: "deposit", deposit: "deposit",
  คืนเงิน: "refund", refund: "refund",
};

function detectMapping(headers: string[]): Partial<Record<Field, string>> {
  const map: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(FIELD_HINTS) as Field[]) {
    const hints = FIELD_HINTS[field];
    const hit = headers.find((h) => {
      const low = h.toLowerCase().trim();
      return hints.some((k) => low.includes(k.toLowerCase()));
    });
    if (hit) map[field] = hit;
  }
  return map;
}

/** Normalise a date cell to YYYY-MM-DD; returns "" if unparseable. */
function parseDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY or D/M/YYYY (also accepts "-" / ".") — assume day-first (Thai).
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const [, d, mo, yRaw] = m;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    let yy = Number(y);
    if (yy > 2400) yy -= 543; // Buddhist year → Gregorian
    return `${yy}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

/** Strip currency symbols/commas and round to a THB integer; NaN if invalid. */
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[฿,\s]/g, "").replace(/[^\d.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function readSheet(buf: Buffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buf, { type: "buffer", codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { headers: [], rows: [] };
  const matrix = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  const headers = (matrix[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = matrix.slice(1).map((r) => headers.map((_, i) => String((r as unknown[])[i] ?? "")));
  return { headers, rows };
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("revenue");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file field required" }, { status: 400 });
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์ .csv, .xlsx, .xls" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 413 });

  let parsed: { headers: string[]; rows: string[][] };
  try {
    parsed = readSheet(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "อ่านไฟล์ไม่สำเร็จ — ตรวจสอบรูปแบบไฟล์" }, { status: 422 });
  }
  const { headers, rows } = parsed;
  if (headers.length === 0 || rows.length === 0) {
    return NextResponse.json({ error: "ไฟล์ว่างหรือไม่มีหัวตาราง" }, { status: 422 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `แถวเกิน ${MAX_ROWS} แถว` }, { status: 413 });
  }

  const dryRun = form.get("dryRun") === "1";

  if (dryRun) {
    return NextResponse.json({
      headers,
      detectedMapping: detectMapping(headers),
      sampleRows: rows.slice(0, 6),
      totalRows: rows.length,
    });
  }

  // ── Commit path ──
  let mapping: Partial<Record<Field, string>>;
  try {
    mapping = JSON.parse(String(form.get("mapping") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "mapping ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!mapping.occurred_at || !mapping.amount) {
    return NextResponse.json({ error: "ต้องระบุคอลัมน์ วันที่ และ ยอดเงิน" }, { status: 400 });
  }

  const idx = (f: Field) => (mapping[f] ? headers.indexOf(mapping[f] as string) : -1);
  const cell = (row: string[], f: Field) => {
    const i = idx(f);
    return i >= 0 ? (row[i] ?? "").trim() : "";
  };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Resolve room names → ids (case-insensitive).
  const { data: roomsData } = await admin.from("rooms").select("id, name_th");
  const roomByName = new Map(
    (roomsData ?? []).map((r) => [String(r.name_th).toLowerCase().trim(), r.id as string]),
  );

  const batch = `imp_${Date.now()}`;
  const records: Record<string, unknown>[] = [];
  const errors: { row: number; reason: string }[] = [];

  rows.forEach((row, i) => {
    const occurred_at = parseDate(cell(row, "occurred_at"));
    const amount = parseAmount(cell(row, "amount"));
    if (!occurred_at) return errors.push({ row: i + 2, reason: "วันที่ไม่ถูกต้อง" });
    if (Number.isNaN(amount)) return errors.push({ row: i + 2, reason: "ยอดเงินไม่ถูกต้อง" });

    const rawCat = cell(row, "category").toLowerCase();
    let category = CATEGORY_MAP[rawCat] ?? rawCat;
    if (!CATEGORIES.has(category)) category = "other";

    const rawMethod = cell(row, "method").toLowerCase();
    const method = rawMethod ? (METHOD_MAP[rawMethod] ?? "other") : null;

    const roomName = cell(row, "room").toLowerCase();
    const room_id = roomName ? (roomByName.get(roomName) ?? null) : null;

    records.push({
      occurred_at,
      amount,
      label: cell(row, "label") || "รายได้นำเข้า",
      category,
      method,
      customer_name: cell(row, "customer_name") || null,
      room_id,
      note: cell(row, "note") || null,
      source: "import",
      import_batch: batch,
    });
  });

  if (records.length === 0) {
    return NextResponse.json(
      { error: "ไม่มีแถวที่นำเข้าได้", inserted: 0, skipped: errors.length, errors: errors.slice(0, 20) },
      { status: 422 },
    );
  }

  const { error } = await admin.from("revenue_entries").insert(records);
  if (error) {
    return NextResponse.json(
      { error: `บันทึกไม่สำเร็จ: ${error.message} — รัน migration 019 แล้วหรือยัง?` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    inserted: records.length,
    skipped: errors.length,
    errors: errors.slice(0, 20),
    batch,
  });
}
