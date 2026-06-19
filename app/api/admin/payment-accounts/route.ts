import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentAccount } from "@/types/payment-settings";
import { validatePaymentAccountInput } from "@/lib/validators/payment-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "payment_accounts";

function errorResponse(
  error: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    fields ? { error, fields } : { error },
    { status },
  );
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return errorResponse((err as Error).message, 500);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ accounts: (data ?? []) as PaymentAccount[] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid JSON body", 400);
  }

  const result = validatePaymentAccountInput(body);
  if (!result.ok) return errorResponse("validation failed", 400, result.fields);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return errorResponse((err as Error).message, 500);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(result.data)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 500);

  return NextResponse.json(
    { account: data as PaymentAccount },
    { status: 201 },
  );
}
