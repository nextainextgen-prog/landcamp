import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getAdminSession } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) return <AdminLogin />;

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
    <AdminShell
      username={session.username}
      role={session.role}
      permissions={session.permissions}
      pendingReview={pendingReview}
    >
      {children}
    </AdminShell>
  );
}
