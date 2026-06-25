import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Panel, EmptyState } from "@/components/admin/ui";
import { SubHeader } from "../SubHeader";

export const dynamic = "force-dynamic";

type Row = { id: string; actor: string | null; action: string; detail: unknown; created_at: string };

const ACTION_LABEL: Record<string, string> = {
  "admin.login": "เข้าสู่ระบบ",
  "settings.update": "แก้ไขการตั้งค่า",
  "security.password_change": "เปลี่ยนรหัสผ่าน",
  "backup.export": "ดาวน์โหลดข้อมูล",
  "cron.clear_expired": "รันเคลียร์จองหมดเวลา",
  "booking.status": "เปลี่ยนสถานะการจอง",
};

export default async function AuditLogPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");

  let rows: Row[] = [];
  let unavailable = false;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("admin_audit_log")
      .select("id, actor, action, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) unavailable = true;
    else rows = (data ?? []) as Row[];
  } catch {
    unavailable = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="บันทึกการใช้งาน (Audit Log)" description="ใครทำอะไรในระบบหลังบ้าน เมื่อไหร่" />

      {unavailable ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ยังอ่านข้อมูลไม่ได้ — ตรวจว่ารัน migration <strong>016_settings_kv_audit</strong> แล้ว
        </div>
      ) : (
        <Panel title={`ล่าสุด ${rows.length} รายการ`} bodyClassName="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState>ยังไม่มีบันทึก — รายการจะถูกเก็บเมื่อแอดมินทำงานในระบบ</EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--color-bone-soft)]/50 text-left text-[11px] uppercase tracking-wide text-[color:var(--color-forest-deep)]/60">
                  <tr>
                    <th className="px-5 py-3 font-medium">เวลา</th>
                    <th className="px-5 py-3 font-medium">ผู้ใช้</th>
                    <th className="px-5 py-3 font-medium">การกระทำ</th>
                    <th className="px-5 py-3 font-medium">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-[color:var(--color-forest-deep)]/8">
                      <td className="whitespace-nowrap px-5 py-3 text-[color:var(--color-ink)]/70">
                        {new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-forest-deep)]">{r.actor ?? "—"}</td>
                      <td className="px-5 py-3">{ACTION_LABEL[r.action] ?? r.action}</td>
                      <td className="px-5 py-3 text-xs text-[color:var(--color-ink)]/50">
                        {r.detail && Object.keys(r.detail as object).length > 0 ? JSON.stringify(r.detail) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
