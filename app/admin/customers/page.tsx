import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersList, type CustomerRow, type CustomerStats } from "./CustomersList";

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
        .select(
          "id, full_name, email, phone, created_at, is_vip, tags, source, auth_provider, profile_completed_at",
        )
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
      const source = (c.source as string) ?? "online";
      const provider = (c.auth_provider as string) ?? null;
      const channel: CustomerRow["channel"] =
        source === "walk_in"
          ? "walk_in"
          : provider === "line" || provider === "google"
            ? provider
            : "online";
      return {
        id: c.id as string,
        name: (c.full_name as string) ?? "—",
        email: (c.email as string) ?? "—",
        phone: (c.phone as string) ?? "",
        created_at: c.created_at as string,
        is_vip: Boolean(c.is_vip),
        tags: (c.tags as string[]) ?? [],
        channel,
        profile_complete: c.profile_completed_at != null,
        bookings_count: a?.count ?? 0,
        total_spent: a?.spent ?? 0,
        last_booking: a?.last ?? null,
      };
    });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load customers";
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const stats: CustomerStats = {
    total: rows.length,
    newThisMonth: rows.filter((r) => new Date(r.created_at).getTime() >= monthStart).length,
    vip: rows.filter((r) => r.is_vip).length,
    revenue: rows.reduce((s, r) => s + r.total_spent, 0),
    withPhone: rows.filter((r) => r.phone.trim().length > 0).length,
  };

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        โหลดข้อมูลไม่สำเร็จ: {errorMsg}
      </div>
    );
  }

  return <CustomersList initialRows={rows} stats={stats} />;
}
