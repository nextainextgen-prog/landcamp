import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Global admin quick-search — customers by name / phone / email, and bookings
 * by booking code. Powers the topbar search box.
 */

type Hit = {
  id: string;
  kind: "customer" | "booking";
  title: string;
  subtitle: string;
  href: string;
};

function escapeLike(q: string): string {
  // Neutralise PostgREST ilike wildcards so user input is matched literally.
  return q.replace(/[%_,()]/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const q = escapeLike(raw);
  if (q.length < 1) return NextResponse.json({ items: [] });

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "supabase unavailable" },
      { status: 500 },
    );
  }

  const like = `%${q}%`;

  const [{ data: customers }, { data: bookings }] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, email, phone, is_vip, created_at")
      .or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("bookings")
      .select("id, booking_code, status, check_in")
      .ilike("booking_code", like)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: Hit[] = [];

  for (const c of customers ?? []) {
    const parts = [c.phone, c.email].filter(Boolean) as string[];
    items.push({
      id: c.id as string,
      kind: "customer",
      title: `${(c.full_name as string) || "ลูกค้า"}${c.is_vip ? " ⭐" : ""}`,
      subtitle: parts.join(" · ") || "ไม่มีข้อมูลติดต่อ",
      href: `/admin/customers/${c.id}`,
    });
  }

  for (const b of bookings ?? []) {
    items.push({
      id: b.id as string,
      kind: "booking",
      title: (b.booking_code as string) || "—",
      subtitle: `สถานะ ${b.status} · เข้าพัก ${b.check_in ?? "—"}`,
      href: "/admin/bookings",
    });
  }

  return NextResponse.json({ items });
}
