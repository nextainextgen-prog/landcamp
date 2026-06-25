import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SettingsHub } from "./SettingsHub";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const auth = await requireSection("settings");
  if (!auth.ok) redirect("/admin");

  return <SettingsHub role={auth.role} />;
}
