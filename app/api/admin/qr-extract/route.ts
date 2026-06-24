import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { verifyBankSlip } from "@/lib/easyslip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 6_000_000;

/**
 * Reads a receiving-QR image (e.g. a K+ Thai QR Payment slip-style QR) via
 * EasySlip OCR and returns the account holder's Thai/English name so the admin
 * form can auto-fill it. Best-effort: returns nulls if nothing was readable.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { base64?: string };
  try {
    body = (await req.json()) as { base64?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.base64) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }
  if (body.base64.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: "image too large" }, { status: 413 });
  }
  const base64 = body.base64.includes(",") ? body.base64.split(",")[1] : body.base64;

  try {
    const v = await verifyBankSlip({ base64 });
    // Prefer the receiver (the account being paid); fall back to sender.
    const nameTh = v.receiverNameTh ?? null;
    const nameEn = v.receiverNameEn ?? null;
    return NextResponse.json({
      ok: true,
      name_th: nameTh,
      name_en: nameEn,
      found: Boolean(nameTh || nameEn),
    });
  } catch (err) {
    // Non-fatal — the admin can type the names manually.
    return NextResponse.json({
      ok: false,
      found: false,
      error: err instanceof Error ? err.message : "could not read QR",
    });
  }
}
