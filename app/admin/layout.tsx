import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
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

  // Not signed in → full-page login (no nav, no children).
  if (!session) {
    return <AdminLogin />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 md:flex-row">
      <aside className="w-full border-b border-neutral-200 bg-white md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r">
        <div className="px-5 py-4 border-b border-neutral-200">
          <div className="text-lg font-semibold tracking-tight">LandCamp</div>
          <div className="text-xs text-neutral-500">{session.username}</div>
        </div>
        <AdminNav
          role={session.role}
          permissions={session.permissions}
        />
      </aside>
      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
