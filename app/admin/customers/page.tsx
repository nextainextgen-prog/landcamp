import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCustomerMetrics } from "@/lib/customers/metrics";
import {
  CustomersList,
  type Channel,
  type CustomerRow,
  type CustomerStats,
  type InitialFilters,
  type SortKey,
} from "./CustomersList";

export const dynamic = "force-dynamic";

const EARNING_STATUSES = new Set(["confirmed", "completed"]);
const CHANNELS = new Set<Channel>(["line", "google", "walk_in", "online"]);
const SORTS = new Set<SortKey>(["name", "bookings", "spent", "last"]);

function parseFilters(sp: Record<string, string | string[] | undefined>): InitialFilters {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const channels = (get("ch") ?? "")
    .split(",")
    .filter((c): c is Channel => CHANNELS.has(c as Channel));
  const sortRaw = get("sort") ?? "";
  const sortKey = SORTS.has(sortRaw as SortKey) ? (sortRaw as SortKey) : "last";
  return {
    q: get("q") ?? "",
    channels,
    sortKey,
    sortDir: get("dir") === "asc" ? "asc" : "desc",
    density: get("d") === "compact" ? "compact" : "comfortable",
  };
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await requireSection("customers")).ok) redirect("/admin");

  const initialFilters = parseFilters(await searchParams);

  let rows: CustomerRow[] = [];
  let allBookings: Record<string, unknown>[] = [];
  let errorMsg: string | null = null;
  const now = new Date();
  const nowMs = now.getTime();

  try {
    const admin = createAdminClient();
    const [{ data: customers }, { data: bookings }] = await Promise.all([
      admin
        .from("customers")
        .select(
          "id, full_name, email, phone, line_user_id, avatar_url, created_at, is_vip, tags, source, auth_provider, profile_completed_at",
        )
        .order("created_at", { ascending: false }),
      admin.from("bookings").select("customer_id, status, total_amount, created_at"),
    ]);

    allBookings = (bookings ?? []) as Record<string, unknown>[];

    const agg = new Map<string, { count: number; stays: number; spent: number; last: string | null }>();
    // Per-customer booking rows so the list can compute the SAME segment as the
    // profile page (computeCustomerMetrics) — keeps the badge consistent.
    const byCust = new Map<string, { status: string; total_amount: number | null; created_at: string }[]>();
    for (const b of bookings ?? []) {
      const cid = b.customer_id as string;
      const list = byCust.get(cid) ?? [];
      list.push({ status: b.status as string, total_amount: (b.total_amount as number) ?? null, created_at: b.created_at as string });
      byCust.set(cid, list);
      const cur = agg.get(cid) ?? { count: 0, stays: 0, spent: 0, last: null };
      cur.count += 1;
      if (EARNING_STATUSES.has(b.status as string)) {
        cur.spent += (b.total_amount as number) ?? 0;
        cur.stays += 1; // actual confirmed/completed stays (drives loyalty tier)
      }
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
        line_user_id: (c.line_user_id as string) ?? null,
        avatarUrl: (c.avatar_url as string) ?? "",
        created_at: c.created_at as string,
        tags: (c.tags as string[]) ?? [],
        channel,
        profile_complete: c.profile_completed_at != null,
        bookings_count: a?.count ?? 0,
        stays: a?.stays ?? 0,
        total_spent: a?.spent ?? 0,
        last_booking: a?.last ?? null,
        segment: computeCustomerMetrics(byCust.get(c.id as string) ?? [], nowMs).segment,
      };
    });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load customers";
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  // Month-over-month aggregates for the KPI trend badges.
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let bookingsThisMonth = 0;
  let bookingsLastMonth = 0;
  for (const b of allBookings) {
    const t = Date.parse(b.created_at as string);
    if (Number.isNaN(t)) continue;
    const earning = EARNING_STATUSES.has(b.status as string);
    const amt = (b.total_amount as number) ?? 0;
    if (t >= monthStart) {
      bookingsThisMonth += 1;
      if (earning) revenueThisMonth += amt;
    } else if (t >= lastMonthStart) {
      bookingsLastMonth += 1;
      if (earning) revenueLastMonth += amt;
    }
  }

  const stats: CustomerStats = {
    total: rows.length,
    newThisMonth: rows.filter((r) => new Date(r.created_at).getTime() >= monthStart).length,
    newLastMonth: rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= lastMonthStart && t < monthStart;
    }).length,
    revenue: rows.reduce((s, r) => s + r.total_spent, 0),
    revenueThisMonth,
    revenueLastMonth,
    bookings: rows.reduce((s, r) => s + r.bookings_count, 0),
    bookingsThisMonth,
    bookingsLastMonth,
  };

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        โหลดข้อมูลไม่สำเร็จ: {errorMsg}
      </div>
    );
  }

  return <CustomersList initialRows={rows} stats={stats} initialFilters={initialFilters} />;
}
