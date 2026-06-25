import { redirect } from "next/navigation";

import { canAccess, firstAllowedSection, getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const session = await getAdminSession();
  if (!session) return null; // layout shows the login screen

  // The booking calendar is the home for anyone who can see bookings.
  if (canAccess(session, "bookings")) redirect("/admin/calendar");

  const section = firstAllowedSection(session);
  if (section) redirect(`/admin/${section}`);

  return (
    <div className="rounded-xl border border-[color:var(--color-forest-deep)]/15 bg-white p-6 text-sm text-[color:var(--color-ink)]/55">
      บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าถึงเมนูใด — ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
    </div>
  );
}
