import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AIChatWidget } from "@/components/admin/AIChatWidget";
import { getAdminSession } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "LandCamp · เข้าสู่ระบบหลังบ้าน",
  robots: { index: false, follow: false },
  openGraph: {
    title: "LandCamp Backoffice — เข้าสู่ระบบ",
    description: "ระบบจัดการ LandCamp Villa Khao Yai (เฉพาะเจ้าหน้าที่)",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="admin-type">
        <AdminLogin />
      </div>
    );
  }

  // Work indicator: bookings awaiting slip review.
  let pendingReview = 0;
  try {
    const admin = createSupabaseAdminClient();
    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "payment_review");
    pendingReview = count ?? 0;
  } catch {
    // non-fatal
  }

  return (
    <div className="admin-type">
      <AdminShell
        username={session.username}
        role={session.role}
        permissions={session.permissions}
        pendingReview={pendingReview}
      >
        {children}
      </AdminShell>
      <AIChatWidget />
    </div>
  );
}
