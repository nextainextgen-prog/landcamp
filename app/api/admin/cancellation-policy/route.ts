import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CancellationPolicyTier } from "@/types/payment-settings";

type CancellationPolicyResponse = {
  enabled: boolean;
  tiers: CancellationPolicyTier[];
};
import { validateCancellationPolicyInput } from "@/lib/validators/payment-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLICY_TABLE = "cancellation_policy";
const TIERS_TABLE = "cancellation_policy_tiers";
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

type PolicyRow = { id: number; enabled: boolean };

async function loadPolicy(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ policy: PolicyRow | null; tiers: CancellationPolicyTier[]; error?: string }> {
  const { data: policy, error: policyErr } = await supabase
    .from(POLICY_TABLE)
    .select("*")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (policyErr) return { policy: null, tiers: [], error: policyErr.message };

  const { data: tiers, error: tiersErr } = await supabase
    .from(TIERS_TABLE)
    .select("id,days_before,refund_percent,sort_order")
    .order("sort_order", { ascending: true });
  if (tiersErr) return { policy: null, tiers: [], error: tiersErr.message };

  return {
    policy: (policy as PolicyRow | null) ?? null,
    tiers: (tiers ?? []) as CancellationPolicyTier[],
  };
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

  const { policy, tiers, error } = await loadPolicy(supabase);
  if (error) return errorResponse(error, 500);
  if (!policy) return errorResponse("cancellation policy row not found", 404);

  const payload: CancellationPolicyResponse = { enabled: policy.enabled, tiers };
  return NextResponse.json({ policy: payload });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid JSON body", 400);
  }

  const result = validateCancellationPolicyInput(body);
  if (!result.ok) return errorResponse("validation failed", 400, result.errors);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return errorResponse((err as Error).message, 500);
  }

  // Supabase JS has no client-side transactions — we do the writes
  // sequentially. Order matters: update policy → DELETE tiers → INSERT tiers.
  // If a later step fails the earlier writes are NOT rolled back; the next
  // PUT will reconcile state. TODO: move to a Postgres function (rpc) so
  // the three writes commit atomically.
  const { error: policyErr } = await supabase
    .from(POLICY_TABLE)
    .update({ enabled: result.data.enabled })
    .eq("id", SINGLETON_ID);
  if (policyErr) return errorResponse(policyErr.message, 500);

  const { error: deleteErr } = await supabase
    .from(TIERS_TABLE)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteErr) return errorResponse(deleteErr.message, 500);

  if (result.data.tiers.length > 0) {
    const rows = result.data.tiers.map((t, i) => ({
      days_before: t.days_before,
      refund_percent: t.refund_percent,
      sort_order: i,
    }));
    const { error: insertErr } = await supabase.from(TIERS_TABLE).insert(rows);
    if (insertErr) return errorResponse(insertErr.message, 500);
  }

  const { policy, tiers, error } = await loadPolicy(supabase);
  if (error) return errorResponse(error, 500);
  if (!policy) return errorResponse("cancellation policy row not found", 404);

  const payload: CancellationPolicyResponse = { enabled: policy.enabled, tiers };
  return NextResponse.json({ policy: payload });
}
