import { redirect } from "next/navigation";

import { firstAllowedSection, getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const session = await getAdminSession();
  const section = session ? firstAllowedSection(session) : null;
  if (section) redirect(`/admin/${section}`);

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
      บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าถึงเมนูใด — ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
    </div>
  );
}
