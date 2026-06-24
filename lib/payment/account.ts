import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentKind } from "@/types/payment";
import type { PaymentAccount } from "@/types/payment-settings";

/** All active payment accounts (any type), ordered for display. */
export async function getActivePaymentAccounts(
  admin: SupabaseClient,
): Promise<PaymentAccount[]> {
  const { data } = await admin
    .from("payment_accounts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");
  return (data ?? []) as PaymentAccount[];
}

export type DepositPlan = { amount: number; kind: PaymentKind; depositPercent: number | null };

/**
 * Resolves how much to charge now from the singleton payment_settings:
 * a deposit (percentage of total, rounded up) when enabled, else the full
 * total. Reads /admin/payment-settings config.
 */
export async function resolveAmountDue(
  admin: SupabaseClient,
  total: number,
): Promise<DepositPlan> {
  const { data } = await admin
    .from("payment_settings")
    .select("deposit_enabled, deposit_percent")
    .eq("id", 1)
    .maybeSingle();

  if (data?.deposit_enabled) {
    const percent = data.deposit_percent ?? 50;
    return { amount: Math.ceil((total * percent) / 100), kind: "deposit", depositPercent: percent };
  }
  return { amount: total, kind: "full", depositPercent: null };
}
