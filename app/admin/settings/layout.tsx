import { getAdminSession } from "@/lib/admin/auth";
import { SettingsNav } from "./SettingsNav";

export const dynamic = "force-dynamic";

/**
 * Wraps every /admin/settings page with the settings-specific left sub-nav
 * (grouped list + search), so the area reads like a dedicated settings app.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const role = session?.role ?? "admin";

  return (
    <div className="flex gap-6">
      <aside className="hidden w-60 flex-shrink-0 lg:block">
        <div className="sticky top-4">
          <SettingsNav role={role} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
