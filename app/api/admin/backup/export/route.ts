import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["bookings", "customers", "payments"]);

/** Downloads a table as a JSON backup file. */
export async function GET(req: NextRequest) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const type = req.nextUrl.searchParams.get("type") ?? "";
  if (!ALLOWED.has(type)) return NextResponse.json({ error: "unknown export type" }, { status: 400 });

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await admin.from(type).select("*").limit(10000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(auth.session.username, "backup.export", { type, rows: data?.length ?? 0 });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data ?? [], null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="landcamp-${type}-${stamp}.json"`,
    },
  });
}
