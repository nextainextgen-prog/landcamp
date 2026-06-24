import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersList, type CustomerRow } from "./CustomersList";

export const dynamic = "force-dynamic";

const EARNING_STATUSES = new Set(["confirmed", "completed"]);

export default async function AdminCustomersPage() {
  if (!(await requireSection("customers")).ok) redirect("/admin");

  let rows: CustomerRow[] = [];
  let errorMsg: string | null = null;

  try {
    const admin = createAdminClient();
    const [{ data: customers }, { data: bookings }] = await Promise.all([
      admin
        .from("customers")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false }),
      admin.from("bookings").select("customer_id, status, total_amount, created_at"),
    ]);

    const agg = new Map<string, { count: number; spent: number; last: string | null }>();
    for (const b of bookings ?? []) {
      const cid = b.customer_id as string;
      const cur = agg.get(cid) ?? { count: 0, spent: 0, last: null };
      cur.count += 1;
      if (EARNING_STATUSES.has(b.status as string)) cur.spent += (b.total_amount as number) ?? 0;
      const created = b.created_at as string;
      if (!cur.last || created > cur.last) cur.last = created;
      agg.set(cid, cur);
    }

    rows = (customers ?? []).map((c) => {
      const a = agg.get(c.id as string);
      return {
        id: c.id as string,
        name: (c.full_name as string) ?? "—",
        email: (c.email as string) ?? "—",
        phone: (c.phone as string) ?? "",
        bookings_count: a?.count ?? 0,
        total_spent: a?.spent ?? 0,
        last_booking: a?.last ?? null,
      };
    });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load customers";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">ลูกค้า</h1>
        <p className="text-sm text-neutral-500">รายชื่อลูกค้าและประวัติการจอง</p>
      </header>
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <CustomersList initialRows={rows} />
      )}
    </div>
  );
}
