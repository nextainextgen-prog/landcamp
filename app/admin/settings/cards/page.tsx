import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { CARD_DEFAULTS } from "@/lib/line/cards";
import { SubHeader } from "../SubHeader";
import { CardEditor } from "./CardEditor";

export const dynamic = "force-dynamic";

export default async function CardsSettingsPage() {
  if (!(await requireSection("settings")).ok) redirect("/admin");

  return (
    <div className="flex flex-col gap-6">
      <SubHeader title="การ์ด LINE" description="ตกแต่งการ์ดที่ส่งหาลูกค้า — ใส่รูป ข้อความ และปุ่มได้เอง" />

      <div className="rounded-lg bg-[color:var(--color-bone-soft)]/50 p-4 text-xs leading-relaxed text-[color:var(--color-ink)]/70">
        ใช้ตัวแปรในข้อความ/ลิงก์ได้: <code>{"{{name}}"}</code> <code>{"{{booking_code}}"}</code>{" "}
        <code>{"{{room}}"}</code> <code>{"{{check_in}}"}</code> <code>{"{{check_out}}"}</code>{" "}
        <code>{"{{total}}"}</code> <code>{"{{receipt_url}}"}</code> (ลิงก์ใบจอง){" "}
        <code>{"{{map_url}}"}</code> (ลิงก์แผนที่) — ระบบจะแทนค่าจริงตอนส่ง
      </div>

      <CardEditor settingKey="card_confirm" title="การ์ดยืนยันการจอง (ส่งเมื่อแอดมินยืนยัน)" defaults={CARD_DEFAULTS.card_confirm} />
      <CardEditor settingKey="card_reminder" title="การ์ดเตือนก่อนวันเข้าพัก" defaults={CARD_DEFAULTS.card_reminder} />
    </div>
  );
}
