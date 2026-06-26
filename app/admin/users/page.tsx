import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { UsersManager, type AdminAccount } from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const auth = await requireSection("users");
  if (!auth.ok) redirect("/admin");

  let users: AdminAccount[] = [];
  let errorMsg: string | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_accounts")
      .select("id, username, role, permissions, is_active, created_at")
      .order("created_at");
    if (error) throw error;
    users = (data ?? []) as AdminAccount[];
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load users";
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/settings"
        className="text-xs text-[color:var(--color-forest-deep)]/60 transition-colors hover:text-[color:var(--color-warm-clay)]"
      >
        ‹ ตั้งค่าระบบ
      </Link>
      <PageHeader
        title="จัดการผู้ใช้"
        description="เพิ่มผู้ดูแล กำหนดสิทธิ์การเข้าถึงแต่ละเมนู และตั้งรหัสผ่าน"
      />
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <UsersManager
          initialUsers={users}
          currentUserId={auth.session.id}
          isSuperAdmin={auth.session.role === "super_admin"}
        />
      )}
    </div>
  );
}
