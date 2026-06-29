import { NextResponse, type NextRequest } from "next/server";

import { getCustomerSession } from "@/lib/customer/session";
import { CompleteProfileSchema } from "@/lib/schemas/customer-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read the signed-in customer's own profile (name + phone + completion flag). */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  return NextResponse.json({
    profile: {
      fullName: session.displayName,
      phone: session.phone,
      profileComplete: session.profileComplete,
    },
  });
}

/** Customer completes/updates their own profile (name + phone). */
export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = CompleteProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // The session id is the source of truth — a customer can only edit their own row.
  const update: Record<string, unknown> = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    profile_completed_at: new Date().toISOString(),
  };
  // Email is optional: only set it when given, so leaving it blank never wipes
  // an address the customer (or an admin) already had on file.
  if (parsed.data.email) update.email = parsed.data.email;

  const { data, error } = await admin
    .from("customers")
    .update(update)
    .eq("id", session.id)
    .select("id, full_name, phone, email, profile_completed_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "customer not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    profile: {
      fullName: data.full_name as string,
      phone: data.phone as string,
      email: (data.email as string | null) ?? null,
      profileComplete: data.profile_completed_at != null,
    },
  });
}
