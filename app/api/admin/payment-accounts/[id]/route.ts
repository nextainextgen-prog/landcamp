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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const { id } = await ctx.params;
  if (!id) return errorResponse("missing id", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid JSON body", 400);
  }

  const result = validatePaymentAccountInput(body, { partial: true });
  if (!result.ok) return errorResponse("validation failed", 400, result.fields);

  if (Object.keys(result.data).length === 0) {
    return errorResponse("no fields to update", 400);
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return errorResponse((err as Error).message, 500);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(result.data)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return errorResponse("account not found", 404);

  return NextResponse.json({ account: data as PaymentAccount });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const { id } = await ctx.params;
  if (!id) return errorResponse("missing id", 400);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return errorResponse((err as Error).message, 500);
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ ok: true });
}
