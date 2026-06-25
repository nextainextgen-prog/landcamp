import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { hashPassword, SECTION_KEYS, type SectionKey } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_FIELDS = "id, username, role, permissions, is_active, created_at";

function cleanPermissions(value: unknown): SectionKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is SectionKey => SECTION_KEYS.includes(p as SectionKey));
}

export async function GET() {
  const auth = await requireSection("users");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_accounts")
    .select(LIST_FIELDS)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("users");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { username?: string; password?: string; role?: string; permissions?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password ?? "";
  const role = body.role === "super_admin" ? "super_admin" : "admin";

  if (!username) return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้" }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }
  // Only a super_admin may create another super_admin.
  if (role === "super_admin" && auth.session.role !== "super_admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์สร้าง super admin" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_accounts")
    .insert({
      username,
      password_hash: hashPassword(password),
      role,
      permissions: role === "super_admin" ? [] : cleanPermissions(body.permissions),
      is_active: true,
    })
    .select(LIST_FIELDS)
    .single();

  if (error) {
    const msg = error.code === "23505" ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ user: data }, { status: 201 });
}
