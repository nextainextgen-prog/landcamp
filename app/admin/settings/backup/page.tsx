import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { Panel } from "@/components/admin/ui";
import { SubHeader } from "../SubHeader";

export const dynamic = "force-dynamic";

const EXPORTS = [
  { type: "bookings", label: "การจองทั้งหมด" },
  { type: "customers", label: "ข้อมูลลูกค้า" },
  { type: "payments", label: "การชำระเงิน" },
];

export default async function BackupSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");
  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="สำรองข้อมูล (Backup)" description="ดาวน์โหลดข้อมูลสำคัญเก็บไว้เป็นไฟล์" />
      <Panel title="ดาวน์โหลดข้อมูล (.json)" bodyClassName="flex flex-col gap-3">
        <p className="text-xs text-[color:var(--color-ink)]/55">
          กดเพื่อดาวน์โหลดข้อมูลล่าสุดเป็นไฟล์ JSON — เก็บไว้เป็นสำเนาสำรองได้
        </p>
        <div className="flex flex-wrap gap-3">
          {EXPORTS.map((e) => (
            <a
              key={e.type}
              href={`/api/admin/backup/export?type=${e.type}`}
              className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-forest-deep)]/20 px-4 py-2.5 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]"
            >
              ⬇ {e.label}
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
