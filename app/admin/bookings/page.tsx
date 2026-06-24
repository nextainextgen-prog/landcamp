import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingReviewList, type ReviewRow } from "./BookingReviewList";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  let rows: ReviewRow[] = [];
  let errorMsg: string | null = null;

  try {
    const admin = createAdminClient();

    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "id, booking_code, room_id, customer_id, check_in, check_out, adults, children, status, total_amount, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(60);

    const list = bookings ?? [];
    const ids = list.map((b) => b.id as string);
    const roomIds = [...new Set(list.map((b) => b.room_id as string))];
    const customerIds = [...new Set(list.map((b) => b.customer_id as string))];

    const [{ data: payments }, { data: rooms }, { data: customers }] = await Promise.all([
      ids.length
        ? admin
            .from("payments")
            .select("booking_id, amount, kind, status, verify_status, verify_note, slip_image, created_at")
            .in("booking_id", ids)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      roomIds.length
        ? admin.from("rooms").select("id, name_th").in("id", roomIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      customerIds.length
        ? admin.from("customers").select("id, full_name, email, phone").in("id", customerIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

    const roomName = new Map((rooms ?? []).map((r) => [r.id as string, r.name_th as string]));
    const customerMap = new Map(
      (customers ?? []).map((c) => [
        c.id as string,
        {
          name: (c.full_name as string) ?? "—",
          email: (c.email as string) ?? "",
          phone: (c.phone as string) ?? "",
        },
      ]),
    );
    // Keep only the latest payment per booking (payments already desc by created_at).
    const latestPayment = new Map<string, Record<string, unknown>>();
    for (const p of payments ?? []) {
      const bid = p.booking_id as string;
      if (!latestPayment.has(bid)) latestPayment.set(bid, p);
    }

    rows = list.map((b) => {
      const p = latestPayment.get(b.id as string);
      const c = customerMap.get(b.customer_id as string);
      return {
        id: b.id as string,
        booking_code: b.booking_code as string,
        room_name: roomName.get(b.room_id as string) ?? (b.room_id as string).slice(0, 8),
        customer_name: c?.name ?? "—",
        customer_email: c?.email ?? "",
        customer_phone: c?.phone ?? "",
        check_in: b.check_in as string,
        check_out: b.check_out as string,
        adults: b.adults as number,
        children: b.children as number,
        status: b.status as ReviewRow["status"],
        total_amount: b.total_amount as number,
        payment: p
          ? {
              amount: p.amount as number,
              kind: p.kind as string,
              status: p.status as string,
              verify_status: (p.verify_status as string) ?? null,
              verify_note: (p.verify_note as string) ?? null,
              slip_image: (p.slip_image as string) ?? null,
            }
          : null,
      };
    });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load bookings";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">รายการจอง</h1>
        <p className="text-sm text-neutral-500">
          ตรวจสอบสลิปและยืนยันการจอง — ผลตรวจสลิปอัตโนมัติแสดงเฉพาะหน้านี้
        </p>
      </header>

      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <BookingReviewList initialRows={rows} />
      )}
    </div>
  );
}
