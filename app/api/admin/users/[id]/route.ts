import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { hashPassword, SECTION_KEYS, type SectionKey } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_FIELDS = "id, username, role, permissions, is_active, created_at";

type Ctx = { params: Promise<{ id: string }> };

function cleanPermissions(value: unknown): SectionKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is SectionKey => SECTION_KEYS.includes(p as SectionKey));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("users");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: { permissions?: unknown; role?: string; is_active?: boolean; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Load target to apply role-based guards.
  const { data: target } = await admin
    .from("admin_accounts")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  // Only super_admin may modify a super_admin or grant the super_admin role.
  const touchesSuper = target.role === "super_admin" || body.role === "super_admin";
  if (touchesSuper && auth.session.role !== "super_admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข super admin" }, { status: 403 });
  }
  // Can't deactivate your own account (avoid lockout).
  if (id === auth.session.id && body.is_active === false) {
    return NextResponse.json({ error: "ปิดบัญชีตัวเองไม่ได้" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.permissions !== undefined) update.permissions = cleanPermissions(body.permissions);
  if (body.role !== undefined) update.role = body.role === "super_admin" ? "super_admin" : "admin";
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);
  if (body.password !== undefined) {
    if (String(body.password).length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    update.password_hash = hashPassword(String(body.password));
  }
  // super_admin permissions are implicit (all); keep them empty.
  if (update.role === "super_admin") update.permissions = [];

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("admin_accounts")
    .update(update)
    .eq("id", id)
    .select(LIST_FIELDS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json({ user: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSection("users");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  if (id === auth.session.id) {
    return NextResponse.json({ error: "ลบบัญชีตัวเองไม่ได้" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: target } = await admin
    .from("admin_accounts")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  if (target?.role === "super_admin" && auth.session.role !== "super_admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ลบ super admin" }, { status: 403 });
  }

  const { error } = await admin.from("admin_accounts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
