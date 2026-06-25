import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { bangkokToday } from "@/lib/revenue/metrics";
import type { RevBooking, RevPayment, RevEntry } from "@/lib/revenue/metrics";
import { RevenueReport, type RevenueData } from "./RevenueReport";

export const dynamic = "force-dynamic";

// Wrapped so the impure Date.now() call lives outside the component render.
function resolveToday(): string {
  return bangkokToday(Date.now());
}

export default async function AdminRevenuePage() {
  if (!(await requireSection("revenue")).ok) redirect("/admin");

  let errorMsg: string | null = null;
  const today = resolveToday();
  let data: RevenueData | null = null;

  try {
    const admin = createAdminClient();

    const [bookingsRes, paymentsRes, roomsRes, customersRes] = await Promise.all([
      admin
        .from("bookings")
        .select("id, booking_code, room_id, customer_id, status, total_amount, check_in, created_at, source")
        .order("created_at", { ascending: false }),
      admin.from("payments").select("id, booking_id, amount, status, method, paid_at, created_at"),
      admin.from("rooms").select("id, name_th").order("name_th"),
      admin.from("customers").select("id, full_name"),
    ]);
    if (bookingsRes.error) throw bookingsRes.error;

    // revenue_entries is optional — tolerate a missing table (migration 019 not run yet).
    const entriesRes = await admin
      .from("revenue_entries")
      .select("id, occurred_at, label, category, amount, method, customer_name, room_id, source")
      .order("occurred_at", { ascending: false });

    const bookings: RevBooking[] = (bookingsRes.data ?? []).map((b) => ({
      id: b.id as string,
      booking_code: b.booking_code as string,
      room_id: (b.room_id as string) ?? null,
      customer_id: (b.customer_id as string) ?? null,
      status: b.status as string,
      total_amount: (b.total_amount as number) ?? 0,
      check_in: (b.check_in as string) ?? null,
      created_at: b.created_at as string,
      source: (b.source as string) ?? null,
    }));

    const payments: RevPayment[] = (paymentsRes.data ?? []).map((p) => ({
      id: p.id as string,
      booking_id: p.booking_id as string,
      amount: (p.amount as number) ?? 0,
      status: p.status as string,
      method: (p.method as string) ?? null,
      paid_at: (p.paid_at as string) ?? null,
      created_at: p.created_at as string,
    }));

    const entries: RevEntry[] = (entriesRes.data ?? []).map((e) => ({
      id: e.id as string,
      occurred_at: e.occurred_at as string,
      label: e.label as string,
      category: (e.category as string) ?? "other",
      amount: (e.amount as number) ?? 0,
      method: (e.method as string) ?? null,
      customer_name: (e.customer_name as string) ?? null,
      room_id: (e.room_id as string) ?? null,
      source: (e.source as string) ?? "manual",
    }));

    // Earliest data point → the "ทั้งหมด" preset lower bound.
    let earliest = today;
    for (const d of [
      ...bookings.map((b) => b.created_at.slice(0, 10)),
      ...payments.map((p) => (p.paid_at ?? p.created_at).slice(0, 10)),
      ...entries.map((e) => e.occurred_at.slice(0, 10)),
    ]) {
      if (d && d < earliest) earliest = d;
    }

    data = {
      bookings,
      payments,
      entries,
      rooms: (roomsRes.data ?? []).map((r) => ({ id: r.id as string, name: r.name_th as string })),
      customers: (customersRes.data ?? []).map((c) => [c.id as string, (c.full_name as string) ?? "—"] as [string, string]),
      today,
      earliest,
    };
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load revenue";
  }

  if (errorMsg || !data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        โหลดข้อมูลไม่สำเร็จ: {errorMsg ?? "unknown error"}
      </div>
    );
  }

  return <RevenueReport {...data} />;
}
