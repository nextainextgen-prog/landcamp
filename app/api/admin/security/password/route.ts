import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { hashPassword, verifyPassword } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lets the signed-in admin change their own password. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { current?: string; next?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const current = body.current ?? "";
  const next = body.next ?? "";
  if (next.length < 6) {
    return NextResponse.json({ error: "รหัสใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data: account } = await admin
    .from("admin_accounts")
    .select("id, password_hash")
    .eq("id", auth.userId)
    .maybeSingle();
  if (!account || !verifyPassword(current, account.password_hash as string)) {
    return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 400 });
  }

  const { error } = await admin
    .from("admin_accounts")
    .update({ password_hash: hashPassword(next) })
    .eq("id", auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(auth.session.username, "security.password_change");
  return NextResponse.json({ ok: true });
}
