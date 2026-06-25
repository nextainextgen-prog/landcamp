import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const username = body.username?.trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const { data: account } = await admin
    .from("admin_accounts")
    .select("id, password_hash, is_active")
    .eq("username", username)
    .maybeSingle();

  // Same response for unknown user / wrong password / inactive — no enumeration.
  if (!account || account.is_active !== true || !verifyPassword(password, account.password_hash)) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const token = signSession(account.id as string, Date.now());
  await logAdminAction(username, "admin.login");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions());
  return res;
}
