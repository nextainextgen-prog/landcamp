import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// TODO(sprint-1 §1.4): replace this stub with a real admin_users check.
// For now we just require *some* signal — header `x-admin-bypass=1` in dev,
// or any non-empty `admin-session` cookie. Real RLS + admin_users lookup
// lands when codex-3 wires the API auth.
async function requireAdmin(): Promise<void> {
  const h = await headers();
  const bypass = h.get("x-admin-bypass");
  const cookie = h.get("cookie") ?? "";
  const hasAdminCookie = /(?:^|;\s*)admin-session=[^;]+/.test(cookie);
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) return;
  if (bypass === "1") return;
  if (hasAdminCookie) return;

  redirect("/");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

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
