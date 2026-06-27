import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { SubHeader } from "../SubHeader";
import { ReceiptSettingsEditor } from "./ReceiptSettingsEditor";

export const dynamic = "force-dynamic";

export default async function ReceiptSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader
        title="ใบเสร็จรับเงิน"
        description="แก้ไขข้อความบนเอกสารใบเสร็จ/ใบยืนยันการจอง พร้อมดูตัวอย่างจริงแบบสด"
      />
      <ReceiptSettingsEditor />
    </div>
  );
}
