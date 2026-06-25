import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { SecurityForm } from "./SecurityForm";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="ความปลอดภัย" description="เปลี่ยนรหัสผ่านบัญชีแอดมินของคุณ" />
      <SecurityForm />
    </div>
  );
}
