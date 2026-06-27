import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SettingsSidebar } from "./SettingsSidebar";

export const dynamic = "force-dynamic";

/**
 * Shared frame for the whole /admin/settings area. Guards the section once and
 * renders a persistent navigation sidebar next to every settings sub-page, so
 * admins can jump between sections without returning to the hub. Each sub-page
 * keeps its own requireSection guard as defence-in-depth.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireSection("settings");
  if (!auth.ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <SettingsSidebar role={auth.role} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
