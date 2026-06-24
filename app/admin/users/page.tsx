import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">จัดการผู้ใช้</h1>
        <p className="text-sm text-neutral-500">
          เพิ่มผู้ดูแล กำหนดสิทธิ์การเข้าถึงแต่ละเมนู และตั้งรหัสผ่าน
        </p>
      </header>
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
