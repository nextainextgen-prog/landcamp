import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getAdminSession } from "@/lib/admin/auth";

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

  return (
    <AdminShell
      username={session.username}
      role={session.role}
      permissions={session.permissions}
    >
      {children}
    </AdminShell>
  );
}
