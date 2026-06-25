import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bulk-import customers from a parsed CSV (sent as JSON rows).
 *
 * Phone is mandatory for every customer, so rows without a name or phone are
 * rejected. Existing customers (matched by phone) are skipped as duplicates —
 * import only adds new manual records, never overwrites.
 */

type InRow = { name?: string; phone?: string; email?: string; tags?: string[] };

function normPhone(raw: string): string {
  // Keep digits and a leading +, drop spaces / dashes / parentheses.
  const t = raw.trim().replace(/[^\d+]/g, "");
  return t;
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("customers");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const rawRows = (body as { rows?: InRow[] })?.rows;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้นำเข้า" }, { status: 400 });
  }
  if (rawRows.length > 2000) {
    return NextResponse.json({ error: "นำเข้าได้สูงสุด 2000 รายการต่อครั้ง" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "supabase unavailable" },
      { status: 500 },
    );
  }

  // Validate + normalise.
  const errors: string[] = [];
  const cleaned: { full_name: string; phone: string; email: string | null; tags: string[] }[] = [];
  const seenInFile = new Set<string>();

  rawRows.forEach((r, i) => {
    const name = (r.name ?? "").trim();
    const phone = normPhone(r.phone ?? "");
    const line = i + 1;
    if (!name) {
      errors.push(`แถว ${line}: ไม่มีชื่อ`);
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      errors.push(`แถว ${line}: เบอร์โทรไม่ถูกต้อง (${name})`);
      return;
    }
    if (seenInFile.has(phone)) {
      errors.push(`แถว ${line}: เบอร์ซ้ำในไฟล์ (${phone})`);
      return;
    }
    seenInFile.add(phone);
    const email = (r.email ?? "").trim();
    const tags = Array.isArray(r.tags) ? r.tags.map((t) => t.trim()).filter(Boolean) : [];
    cleaned.push({ full_name: name, phone, email: email || null, tags });
  });

  if (cleaned.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, errors }, { status: errors.length ? 422 : 400 });
  }

  // Skip phones that already exist.
  const phones = cleaned.map((c) => c.phone);
  const { data: existing } = await admin
    .from("customers")
    .select("phone")
    .in("phone", phones);
  const existingSet = new Set((existing ?? []).map((e) => e.phone as string));

  const toInsert = cleaned
    .filter((c) => !existingSet.has(c.phone))
    .map((c) => ({
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      tags: c.tags,
      source: "manual",
    }));

  const skipped = cleaned.length - toInsert.length;

  let created = 0;
  if (toInsert.length > 0) {
    const { data, error } = await admin.from("customers").insert(toInsert).select("id");
    if (error) {
      return NextResponse.json({ error: error.message, created: 0, skipped, errors }, { status: 500 });
    }
    created = data?.length ?? 0;
  }

  return NextResponse.json({ created, skipped, errors });
}
