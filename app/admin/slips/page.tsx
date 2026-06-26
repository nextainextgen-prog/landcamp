import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { bangkokToday } from "@/lib/revenue/metrics";
import { SlipsManager, type SlipRow } from "./SlipsManager";

export const dynamic = "force-dynamic";

// Wrapped so the impure Date.now() call lives outside the component render.
function resolveToday(): string {
  return bangkokToday(Date.now());
}

export default async function AdminSlipsPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  let rows: SlipRow[] = [];
  let errorMsg: string | null = null;
  const today = resolveToday();
  let earliest = today;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("slip_verifications")
      .select(
        "id, created_at, booking_id, api_success, verify_status, is_duplicate, trans_ref, amount_in_slip, amount_expected, is_amount_matched, sender_name, sender_bank, receiver_name, receiver_bank, receiver_account, slip_paid_at, ref1, slip_url, message",
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;

    const list = data ?? [];

    // Booking codes (for a friendly reference alongside the trans ref).
    const bookingIds = [...new Set(list.map((r) => r.booking_id).filter(Boolean))] as string[];
    const codeMap = new Map<string, string>();
    if (bookingIds.length) {
      const { data: bks } = await admin
        .from("bookings")
        .select("id, booking_code")
        .in("id", bookingIds);
      for (const b of bks ?? []) codeMap.set(b.id as string, (b.booking_code as string) ?? "");
    }

    // Signed URLs for the private slip images (1h).
    const slipPaths = list
      .map((r) => r.slip_url as string | null)
      .filter((v): v is string => Boolean(v));
    const signed = new Map<string, string>();
    if (slipPaths.length) {
      const { data: signedData } = await admin.storage.from("slips").createSignedUrls(slipPaths, 3600);
      for (const s of signedData ?? []) {
        if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
      }
    }

    rows = list.map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      booking_code: r.booking_id ? codeMap.get(r.booking_id as string) ?? null : null,
      api_success: r.api_success === true,
      verify_status: (r.verify_status as string) ?? "pending",
      is_duplicate: r.is_duplicate === true,
      trans_ref: (r.trans_ref as string) ?? null,
      amount_in_slip: r.amount_in_slip != null ? Number(r.amount_in_slip) : null,
      amount_expected: r.amount_expected != null ? Number(r.amount_expected) : null,
      is_amount_matched: r.is_amount_matched === true,
      sender_name: (r.sender_name as string) ?? null,
      sender_bank: (r.sender_bank as string) ?? null,
      receiver_name: (r.receiver_name as string) ?? null,
      receiver_bank: (r.receiver_bank as string) ?? null,
      receiver_account: (r.receiver_account as string) ?? null,
      slip_paid_at: (r.slip_paid_at as string) ?? null,
      message: (r.message as string) ?? null,
      slip_image: r.slip_url ? signed.get(r.slip_url as string) ?? null : null,
    }));

    if (rows.length > 0) {
      earliest = rows[rows.length - 1].created_at.slice(0, 10);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load slip history";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ประวัติการตรวจสลิป"
        description="ทุกครั้งที่ลูกค้าแนบสลิป ระบบตรวจกับ EasySlip อัตโนมัติ (ยอด · บัญชีปลายทาง · สลิปซ้ำ) — บันทึกผลทุกครั้งไว้ที่นี่"
      />
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <SlipsManager initialRows={rows} today={today} earliest={earliest} />
      )}
    </div>
  );
}
