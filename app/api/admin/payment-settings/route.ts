import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentSettings } from "@/types/payment-settings";
import { validatePaymentSettingsInput } from "@/lib/validators/payment-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "payment_settings";
const SINGLETON_ID = 1;

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
  const auth = await requireSection("payment-settings");
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
    .eq("id", SINGLETON_ID)
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return errorResponse("payment settings row not found", 404);

  return NextResponse.json({ settings: data as PaymentSettings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSection("payment-settings");
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid JSON body", 400);
  }

  const result = validatePaymentSettingsInput(body);
  if (!result.ok) return errorResponse("validation failed", 400, result.errors);

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
    .eq("id", SINGLETON_ID)
    .select("*")
    .maybeSingle();

  if (error) return errorResponse(error.message, 500);
  if (!data) return errorResponse("payment settings row not found", 404);

  return NextResponse.json({ settings: data as PaymentSettings });
}
