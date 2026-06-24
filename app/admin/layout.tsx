import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/guard";

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
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 md:flex-row">
      <aside className="w-full border-b border-neutral-200 bg-white md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r">
        <div className="px-5 py-4 border-b border-neutral-200">
          <div className="text-lg font-semibold tracking-tight">LandCamp</div>
          <div className="text-xs text-neutral-500">ระบบจัดการ</div>
        </div>
        <AdminNav />
      </aside>
      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
